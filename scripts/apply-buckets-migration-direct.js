/**
 * Script para Aplicar Migration de Renomeação de Buckets
 * GolfFox - Padronização de Nomenclatura PT-BR
 * 
 * Usa conexão direta PostgreSQL ao Supabase
 * 
 * Uso:
 *   node scripts/apply-buckets-migration-direct.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Tentar carregar .env (opcional)
try {
    const envPaths = [
        path.join(__dirname, '..', 'apps', 'web', '.env.local'),
        path.join(__dirname, '..', 'apps', 'web', '.env'),
        path.join(__dirname, '..', '.env.local'),
        path.join(__dirname, '..', '.env')
    ];

    for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
            try {
                require('dotenv').config({ path: envPath });
                break;
            } catch (e) {
                // dotenv não disponível, continuar sem ele
            }
        }
    }
} catch (e) {
    // Ignorar erro de dotenv
}

// Construir DATABASE_URL
let DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL ou SUPABASE_DB_URL não configurado');
    console.error('   Configure uma das variáveis de ambiente acima');
    console.error('   Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres');
    process.exit(1);
}

const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function applyMigration() {
    console.log('🚀 Iniciando migração de buckets para Português BR\n');

    try {
        // Conectar ao banco
        console.log('📡 Conectando ao banco de dados...');
        await client.connect();
        console.log('✅ Conectado com sucesso!\n');

        // Ler arquivo de migration
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250128_rename_buckets_pt_br.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Arquivo de migration não encontrado: ${migrationPath}`);
            await client.end();
            process.exit(1);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        console.log('📄 Migration carregada com sucesso');
        console.log(`   Tamanho: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

        // Aplicar migration
        console.log('⚙️  Aplicando migration...\n');
        
        try {
            await client.query(migrationSQL);
            console.log('✅ Migration aplicada com sucesso!\n');
        } catch (error) {
            console.error('❌ Erro ao aplicar migration:', error.message);
            console.error('\n💡 Detalhes do erro:');
            console.error(`   Código: ${error.code}`);
            console.error(`   Posição: ${error.position}`);
            if (error.hint) {
                console.error(`   Dica: ${error.hint}`);
            }
            throw error;
        }

        // Verificar buckets criados
        console.log('🔍 Verificando buckets criados...\n');

        const bucketsQuery = `
            SELECT id, name, public, file_size_limit, allowed_mime_types
            FROM storage.buckets
            WHERE id IN (
                'documentos-veiculo',
                'documentos-motorista',
                'documentos-transportadora',
                'documentos-empresa',
                'fotos-veiculo',
                'avatares',
                'custos'
            )
            ORDER BY id;
        `;

        const { rows: buckets } = await client.query(bucketsQuery);

        if (buckets.length === 0) {
            console.log('⚠️  Nenhum bucket novo encontrado');
        } else {
            console.log(`✅ ${buckets.length} buckets em português encontrados:\n`);
            buckets.forEach(bucket => {
                const publicStatus = bucket.public ? 'público' : 'privado';
                const sizeLimit = bucket.file_size_limit 
                    ? `${(bucket.file_size_limit / 1024 / 1024).toFixed(0)}MB` 
                    : 'sem limite';
                console.log(`   ✅ ${bucket.id}`);
                console.log(`      Status: ${publicStatus}, Limite: ${sizeLimit}`);
            });
        }

        // Verificar objetos migrados
        console.log('\n🔍 Verificando objetos migrados...\n');

        const objectsQuery = `
            SELECT bucket_id, COUNT(*) as total_arquivos
            FROM storage.objects
            WHERE bucket_id IN (
                'documentos-veiculo',
                'documentos-motorista',
                'documentos-transportadora',
                'documentos-empresa',
                'fotos-veiculo',
                'avatares',
                'custos'
            )
            GROUP BY bucket_id
            ORDER BY bucket_id;
        `;

        const { rows: objects } = await client.query(objectsQuery);

        if (objects.length === 0) {
            console.log('⚠️  Nenhum arquivo encontrado nos novos buckets');
            console.log('   (Isso é normal se não havia arquivos nos buckets antigos)');
        } else {
            console.log('✅ Arquivos encontrados nos novos buckets:\n');
            objects.forEach(obj => {
                console.log(`   ✅ ${obj.bucket_id}: ${obj.total_arquivos} arquivo(s)`);
            });
        }

        // Verificar políticas RLS
        console.log('\n🔍 Verificando políticas RLS...\n');

        const policiesQuery = `
            SELECT bucket_id, COUNT(*) as total_politicas
            FROM storage.policies
            WHERE bucket_id IN (
                'documentos-veiculo',
                'documentos-motorista',
                'documentos-transportadora',
                'documentos-empresa',
                'fotos-veiculo',
                'avatares',
                'custos'
            )
            GROUP BY bucket_id
            ORDER BY bucket_id;
        `;

        const { rows: policies } = await client.query(policiesQuery);

        if (policies.length === 0) {
            console.log('⚠️  Nenhuma política RLS encontrada');
        } else {
            console.log('✅ Políticas RLS encontradas:\n');
            policies.forEach(policy => {
                console.log(`   ✅ ${policy.bucket_id}: ${policy.total_politicas} política(s)`);
            });
        }

        console.log('\n📋 Resumo:');
        console.log(`   ✅ Buckets criados: ${buckets.length}/7`);
        console.log(`   ✅ Arquivos migrados: ${objects.reduce((sum, o) => sum + parseInt(o.total_arquivos), 0)}`);
        console.log(`   ✅ Políticas RLS: ${policies.reduce((sum, p) => sum + parseInt(p.total_politicas), 0)}`);

        console.log('\n📋 Próximos passos:');
        console.log('   1. ✅ Migration aplicada');
        console.log('   2. ⏳ Teste uploads e downloads no sistema');
        console.log('   3. ⏳ Verifique se tudo está funcionando');
        console.log('   4. ⏳ Remova buckets antigos (opcional)');
        console.log('\n📖 Documentação: docs/MIGRACAO_BUCKETS_PT_BR.md\n');

    } catch (error) {
        console.error('\n❌ Erro ao aplicar migration:', error.message);
        console.error('\n💡 Solução alternativa:');
        console.error('   1. Acesse Supabase Dashboard → SQL Editor');
        console.error('   2. Execute o arquivo: supabase/migrations/20250128_rename_buckets_pt_br.sql');
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Executar
applyMigration()
    .then(() => {
        console.log('✅ Processo concluído!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });

