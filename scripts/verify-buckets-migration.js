/**
 * Script para Verificar Migração de Buckets Completa
 * GolfFox - Padronização de Nomenclatura PT-BR
 */

const fs = require('fs');
const path = require('path');

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
    process.exit(1);
}

// Configurar DATABASE_URL se não estiver configurado
if (!DATABASE_URL) {
    DATABASE_URL = 'postgresql://postgres:Guigui1309%40@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';
}

const EXPECTED_BUCKETS = [
    'documentos-veiculo',
    'documentos-motorista',
    'documentos-transportadora',
    'documentos-empresa',
    'fotos-veiculo',
    'avatares',
    'custos'
];

const EXPECTED_POLICIES = [
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
];

async function verifyBuckets() {
    console.log('🔍 Verificando buckets...\n');

    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        if (!response.ok) {
            console.error('❌ Erro ao listar buckets:', await response.text());
            return { success: false, buckets: [] };
        }

        const buckets = await response.json();
        const newBuckets = buckets.filter(b => EXPECTED_BUCKETS.includes(b.id));
        const oldBuckets = buckets.filter(b => !EXPECTED_BUCKETS.includes(b.id) && 
            ['vehicle-documents', 'veiculo-documents', 'driver-documents', 'motorista-documents',
             'carrier-documents', 'transportadora-documents', 'company-documents',
             'vehicle-photos', 'veiculo-photos', 'avatars', 'costs'].includes(b.id));

        console.log(`✅ ${newBuckets.length}/7 buckets em português encontrados:\n`);
        newBuckets.forEach(bucket => {
            const publicStatus = bucket.public ? 'público' : 'privado';
            const sizeLimit = bucket.file_size_limit 
                ? `${(bucket.file_size_limit / 1024 / 1024).toFixed(0)}MB` 
                : 'sem limite';
            console.log(`   ✅ ${bucket.id} (${publicStatus}, ${sizeLimit})`);
        });

        if (oldBuckets.length > 0) {
            console.log(`\n⚠️  ${oldBuckets.length} bucket(s) antigo(s) ainda existem:`);
            oldBuckets.forEach(b => console.log(`   - ${b.id}`));
            console.log('   💡 Você pode removê-los após verificar que tudo está funcionando');
        }

        return { 
            success: newBuckets.length === 7, 
            buckets: newBuckets,
            oldBuckets: oldBuckets
        };
    } catch (error) {
        console.error('❌ Erro ao verificar buckets:', error.message);
        return { success: false, buckets: [] };
    }
}

async function verifyPolicies() {
    console.log('\n🔍 Verificando políticas RLS...\n');

    try {
        const { Client } = require('pg');
        const client = new Client({
            host: 'db.vmoxzesvjcfmrebagcwo.supabase.co',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: 'Guigui1309@',
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        const policiesQuery = `
            SELECT policyname, cmd
            FROM pg_policies
            WHERE schemaname = 'storage'
            AND tablename = 'objects'
            AND policyname = ANY($1::text[])
            ORDER BY policyname;
        `;

        const { rows: policies } = await client.query(policiesQuery, [EXPECTED_POLICIES]);

        console.log(`✅ ${policies.length}/${EXPECTED_POLICIES.length} políticas RLS encontradas:\n`);
        
        const foundPolicyNames = policies.map(p => p.policyname);
        const missingPolicies = EXPECTED_POLICIES.filter(p => !foundPolicyNames.includes(p));

        policies.forEach(policy => {
            console.log(`   ✅ ${policy.policyname} (${policy.cmd})`);
        });

        if (missingPolicies.length > 0) {
            console.log(`\n⚠️  ${missingPolicies.length} política(s) faltando:`);
            missingPolicies.forEach(p => console.log(`   - ${p}`));
            console.log('\n💡 Execute a migration SQL novamente para criar as políticas faltantes');
        }

        await client.end();

        return { 
            success: policies.length === EXPECTED_POLICIES.length, 
            policies: policies,
            missing: missingPolicies
        };
    } catch (error) {
        console.error('❌ Erro ao verificar políticas:', error.message);
        console.log('\n💡 Verifique se a migration SQL foi executada no Supabase Dashboard');
        return { success: false, policies: [], missing: EXPECTED_POLICIES };
    }
}

async function verifyCodeReferences() {
    console.log('\n🔍 Verificando referências no código...\n');

    const filesToCheck = [
        'apps/web/hooks/use-file-upload.ts',
        'apps/web/lib/documents-config.ts',
        'apps/web/app/api/upload/route.ts'
    ];

    let allCorrect = true;

    for (const filePath of filesToCheck) {
        const fullPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const oldBucketNames = ['avatars', 'vehicle-documents', 'driver-documents', 'carrier-documents', 
                                   'transportadora-documents', 'company-documents', 'vehicle-photos', 
                                   'veiculo-photos', 'costs'];
            
            const hasOldNames = oldBucketNames.some(name => content.includes(name));
            
            if (hasOldNames) {
                console.log(`   ⚠️  ${filePath} - Possui referências a buckets antigos`);
                allCorrect = false;
            } else {
                console.log(`   ✅ ${filePath} - OK`);
            }
        }
    }

    return allCorrect;
}

async function main() {
    console.log('🚀 Verificação Completa da Migração de Buckets\n');
    console.log('='.repeat(70));

    const bucketsResult = await verifyBuckets();
    const policiesResult = await verifyPolicies();
    const codeResult = await verifyCodeReferences();

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMO DA VERIFICAÇÃO\n');

    console.log('Buckets:');
    if (bucketsResult.success) {
        console.log('   ✅ Todos os buckets em português criados (7/7)');
    } else {
        console.log(`   ⚠️  Faltam ${7 - bucketsResult.buckets.length} bucket(s)`);
    }

    if (bucketsResult.oldBuckets && bucketsResult.oldBuckets.length > 0) {
        console.log(`   ⚠️  ${bucketsResult.oldBuckets.length} bucket(s) antigo(s) ainda existem`);
    }

    console.log('\nPolíticas RLS:');
    if (policiesResult.success) {
        console.log(`   ✅ Todas as políticas criadas (${policiesResult.policies.length}/${EXPECTED_POLICIES.length})`);
    } else {
        console.log(`   ⚠️  Faltam ${policiesResult.missing.length} política(s)`);
        if (policiesResult.missing.length > 0) {
            console.log('   💡 Execute: supabase/migrations/20250128_create_bucket_policies_pt_br.sql');
        }
    }

    console.log('\nCódigo:');
    if (codeResult) {
        console.log('   ✅ Todas as referências atualizadas');
    } else {
        console.log('   ⚠️  Algumas referências podem precisar de atualização');
    }

    const allGood = bucketsResult.success && policiesResult.success && codeResult;

    console.log('\n' + '='.repeat(70));
    if (allGood) {
        console.log('\n✅ MIGRAÇÃO COMPLETA E VERIFICADA!\n');
        console.log('Todos os componentes estão corretos:');
        console.log('   ✅ Buckets criados');
        console.log('   ✅ Políticas RLS criadas');
        console.log('   ✅ Código atualizado');
        console.log('\n🎉 Pronto para uso!\n');
    } else {
        console.log('\n⚠️  MIGRAÇÃO PARCIAL\n');
        console.log('Ações necessárias:');
        if (!bucketsResult.success) {
            console.log('   - Criar buckets faltantes');
        }
        if (!policiesResult.success) {
            console.log('   - Executar migration SQL para políticas RLS');
        }
        if (!codeResult) {
            console.log('   - Atualizar referências no código');
        }
        console.log('');
    }
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });

