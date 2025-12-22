
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
    { old: 'vehicle-documents', new: 'documentos-veiculo' },
    { old: 'driver-documents', new: 'documentos-motorista' },
    { old: 'carrier-documents', new: 'documentos-transportadora' },
    { old: 'vehicle-photos', new: 'fotos-veiculo' },
    { old: 'avatars', new: 'avatares' },
    { old: 'company-documents', new: 'documentos-empresa' },
    { old: 'transportadora-documents', new: 'documentos-transportadora' },
    { old: 'veiculo-documents', new: 'documentos-veiculo' },
    { old: 'motorista-documents', new: 'documentos-motorista' },
    { old: 'veiculo-photos', new: 'fotos-veiculo' }
];

async function migrateFile(sourceBucket, targetBucket, filePath) {
    // 1. Download
    const { data: fileData, error: downloadError } = await supabase.storage
        .from(sourceBucket)
        .download(filePath);

    if (downloadError) return { success: false, error: `Download: ${downloadError.message}` };

    // 2. Upload
    const { error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(filePath, fileData, {
            upsert: true,
            contentType: fileData.type
        });

    if (uploadError) return { success: false, error: `Upload: ${uploadError.message}` };

    // 3. Delete old
    const { error: deleteError } = await supabase.storage
        .from(sourceBucket)
        .remove([filePath]);

    if (deleteError) return { success: false, error: `Delete: ${deleteError.message}` };

    return { success: true };
}

async function migrateFolder(sourceBucket, targetBucket, pathPrefix = '') {
    // Listar arquivos no caminho atual
    const { data: files, error: listError } = await supabase.storage
        .from(sourceBucket)
        .list(pathPrefix, { limit: 1000 });

    if (listError) {
        console.error(`   ❌ Erro ao listar ${pathPrefix}: ${listError.message}`);
        return { migrated: 0, errors: 0 };
    }

    let migrated = 0;
    let errors = 0;

    for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue;

        const fullPath = pathPrefix ? `${pathPrefix}/${file.name}` : file.name;

        // Se id é null, é uma pasta -> recursão
        if (!file.id) {
            console.log(`      📂 Entrando na pasta: ${fullPath}`);
            const result = await migrateFolder(sourceBucket, targetBucket, fullPath);
            migrated += result.migrated;
            errors += result.errors;

            // Tentar remover a pasta vazia depois de processar
            // Supabase storage não tem deleteFolder explícito, mas remove se vazio?
            // Testaremos se sumiu no final.
        } else {
            // É arquivo -> migrar
            process.stdout.write(`      Migrando '${fullPath}'... `);
            const result = await migrateFile(sourceBucket, targetBucket, fullPath);

            if (result.success) {
                console.log('✅ Sucesso');
                migrated++;
            } else {
                console.log(`❌ Falha: ${result.error}`);
                errors++;
            }
        }
    }
    return { migrated, errors };
}

async function runMigration() {
    console.log('🚀 Iniciando Migração Final de Objetos (via SDK + Recursivo)\n');
    console.log('='.repeat(70));

    let totalMigrated = 0;
    let totalErrors = 0;

    // Verificar buckets existentes primeiro
    const { data: buckets } = await supabase.storage.listBuckets();
    const existingBucketIds = buckets ? buckets.map(b => b.id) : [];

    const validMappings = OLD_BUCKETS.filter(m => existingBucketIds.includes(m.old) && existingBucketIds.includes(m.new));

    for (const mapping of validMappings) {
        console.log(`\n📦 Processando: ${mapping.old} -> ${mapping.new}`);

        const result = await migrateFolder(mapping.old, mapping.new);

        totalMigrated += result.migrated;
        totalErrors += result.errors;

        if (result.migrated === 0 && result.errors === 0) {
            console.log('   ✅ Nenhum arquivo para migrar (vazio ou apenas pastas vazias).');
            //Se estiver vazio de arquivos, o remove-old-buckets cuidará dele se as pastas sumirem
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n📊 Resultado Final:`);
    console.log(`   ✅ Migrados: ${totalMigrated}`);
    console.log(`   ❌ Erros: ${totalErrors}`);

    if (totalErrors === 0) {
        console.log('\n✅ Pronto para remover buckets antigos.');
    } else {
        console.log('\n⚠️  Resolva os erros antes de remover os buckets.');
    }
}

runMigration()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
