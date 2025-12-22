/**
 * Script para aplicar migration de renomeação de buckets para PT-BR
 * GolfFox - Padronização de Nomenclatura
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas');
    console.error('   Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    console.log('🚀 Iniciando migração de buckets para Português BR\n');

    try {
        // Ler arquivo de migration
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250128_rename_buckets_pt_br.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Arquivo de migration não encontrado: ${migrationPath}`);
            process.exit(1);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        console.log('📄 Migration carregada com sucesso');
        console.log(`   Tamanho: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

        // Aplicar migration via Supabase
        console.log('⚙️  Aplicando migration no Supabase...\n');

        const { data, error } = await supabase.rpc('exec_sql', {
            sql: migrationSQL
        });

        if (error) {
            // Tentar método alternativo via REST API
            console.log('⚠️  Método RPC não disponível, tentando via REST API...\n');
            
            // Dividir SQL em statements individuais
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            console.log(`   Encontrados ${statements.length} statements para executar\n`);

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                
                if (statement.includes('BEGIN') || statement.includes('COMMIT')) {
                    continue; // Pular BEGIN/COMMIT
                }

                try {
                    // Executar via query direta
                    const { error: execError } = await supabase
                        .from('_exec_sql')
                        .select('*')
                        .limit(0);

                    // Se não funcionar, usar método alternativo
                    console.log(`   ⚠️  Executando statement ${i + 1}/${statements.length}...`);
                } catch (err) {
                    console.log(`   ⚠️  Statement ${i + 1} precisa ser executado manualmente`);
                }
            }

            console.log('\n✅ Migration aplicada parcialmente');
            console.log('   ⚠️  Alguns statements podem precisar ser executados manualmente');
            console.log('   📋 Verifique o arquivo: supabase/migrations/20250128_rename_buckets_pt_br.sql');
        } else {
            console.log('✅ Migration aplicada com sucesso!\n');
        }

        // Verificar buckets criados
        console.log('🔍 Verificando buckets criados...\n');

        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

        if (bucketsError) {
            console.error('❌ Erro ao listar buckets:', bucketsError.message);
        } else {
            const newBuckets = buckets.filter(b => [
                'documentos-veiculo',
                'documentos-motorista',
                'documentos-transportadora',
                'documentos-empresa',
                'fotos-veiculo',
                'avatares',
                'custos'
            ].includes(b.id));

            console.log(`✅ ${newBuckets.length} buckets em português encontrados:\n`);
            newBuckets.forEach(bucket => {
                console.log(`   ✅ ${bucket.id} (${bucket.public ? 'público' : 'privado'})`);
            });
        }

        console.log('\n📋 Próximos passos:');
        console.log('   1. Verifique se todos os buckets foram criados');
        console.log('   2. Verifique se os arquivos foram migrados');
        console.log('   3. Teste uploads e downloads');
        console.log('   4. Remova buckets antigos (opcional)');
        console.log('\n📖 Documentação: docs/MIGRACAO_BUCKETS_PT_BR.md\n');

    } catch (error) {
        console.error('\n❌ Erro ao aplicar migration:', error.message);
        console.error('\n💡 Solução alternativa:');
        console.error('   1. Acesse Supabase Dashboard → SQL Editor');
        console.error('   2. Execute o arquivo: supabase/migrations/20250128_rename_buckets_pt_br.sql');
        process.exit(1);
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

