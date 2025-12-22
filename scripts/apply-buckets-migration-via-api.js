/**
 * Script para Aplicar Migration de Buckets via Supabase API
 * GolfFox - Padronização de Nomenclatura PT-BR
 * 
 * Usa fetch direto para chamar API do Supabase
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
    console.error('   Ou execute: node scripts/apply-buckets-migration-direct.js (requer DATABASE_URL)');
    process.exit(1);
}

async function applyMigration() {
    console.log('🚀 Iniciando migração de buckets para Português BR\n');
    console.log(`📡 Conectando ao Supabase: ${SUPABASE_URL.replace(/https?:\/\//, '').split('.')[0]}...\n`);

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

        // Tentar executar via RPC exec_sql (se disponível)
        console.log('⚙️  Tentando executar via Supabase RPC...\n');
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({ sql: migrationSQL })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Migration aplicada com sucesso via RPC!\n');
                
                // Verificar resultados
                await verifyMigration();
                return;
            } else {
                const errorText = await response.text();
                console.log(`⚠️  RPC não disponível (${response.status}): ${errorText.substring(0, 100)}`);
            }
        } catch (error) {
            console.log(`⚠️  Erro ao tentar RPC: ${error.message}`);
        }

        // Se RPC não funcionar, usar método alternativo
        console.log('\n📋 Método alternativo: Executar via Supabase Dashboard\n');
        console.log('   Como o Supabase não permite execução direta de SQL via API por segurança,');
        console.log('   você precisa executar a migration manualmente:\n');
        console.log('   1. Acesse: https://app.supabase.com');
        console.log('   2. Selecione seu projeto');
        console.log('   3. Vá em: SQL Editor → New Query');
        console.log('   4. Abra o arquivo: supabase/migrations/20250128_rename_buckets_pt_br.sql');
        console.log('   5. Copie TODO o conteúdo');
        console.log('   6. Cole no SQL Editor');
        console.log('   7. Clique em Run (ou Ctrl+Enter)\n');
        
        // Verificar buckets atuais
        await verifyCurrentBuckets();

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

async function verifyCurrentBuckets() {
    console.log('🔍 Verificando buckets atuais...\n');

    try {
        // Listar buckets via Storage API
        const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        if (response.ok) {
            const buckets = await response.json();
            
            const oldBuckets = buckets.filter(b => [
                'vehicle-documents', 'veiculo-documents',
                'driver-documents', 'motorista-documents',
                'carrier-documents', 'transportadora-documents',
                'company-documents',
                'vehicle-photos', 'veiculo-photos',
                'avatars',
                'costs'
            ].includes(b.id));

            const newBuckets = buckets.filter(b => [
                'documentos-veiculo',
                'documentos-motorista',
                'documentos-transportadora',
                'documentos-empresa',
                'fotos-veiculo',
                'avatares',
                'custos'
            ].includes(b.id));

            if (oldBuckets.length > 0) {
                console.log(`📦 Buckets antigos encontrados (${oldBuckets.length}):`);
                oldBuckets.forEach(b => console.log(`   - ${b.id}`));
            }

            if (newBuckets.length > 0) {
                console.log(`\n✅ Buckets novos encontrados (${newBuckets.length}):`);
                newBuckets.forEach(b => console.log(`   ✅ ${b.id}`));
            } else {
                console.log('\n⚠️  Nenhum bucket novo encontrado');
                console.log('   A migration ainda não foi aplicada');
            }
        } else {
            console.log('⚠️  Não foi possível verificar buckets via API');
        }
    } catch (error) {
        console.log(`⚠️  Erro ao verificar buckets: ${error.message}`);
    }
}

async function verifyMigration() {
    console.log('🔍 Verificando resultados da migration...\n');

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

            console.log(`✅ ${newBuckets.length}/7 buckets em português encontrados:\n`);
            newBuckets.forEach(bucket => {
                const publicStatus = bucket.public ? 'público' : 'privado';
                const sizeLimit = bucket.file_size_limit 
                    ? `${(bucket.file_size_limit / 1024 / 1024).toFixed(0)}MB` 
                    : 'sem limite';
                console.log(`   ✅ ${bucket.id}`);
                console.log(`      Status: ${publicStatus}, Limite: ${sizeLimit}`);
            });

            if (newBuckets.length < 7) {
                console.log(`\n⚠️  Faltam ${7 - newBuckets.length} buckets. Verifique a migration.`);
            }
        }
    } catch (error) {
        console.log(`⚠️  Erro ao verificar: ${error.message}`);
    }
}

// Executar
applyMigration()
    .then(() => {
        console.log('\n✅ Processo concluído!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });

