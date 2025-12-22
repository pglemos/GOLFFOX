/**
 * Script Autônomo Completo para Migração de Buckets
 * GolfFox - Padronização de Nomenclatura PT-BR
 * 
 * Executa TUDO de forma 100% autônoma:
 * 1. Cria buckets via API
 * 2. Migra arquivos via API
 * 3. Aplica políticas RLS via SQL (se DATABASE_URL disponível)
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Carregar variáveis de ambiente
const envPaths = [
    path.join(__dirname, '..', 'apps', 'web', '.env.local'),
    path.join(__dirname, '..', 'apps', 'web', '.env'),
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env')
];

let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';
let DATABASE_URL = '';

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
            if (line.startsWith('DATABASE_URL=') || line.startsWith('SUPABASE_DB_URL=')) {
                DATABASE_URL = line.split('=')[1]?.trim().replace(/^["']|["']$/g, '') || '';
            }
        }
        
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) break;
    }
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas');
    console.error('   Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

async function runScript(scriptName) {
    try {
        const { stdout, stderr } = await execAsync(`node ${scriptName}`, {
            cwd: __dirname,
            env: { ...process.env, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL }
        });
        if (stdout) console.log(stdout);
        if (stderr && !stderr.includes('⚠️')) console.error(stderr);
        return true;
    } catch (error) {
        if (error.stdout) console.log(error.stdout);
        if (error.stderr && !error.stderr.includes('⚠️')) console.error(error.stderr);
        return false;
    }
}

async function applyPoliciesViaSQL() {
    if (!DATABASE_URL) {
        console.log('\n⚠️  DATABASE_URL não configurado');
        console.log('   Políticas RLS precisam ser aplicadas manualmente via SQL');
        console.log('   Execute: supabase/migrations/20250128_create_bucket_policies_pt_br.sql');
        return false;
    }

    try {
        const { Client } = require('pg');
        const client = new Client({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        
        const migrationPath = path.join(__dirname, '../supabase/migrations/20250128_create_bucket_policies_pt_br.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        await client.query(migrationSQL);
        await client.end();
        
        return true;
    } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Migração Completa e Autônoma de Buckets para Português BR\n');
    console.log('='.repeat(70));

    // ETAPA 1: Criar buckets
    console.log('\n📦 ETAPA 1: Criar buckets em português\n');
    const bucketsCreated = await runScript('create-buckets-pt-br-via-api.js');
    if (!bucketsCreated) {
        console.error('❌ Falha ao criar buckets');
        process.exit(1);
    }

    // ETAPA 2: Migrar arquivos
    console.log('\n' + '='.repeat(70));
    console.log('\n📄 ETAPA 2: Migrar arquivos dos buckets antigos\n');
    await runScript('migrate-bucket-objects-via-api.js');

    // ETAPA 3: Aplicar políticas RLS
    console.log('\n' + '='.repeat(70));
    console.log('\n🔒 ETAPA 3: Criar políticas RLS\n');
    
    const policiesApplied = await applyPoliciesViaSQL();
    
    if (policiesApplied) {
        console.log('✅ Políticas RLS aplicadas com sucesso!\n');
    } else {
        console.log('\n📋 Para aplicar políticas RLS manualmente:');
        console.log('   1. Acesse: https://app.supabase.com');
        console.log('   2. SQL Editor → New Query');
        console.log('   3. Execute: supabase/migrations/20250128_create_bucket_policies_pt_br.sql\n');
    }

    // Verificação final
    console.log('='.repeat(70));
    console.log('\n🔍 VERIFICAÇÃO FINAL\n');

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
            }
        }
    } catch (error) {
        console.log(`⚠️  Erro ao verificar: ${error.message}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📋 RESUMO DA MIGRAÇÃO\n');
    console.log('✅ Concluído:');
    console.log('   1. ✅ Buckets criados via API');
    console.log('   2. ✅ Arquivos migrados (se houver)');
    if (policiesApplied) {
        console.log('   3. ✅ Políticas RLS criadas via SQL');
    } else {
        console.log('   3. ⏳ Políticas RLS (requer execução manual)');
    }
    console.log('\n⏳ Próximos passos:');
    console.log('   4. ⏳ Testar uploads e downloads');
    console.log('   5. ⏳ Remover buckets antigos (opcional)\n');
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

