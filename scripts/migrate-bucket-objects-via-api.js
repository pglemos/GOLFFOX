/**
 * Script para Migrar Objetos dos Buckets Antigos para os Novos
 * GolfFox - Padronização de Nomenclatura PT-BR
 */

const fs = require('fs');
const path = require('path');

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

// Mapeamento de buckets
const BUCKET_MAPPING = [
    { old: 'vehicle-documents', new: 'documentos-veiculo' },
    { old: 'veiculo-documents', new: 'documentos-veiculo' },
    { old: 'driver-documents', new: 'documentos-motorista' },
    { old: 'motorista-documents', new: 'documentos-motorista' },
    { old: 'carrier-documents', new: 'documentos-transportadora' },
    { old: 'transportadora-documents', new: 'documentos-transportadora' },
    { old: 'company-documents', new: 'documentos-empresa' },
    { old: 'vehicle-photos', new: 'fotos-veiculo' },
    { old: 'veiculo-photos', new: 'fotos-veiculo' },
    { old: 'avatars', new: 'avatares' },
    { old: 'costs', new: 'custos' }
];

async function listObjects(bucketId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucketId}?limit=1000`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        }
        return [];
    } catch (error) {
        console.error(`   ❌ Erro ao listar objetos de ${bucketId}:`, error.message);
        return [];
    }
}

async function copyObject(sourceBucket, sourceKey, destBucket, destKey) {
    try {
        // Obter objeto do bucket antigo
        const getResponse = await fetch(
            `${SUPABASE_URL}/storage/v1/object/${sourceBucket}/${sourceKey}`,
            {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            }
        );

        if (!getResponse.ok) {
            return { success: false, error: 'Não foi possível obter objeto' };
        }

        const blob = await getResponse.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload para novo bucket
        const uploadResponse = await fetch(
            `${SUPABASE_URL}/storage/v1/object/${destBucket}/${destKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': blob.type || 'application/octet-stream',
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'x-upsert': 'true'
                },
                body: buffer
            }
        );

        if (uploadResponse.ok) {
            // Deletar do bucket antigo
            await fetch(
                `${SUPABASE_URL}/storage/v1/object/${sourceBucket}/${sourceKey}`,
                {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    }
                }
            );
            return { success: true };
        } else {
            const error = await uploadResponse.text();
            return { success: false, error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function migrateBucketObjects(oldBucketId, newBucketId) {
    console.log(`\n   📦 Migrando objetos de ${oldBucketId} → ${newBucketId}...`);
    
    const objects = await listObjects(oldBucketId);
    
    if (objects.length === 0) {
        console.log(`      ✅ Nenhum arquivo para migrar`);
        return { migrated: 0, total: 0 };
    }

    console.log(`      📄 Encontrados ${objects.length} arquivo(s)`);

    let migrated = 0;
    let errors = 0;

    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const objectName = obj.name || obj.id;
        
        process.stdout.write(`      [${i + 1}/${objects.length}] Migrando ${objectName}... `);
        
        const result = await copyObject(oldBucketId, objectName, newBucketId, objectName);
        
        if (result.success) {
            console.log('✅');
            migrated++;
        } else {
            console.log(`❌ (${result.error?.substring(0, 50) || 'erro'})`);
            errors++;
        }
    }

    console.log(`      ✅ ${migrated}/${objects.length} arquivo(s) migrado(s) com sucesso`);
    if (errors > 0) {
        console.log(`      ⚠️  ${errors} arquivo(s) com erro`);
    }

    return { migrated, total: objects.length, errors };
}

async function main() {
    console.log('🚀 Migrando objetos dos buckets antigos para os novos\n');
    console.log(`📡 Conectando ao Supabase: ${SUPABASE_URL.replace(/https?:\/\//, '').split('.')[0]}...\n`);

    // Verificar buckets existentes
    const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
    });

    if (!listResponse.ok) {
        console.error('❌ Erro ao listar buckets');
        process.exit(1);
    }

    const buckets = await listResponse.json();
    const existingBucketIds = buckets.map(b => b.id);

    // Agrupar mapeamentos por bucket novo
    const migrationGroups = {};
    for (const mapping of BUCKET_MAPPING) {
        if (existingBucketIds.includes(mapping.old) && existingBucketIds.includes(mapping.new)) {
            if (!migrationGroups[mapping.new]) {
                migrationGroups[mapping.new] = [];
            }
            migrationGroups[mapping.new].push(mapping.old);
        }
    }

    if (Object.keys(migrationGroups).length === 0) {
        console.log('⚠️  Nenhum bucket antigo encontrado para migrar');
        console.log('   (Todos os buckets já foram migrados ou não existem)\n');
        return;
    }

    console.log(`📋 Encontrados ${Object.keys(migrationGroups).length} grupo(s) de migração\n`);

    let totalMigrated = 0;
    let totalFiles = 0;

    for (const [newBucket, oldBuckets] of Object.entries(migrationGroups)) {
        // Migrar de cada bucket antigo para o novo
        for (const oldBucket of oldBuckets) {
            const result = await migrateBucketObjects(oldBucket, newBucket);
            totalMigrated += result.migrated;
            totalFiles += result.total;
        }
    }

    console.log('\n📊 Resumo da Migração:');
    console.log(`   ✅ ${totalMigrated} arquivo(s) migrado(s) com sucesso`);
    console.log(`   📄 ${totalFiles} arquivo(s) processado(s) no total`);

    console.log('\n📋 Próximos passos:');
    console.log('   1. ✅ Buckets criados');
    console.log('   2. ✅ Arquivos migrados');
    console.log('   3. ⏳ Aplicar políticas RLS via SQL (seção 3 da migration)');
    console.log('   4. ⏳ Teste uploads e downloads');
    console.log('   5. ⏳ Remova buckets antigos (opcional)');
    console.log('\n📖 Execute a seção 3 da migration SQL para criar políticas RLS:');
    console.log('   supabase/migrations/20250128_rename_buckets_pt_br.sql\n');
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

