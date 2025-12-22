/**
 * Script para Criar Buckets em Português BR via Supabase API
 * GolfFox - Padronização de Nomenclatura PT-BR
 * 
 * Cria buckets diretamente via Storage API do Supabase
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
    console.error('   Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Configuração dos buckets
const BUCKETS_CONFIG = [
    {
        id: 'documentos-veiculo',
        name: 'documentos-veiculo',
        public: false,
        file_size_limit: 10485760, // 10MB
        allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png']
    },
    {
        id: 'documentos-motorista',
        name: 'documentos-motorista',
        public: false,
        file_size_limit: 10485760, // 10MB
        allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png']
    },
    {
        id: 'documentos-transportadora',
        name: 'documentos-transportadora',
        public: false,
        file_size_limit: 10485760, // 10MB
        allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png']
    },
    {
        id: 'documentos-empresa',
        name: 'documentos-empresa',
        public: false,
        file_size_limit: 10485760, // 10MB
        allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png']
    },
    {
        id: 'fotos-veiculo',
        name: 'fotos-veiculo',
        public: true,
        file_size_limit: null,
        allowed_mime_types: null
    },
    {
        id: 'avatares',
        name: 'avatares',
        public: true,
        file_size_limit: 5242880, // 5MB
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    },
    {
        id: 'custos',
        name: 'custos',
        public: false,
        file_size_limit: 10485760, // 10MB
        allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png']
    }
];

async function createBucket(bucketConfig) {
    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
                id: bucketConfig.id,
                name: bucketConfig.name,
                public: bucketConfig.public,
                file_size_limit: bucketConfig.file_size_limit,
                allowed_mime_types: bucketConfig.allowed_mime_types
            })
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, data };
        } else {
            const error = await response.json();
            // Se bucket já existe, considerar sucesso
            if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
                return { success: true, alreadyExists: true };
            }
            return { success: false, error: error.message || error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function migrateObjects(oldBucketId, newBucketId) {
    try {
        // Listar objetos do bucket antigo
        const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/${oldBucketId}?limit=1000`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        if (!listResponse.ok) {
            return { success: false, error: 'Não foi possível listar objetos' };
        }

        const objects = await listResponse.json();
        
        if (!objects || objects.length === 0) {
            return { success: true, migrated: 0 };
        }

        // Migrar cada objeto (copiar para novo bucket e deletar do antigo)
        let migrated = 0;
        for (const obj of objects) {
            try {
                // Copiar objeto para novo bucket
                const copyResponse = await fetch(
                    `${SUPABASE_URL}/storage/v1/object/copy`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                        },
                        body: JSON.stringify({
                            bucketId: oldBucketId,
                            sourceKey: obj.name,
                            destinationBucket: newBucketId,
                            destinationKey: obj.name
                        })
                    }
                );

                if (copyResponse.ok) {
                    // Deletar do bucket antigo
                    await fetch(
                        `${SUPABASE_URL}/storage/v1/object/${oldBucketId}/${obj.name}`,
                        {
                            method: 'DELETE',
                            headers: {
                                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                            }
                        }
                    );
                    migrated++;
                }
            } catch (err) {
                console.log(`      ⚠️  Erro ao migrar ${obj.name}: ${err.message}`);
            }
        }

        return { success: true, migrated };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function applyMigration() {
    console.log('🚀 Criando buckets em Português BR via Supabase API\n');
    console.log(`📡 Conectando ao Supabase: ${SUPABASE_URL.replace(/https?:\/\//, '').split('.')[0]}...\n`);

    // Mapeamento de buckets antigos para novos
    const bucketMapping = [
        { old: ['vehicle-documents', 'veiculo-documents'], new: 'documentos-veiculo' },
        { old: ['driver-documents', 'motorista-documents'], new: 'documentos-motorista' },
        { old: ['carrier-documents', 'transportadora-documents'], new: 'documentos-transportadora' },
        { old: ['company-documents'], new: 'documentos-empresa' },
        { old: ['vehicle-photos', 'veiculo-photos'], new: 'fotos-veiculo' },
        { old: ['avatars'], new: 'avatares' },
        { old: ['costs'], new: 'custos' }
    ];

    // Verificar buckets antigos existentes
    console.log('🔍 Verificando buckets existentes...\n');
    
    const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
    });

    if (!listResponse.ok) {
        console.error('❌ Erro ao listar buckets:', await listResponse.text());
        process.exit(1);
    }

    const existingBuckets = await listResponse.json();
    const existingBucketIds = existingBuckets.map(b => b.id);

    console.log(`📦 Encontrados ${existingBuckets.length} buckets existentes\n`);

    // Criar novos buckets
    console.log('⚙️  Criando novos buckets em português...\n');

    const results = [];
    for (const bucketConfig of BUCKETS_CONFIG) {
        console.log(`   📦 Criando bucket: ${bucketConfig.id}...`);
        
        const result = await createBucket(bucketConfig);
        
        if (result.success) {
            if (result.alreadyExists) {
                console.log(`      ✅ Bucket já existe`);
            } else {
                console.log(`      ✅ Bucket criado com sucesso`);
            }
            results.push({ bucket: bucketConfig.id, status: 'created' });
        } else {
            console.log(`      ❌ Erro: ${result.error}`);
            results.push({ bucket: bucketConfig.id, status: 'error', error: result.error });
        }
    }

    // Migrar objetos dos buckets antigos para os novos
    console.log('\n⚙️  Migrando arquivos dos buckets antigos...\n');

    for (const mapping of bucketMapping) {
        // Encontrar bucket antigo existente
        const oldBucketId = mapping.old.find(id => existingBucketIds.includes(id));
        
        if (oldBucketId && existingBucketIds.includes(mapping.new)) {
            console.log(`   📦 Migrando objetos de ${oldBucketId} → ${mapping.new}...`);
            
            const migrateResult = await migrateObjects(oldBucketId, mapping.new);
            
            if (migrateResult.success) {
                console.log(`      ✅ ${migrateResult.migrated} arquivo(s) migrado(s)`);
            } else {
                console.log(`      ⚠️  Erro na migração: ${migrateResult.error}`);
                console.log(`      💡 Migração de arquivos requer execução manual ou via SQL`);
            }
        } else if (oldBucketId) {
            console.log(`   ⚠️  Bucket antigo ${oldBucketId} encontrado, mas bucket novo ${mapping.new} não existe`);
        }
    }

    // Verificar resultados finais
    console.log('\n🔍 Verificando buckets finais...\n');

    const finalResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
    });

    if (finalResponse.ok) {
        const finalBuckets = await finalResponse.json();
        const newBuckets = finalBuckets.filter(b => BUCKETS_CONFIG.some(c => c.id === b.id));

        console.log(`✅ ${newBuckets.length}/7 buckets em português criados:\n`);
        newBuckets.forEach(bucket => {
            const publicStatus = bucket.public ? 'público' : 'privado';
            const sizeLimit = bucket.file_size_limit 
                ? `${(bucket.file_size_limit / 1024 / 1024).toFixed(0)}MB` 
                : 'sem limite';
            console.log(`   ✅ ${bucket.id}`);
            console.log(`      Status: ${publicStatus}, Limite: ${sizeLimit}`);
        });

        if (newBuckets.length < 7) {
            console.log(`\n⚠️  Faltam ${7 - newBuckets.length} buckets. Verifique os erros acima.`);
        }
    }

    console.log('\n📋 Próximos passos:');
    console.log('   1. ✅ Buckets criados via API');
    console.log('   2. ⏳ Aplicar migration SQL para migrar objetos e criar políticas RLS');
    console.log('   3. ⏳ Teste uploads e downloads');
    console.log('   4. ⏳ Remova buckets antigos (opcional)');
    console.log('\n📖 Para políticas RLS, execute: supabase/migrations/20250128_rename_buckets_pt_br.sql');
    console.log('   (seções 2, 3 e 4 da migration)\n');
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

