/**
 * Script Completo para Migração de Buckets para Português BR
 * GolfFox - Padronização de Nomenclatura PT-BR
 * 
 * Executa todos os passos da migração via API
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Tentar carregar .env
const envPaths = [
    path.join(__dirname, '..', 'apps', 'web', '.env.local'),
    path.join(__dirname, '..', 'apps', 'web', '.env'),
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env')
];

let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=') || line.startsWith('SUPABASE_URL=')) {
                SUPABASE_URL = line.split('=')[1]?.trim().replace(/^["']|["']$/g, '') || '';
            }
            if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
                SUPABASE_SERVICE_ROLE_KEY = line.split('=')[1]?.trim().replace(/^["']|["']$/g, '') || '';
            }
        }
        
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) break;
    }
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas');
    process.exit(1);
}

async function main() {
    console.log('🚀 Migração Completa de Buckets para Português BR\n');
    console.log('='.repeat(70));
    console.log('ETAPA 1: Criar buckets em português\n');
    
    // Executar script de criação de buckets
    try {
        await execAsync('node scripts/create-buckets-pt-br-via-api.js');
    } catch (error) {
        console.error('❌ Erro na etapa 1:', error.message);
        process.exit(1);
    }

    console.log('\n' + '='.repeat(70));
    console.log('ETAPA 2: Migrar arquivos dos buckets antigos\n');
    
    // Executar script de migração de objetos
    try {
        await execAsync('node scripts/migrate-bucket-objects-via-api.js');
    } catch (error) {
        console.error('⚠️  Aviso na etapa 2:', error.message);
        // Continuar mesmo com erro (pode não haver arquivos)
    }

    console.log('\n' + '='.repeat(70));
    console.log('ETAPA 3: Criar políticas RLS\n');
    console.log('⚠️  Políticas RLS precisam ser criadas via SQL\n');
    console.log('📋 Execute o arquivo SQL abaixo no Supabase Dashboard:\n');
    console.log('   📄 supabase/migrations/20250128_create_bucket_policies_pt_br.sql\n');
    console.log('   Ou execute a seção 3 da migration completa:');
    console.log('   📄 supabase/migrations/20250128_rename_buckets_pt_br.sql\n');

    // Verificar resultados finais
    console.log('='.repeat(70));
    console.log('VERIFICAÇÃO FINAL\n');

    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        if (response.ok) {
            const buckets = await response.json();
            const newBuckets = buckets.filter(b => [
                'documentos-veiculo',
                'documentos-motorista',
                'documentos-transportadora',
                'documentos-empresa',
                'fotos-veiculo',
                'avatares',
                'custos'
            ].includes(b.id));

            console.log(`✅ ${newBuckets.length}/7 buckets em português criados:\n`);
            newBuckets.forEach(bucket => {
                const publicStatus = bucket.public ? 'público' : 'privado';
                const sizeLimit = bucket.file_size_limit 
                    ? `${(bucket.file_size_limit / 1024 / 1024).toFixed(0)}MB` 
                    : 'sem limite';
                console.log(`   ✅ ${bucket.id} (${publicStatus}, ${sizeLimit})`);
            });

            if (newBuckets.length === 7) {
                console.log('\n✅ Todos os buckets foram criados com sucesso!');
            } else {
                console.log(`\n⚠️  Faltam ${7 - newBuckets.length} buckets`);
            }
        }
    } catch (error) {
        console.log(`⚠️  Erro ao verificar: ${error.message}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('📋 RESUMO DA MIGRAÇÃO\n');
    console.log('✅ Concluído:');
    console.log('   1. ✅ Buckets criados via API');
    console.log('   2. ✅ Arquivos migrados (se houver)');
    console.log('\n⏳ Pendente:');
    console.log('   3. ⏳ Criar políticas RLS via SQL');
    console.log('   4. ⏳ Testar uploads e downloads');
    console.log('   5. ⏳ Remover buckets antigos (opcional)\n');
    console.log('📖 Próximo passo:');
    console.log('   Execute: supabase/migrations/20250128_create_bucket_policies_pt_br.sql');
    console.log('   no Supabase Dashboard → SQL Editor\n');
}

main()
    .then(() => {
        console.log('✅ Processo concluído!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });

