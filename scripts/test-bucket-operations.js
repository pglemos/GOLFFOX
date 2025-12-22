
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

const BUCKETS = [
    { name: 'documentos-veiculo', public: false, mime: 'application/pdf', ext: 'pdf' },
    { name: 'documentos-motorista', public: false, mime: 'application/pdf', ext: 'pdf' },
    { name: 'documentos-transportadora', public: false, mime: 'application/pdf', ext: 'pdf' },
    { name: 'documentos-empresa', public: false, mime: 'application/pdf', ext: 'pdf' },
    { name: 'fotos-veiculo', public: true, mime: 'image/jpeg', ext: 'jpg' },
    { name: 'avatares', public: true, mime: 'image/jpeg', ext: 'jpg' },
    { name: 'custos', public: false, mime: 'application/pdf', ext: 'pdf' }
];

async function testBucketOperations() {
    console.log('🧪 Iniciando Testes de Operações em Buckets (PT-BR)\n');
    console.log('='.repeat(70));

    let successCount = 0;

    for (const bucket of BUCKETS) {
        console.log(`\n📂 Testando bucket: ${bucket.name} (${bucket.public ? 'Público' : 'Privado'})`);
        let bucketSuccess = true;

        const testFileName = `test-migration-${Date.now()}.${bucket.ext}`;
        // Buffer mínimo simulando um arquivo válido (pode não ser válido de verdade, mas passa no mime type check se for só string baseada)
        // Para garantir, vamos usar uma string convertida em buffer
        const fileContent = Buffer.from('Conteudo de teste simulando arquivo binario');

        // 1. Teste de Upload
        try {
            const { data, error } = await supabase.storage
                .from(bucket.name)
                .upload(testFileName, fileContent, {
                    contentType: bucket.mime,
                    upsert: true
                });

            if (error) throw error;
            console.log('   ✅ Upload: Sucesso');
        } catch (error) {
            console.error(`   ❌ Upload: Falhou - ${error.message}`);
            bucketSuccess = false;
        }

        // 2. Teste de Download / URL
        if (bucketSuccess) {
            try {
                if (bucket.public) {
                    const { data } = supabase.storage
                        .from(bucket.name)
                        .getPublicUrl(testFileName);

                    if (!data.publicUrl) throw new Error('URL pública não gerada');
                    console.log('   ✅ URL Pública: Gerada com sucesso');
                } else {
                    const { data, error } = await supabase.storage
                        .from(bucket.name)
                        .createSignedUrl(testFileName, 60);

                    if (error) throw error;
                    if (!data.signedUrl) throw new Error('URL assinada não gerada');
                    console.log('   ✅ URL Assinada: Gerada com sucesso');
                }
            } catch (error) {
                console.error(`   ❌ Download/URL: Falhou - ${error.message}`);
                bucketSuccess = false;
            }
        }

        // 3. Teste de Remoção
        if (bucketSuccess) { // Tenta remover mesmo se download falhou, para não deixar lixo, mas idealmente só se upload funcionou
            try {
                const { error } = await supabase.storage
                    .from(bucket.name)
                    .remove([testFileName]);

                if (error) throw error;
                console.log('   ✅ Remoção: Sucesso');
            } catch (error) {
                console.error(`   ❌ Remoção: Falhou - ${error.message}`);
                bucketSuccess = false;
            }
        }

        if (bucketSuccess) {
            successCount++;
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMO DOS TESTES\n');

    if (successCount === BUCKETS.length) {
        console.log(`✅ Sucesso total! Todos os ${BUCKETS.length} buckets passaram nos testes.`);
        return true;
    } else {
        console.log(`⚠️  Parcial: ${successCount}/${BUCKETS.length} buckets passaram nos testes.`);
        console.log(`❌ ${BUCKETS.length - successCount} buckets apresentaram falhas.`);
        return false;
    }
}

testBucketOperations()
    .then((success) => {
        if (!success) process.exit(1);
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });
