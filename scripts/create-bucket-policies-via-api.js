/**
 * Script para Criar Políticas RLS dos Buckets via Supabase API
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

// Políticas RLS para cada bucket
const POLICIES_CONFIG = {
    'avatares': [
        {
            name: 'Users can upload avatares',
            definition: "(bucket_id = 'avatares')",
            check: "(bucket_id = 'avatares')",
            role: 'authenticated',
            operation: 'INSERT'
        },
        {
            name: 'Users can update avatares',
            definition: "(bucket_id = 'avatares')",
            check: "(bucket_id = 'avatares')",
            role: 'authenticated',
            operation: 'UPDATE'
        },
        {
            name: 'Anyone can read avatares',
            definition: "(bucket_id = 'avatares')",
            check: null,
            role: 'public',
            operation: 'SELECT'
        },
        {
            name: 'Users can delete avatares',
            definition: "(bucket_id = 'avatares')",
            check: null,
            role: 'authenticated',
            operation: 'DELETE'
        }
    ],
    'documentos-transportadora': [
        {
            name: 'Transportadora can upload documents',
            definition: "(bucket_id = 'documentos-transportadora' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'transportadora'))",
            check: "(bucket_id = 'documentos-transportadora' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'transportadora'))",
            role: 'authenticated',
            operation: 'INSERT'
        },
        {
            name: 'Transportadora can read documents',
            definition: "(bucket_id = 'documentos-transportadora' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'transportadora'))",
            check: null,
            role: 'authenticated',
            operation: 'SELECT'
        },
        {
            name: 'Transportadora can delete documents',
            definition: "(bucket_id = 'documentos-transportadora' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'transportadora'))",
            check: null,
            role: 'authenticated',
            operation: 'DELETE'
        }
    ],
    'documentos-motorista': [
        {
            name: 'Users can upload driver documents',
            definition: "(bucket_id = 'documentos-motorista')",
            check: "(bucket_id = 'documentos-motorista')",
            role: 'authenticated',
            operation: 'INSERT'
        },
        {
            name: 'Users can read driver documents',
            definition: "(bucket_id = 'documentos-motorista')",
            check: null,
            role: 'authenticated',
            operation: 'SELECT'
        },
        {
            name: 'Users can delete driver documents',
            definition: "(bucket_id = 'documentos-motorista')",
            check: null,
            role: 'authenticated',
            operation: 'DELETE'
        }
    ],
    'documentos-veiculo': [
        {
            name: 'Users can upload vehicle documents',
            definition: "(bucket_id = 'documentos-veiculo')",
            check: "(bucket_id = 'documentos-veiculo')",
            role: 'authenticated',
            operation: 'INSERT'
        },
        {
            name: 'Users can read vehicle documents',
            definition: "(bucket_id = 'documentos-veiculo')",
            check: null,
            role: 'authenticated',
            operation: 'SELECT'
        },
        {
            name: 'Users can delete vehicle documents',
            definition: "(bucket_id = 'documentos-veiculo')",
            check: null,
            role: 'authenticated',
            operation: 'DELETE'
        }
    ],
    'documentos-empresa': [
        {
            name: 'Users can upload company documents',
            definition: "(bucket_id = 'documentos-empresa')",
            check: "(bucket_id = 'documentos-empresa')",
            role: 'authenticated',
            operation: 'INSERT'
        },
        {
            name: 'Users can read company documents',
            definition: "(bucket_id = 'documentos-empresa')",
            check: null,
            role: 'authenticated',
            operation: 'SELECT'
        },
        {
            name: 'Users can delete company documents',
            definition: "(bucket_id = 'documentos-empresa')",
            check: null,
            role: 'authenticated',
            operation: 'DELETE'
        }
    ],
    'fotos-veiculo': [
        {
            name: 'Users can upload vehicle photos',
            definition: "(bucket_id = 'fotos-veiculo')",
            check: "(bucket_id = 'fotos-veiculo')",
            role: 'authenticated',
            operation: 'INSERT'
        },
        {
            name: 'Anyone can read vehicle photos',
            definition: "(bucket_id = 'fotos-veiculo')",
            check: null,
            role: 'public',
            operation: 'SELECT'
        },
        {
            name: 'Users can delete vehicle photos',
            definition: "(bucket_id = 'fotos-veiculo')",
            check: null,
            role: 'authenticated',
            operation: 'DELETE'
        }
    ],
    'custos': [
        {
            name: 'Users can upload costs',
            definition: "(bucket_id = 'custos')",
            check: "(bucket_id = 'custos')",
            role: 'authenticated',
            operation: 'INSERT'
        },
        {
            name: 'Users can read costs',
            definition: "(bucket_id = 'custos')",
            check: null,
            role: 'authenticated',
            operation: 'SELECT'
        },
        {
            name: 'Users can delete costs',
            definition: "(bucket_id = 'custos')",
            check: null,
            role: 'authenticated',
            operation: 'DELETE'
        }
    ]
};

async function createPolicy(bucketId, policy) {
    try {
        // Criar política via SQL (requer execução via RPC ou SQL Editor)
        // Como não podemos executar SQL diretamente, vamos gerar instruções
        
        const sql = `
CREATE POLICY "${policy.name}"
ON storage.objects FOR ${policy.operation}
TO ${policy.role}
${policy.check ? `USING ${policy.definition}` : `USING ${policy.definition}`}
${policy.check ? `WITH CHECK ${policy.check}` : ''};
        `.trim();

        return { success: true, sql };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🚀 Criando políticas RLS para buckets em Português BR\n');
    console.log(`📡 Conectando ao Supabase: ${SUPABASE_URL.replace(/https?:\/\//, '').split('.')[0]}...\n`);

    console.log('⚠️  Nota: Políticas RLS precisam ser criadas via SQL\n');
    console.log('   Como o Supabase não permite criação de políticas via REST API,');
    console.log('   você precisa executar a seção 3 da migration SQL:\n');
    console.log('   📄 Arquivo: supabase/migrations/20250128_rename_buckets_pt_br.sql\n');

    // Gerar SQL para políticas
    console.log('📋 SQL para criar políticas RLS:\n');
    console.log('─'.repeat(70));

    for (const [bucketId, policies] of Object.entries(POLICIES_CONFIG)) {
        console.log(`\n-- Políticas para ${bucketId}`);
        for (const policy of policies) {
            const result = await createPolicy(bucketId, policy);
            if (result.success) {
                console.log(result.sql);
            }
        }
    }

    console.log('\n' + '─'.repeat(70));
    console.log('\n📋 Instruções:');
    console.log('   1. Copie o SQL acima');
    console.log('   2. Acesse: https://app.supabase.com');
    console.log('   3. Selecione seu projeto');
    console.log('   4. Vá em: SQL Editor → New Query');
    console.log('   5. Cole o SQL e execute (Run)\n');

    // Alternativamente, ler da migration
    const migrationPath = path.join(__dirname, '..', 'supabase/migrations/20250128_rename_buckets_pt_br.sql');
    if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        // Extrair apenas a seção de políticas RLS (seção 3)
        const policiesSection = migrationSQL.match(/-- =+.*?3\. POLÍTICAS RLS PARA BUCKETS NOVOS.*?-- =+.*?4\./s);
        
        if (policiesSection) {
            console.log('📄 Ou use a seção 3 completa da migration:\n');
            console.log('─'.repeat(70));
            console.log(policiesSection[0].replace(/-- =+.*?4\./s, '').trim());
            console.log('─'.repeat(70));
        }
    }

    console.log('\n✅ Script concluído! Execute o SQL acima no Supabase Dashboard.\n');
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });

