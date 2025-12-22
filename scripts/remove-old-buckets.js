
const fs = require('fs');
const path = require('path');
const { createClient } = require('../apps/web/node_modules/@supabase/supabase-js');

// Carregar variáveis de ambiente
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const OLD_BUCKETS = [
    'vehicle-documents',
    'driver-documents',
    'carrier-documents',
    'company-documents',
    'vehicle-photos',
    'avatars',
    'costs',
    // Variações de hífens/underscore que possam existir
    'veiculo-documents',
    'motorista-documents',
    'transportadora-documents',
    'veiculo-photos'
];

async function removeOldBuckets() {
    console.log('🗑️  Iniciando Remoção de Buckets Antigos\n');
    console.log('='.repeat(70));

    // 1. Listar todos os buckets existentes para filtrar apenas os que realmente existem
    const { data: allBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('❌ Erro ao listar buckets:', listError.message);
        process.exit(1);
    }

    const existingOldBuckets = allBuckets.filter(b => OLD_BUCKETS.includes(b.id));

    if (existingOldBuckets.length === 0) {
        console.log('✅ Nenhum bucket antigo encontrado para remoção.');
        return;
    }

    console.log(`Encontrados ${existingOldBuckets.length} buckets antigos para análise:`);
    existingOldBuckets.forEach(b => console.log(` - ${b.id}`));
    console.log('\n');

    for (const bucket of existingOldBuckets) {
        process.stdout.write(`🔍 Analisando bucket '${bucket.id}'... `);

        // Verificar se tem arquivos
        const { data: files, error: filesError } = await supabase.storage
            .from(bucket.id)
            .list('', { limit: 100 }); // Limite arbitrário para checagem rápida

        if (filesError) {
            console.log(`❌ Erro ao listar arquivos: ${filesError.message}`);
            continue;
        }

        const validFiles = files.filter(f => f.name !== '.emptyFolderPlaceholder');

        if (validFiles.length > 0) {
            console.log(`⚠️  NÃO REMOVIDO: Contém ${validFiles.length} arquivos.`);
            console.log(`   Por segurança, migre os arquivos antes de remover.`);
        } else {
            console.log('✅ Vazio. Removendo...');

            // Remover bucket
            const { error: deleteError } = await supabase.storage.deleteBucket(bucket.id);

            if (deleteError) {
                console.error(`   ❌ Falha na remoção: ${deleteError.message}`);
            } else {
                console.log(`   ✅ Bucket '${bucket.id}' removido com sucesso!`);
            }
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('Concluído.');
}

removeOldBuckets()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
