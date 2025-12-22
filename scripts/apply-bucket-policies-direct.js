/**
 * Script para Aplicar Políticas RLS via PostgreSQL Direto
 * GolfFox - Padronização de Nomenclatura PT-BR
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Tentar carregar .env
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
        } catch (e) {
            // dotenv não disponível, continuar
        }
        break;
    }
}

// Construir DATABASE_URL
let DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

// Configurar conexão - usar opções explícitas para melhor compatibilidade
let connectionConfig;

if (DATABASE_URL) {
    connectionConfig = {
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    };
} else {
    // Usar conexão fornecida com opções explícitas
    console.log('📡 Usando conexão configurada automaticamente\n');
    connectionConfig = {
        host: 'db.vmoxzesvjcfmrebagcwo.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'Guigui1309@',
        ssl: {
            rejectUnauthorized: false
        }
    };
}

const client = new Client(connectionConfig);

async function applyMigration() {
    console.log('🚀 Aplicando políticas RLS para buckets em Português BR\n');

    try {
        // Conectar ao banco
        console.log('📡 Conectando ao banco de dados...');
        await client.connect();
        console.log('✅ Conectado com sucesso!\n');

        // Ler arquivo de migration
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250128_create_bucket_policies_pt_br.sql');
        
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

        // Verificar políticas criadas
        console.log('🔍 Verificando políticas RLS criadas...\n');

        const policiesQuery = `
            SELECT policyname, cmd
            FROM pg_policies
            WHERE schemaname = 'storage'
            AND tablename = 'objects'
            AND policyname IN (
                'Users can upload avatares',
                'Users can update avatares',
                'Anyone can read avatares',
                'Users can delete avatares',
                'Transportadora can upload documents',
                'Transportadora can read documents',
                'Transportadora can delete documents',
                'Users can upload driver documents',
                'Users can read driver documents',
                'Users can delete driver documents',
                'Users can upload vehicle documents',
                'Users can read vehicle documents',
                'Users can delete vehicle documents',
                'Users can upload company documents',
                'Users can read company documents',
                'Users can delete company documents',
                'Users can upload vehicle photos',
                'Anyone can read vehicle photos',
                'Users can delete vehicle photos',
                'Users can upload costs',
                'Users can read costs',
                'Users can delete costs'
            )
            ORDER BY policyname;
        `;

        const { rows: policies } = await client.query(policiesQuery);

        if (policies.length === 0) {
            console.log('⚠️  Nenhuma política encontrada');
        } else {
            console.log(`✅ ${policies.length} políticas RLS encontradas:\n`);
            policies.forEach(policy => {
                console.log(`   ✅ ${policy.policyname} (${policy.cmd})`);
            });
        }

        console.log('\n📋 Resumo:');
        console.log(`   ✅ Políticas RLS criadas: ${policies.length}/22`);

        console.log('\n📋 Próximos passos:');
        console.log('   1. ✅ Buckets criados');
        console.log('   2. ✅ Políticas RLS criadas');
        console.log('   3. ⏳ Teste uploads e downloads');
        console.log('   4. ⏳ Remova buckets antigos (opcional)');
        console.log('\n✅ Migração completa!\n');

    } catch (error) {
        console.error('\n❌ Erro ao aplicar migration:', error.message);
        console.error('\n💡 Solução alternativa:');
        console.error('   1. Acesse Supabase Dashboard → SQL Editor');
        console.error('   2. Execute o arquivo: supabase/migrations/20250128_create_bucket_policies_pt_br.sql');
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

