/**
 * Script para Aplicar Políticas RLS via Supabase API
 * GolfFox - Padronização de Nomenclatura PT-BR
 * 
 * Como não podemos executar SQL diretamente via API, vamos usar
 * a API REST do Supabase para criar as políticas via função RPC
 * ou instruir o usuário a executar manualmente
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

async function createRPCFunction() {
    // Criar função RPC para executar SQL (se não existir)
    const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            EXECUTE sql_text;
        END;
        $$;
    `;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ sql_text: createFunctionSQL })
        });

        return response.ok;
    } catch (error) {
        return false;
    }
}

async function executeSQL(sql) {
    // Tentar executar via RPC
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ sql_text: sql })
        });

        if (response.ok) {
            return { success: true };
        } else {
            const error = await response.text();
            return { success: false, error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🚀 Aplicando políticas RLS via Supabase API\n');
    console.log(`📡 Conectando ao Supabase: ${SUPABASE_URL.replace(/https?:\/\//, '').split('.')[0]}...\n`);

    // Ler migration SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250128_create_bucket_policies_pt_br.sql');
    
    if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Arquivo não encontrado: ${migrationPath}`);
        process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration carregada\n');
    console.log('⚠️  Nota: Supabase não permite execução direta de SQL via REST API por segurança\n');
    console.log('📋 SOLUÇÃO: Execute a migration via Supabase Dashboard\n');
    console.log('='.repeat(70));
    console.log('\n📋 INSTRUÇÕES:\n');
    console.log('1. Acesse: https://app.supabase.com');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá em: SQL Editor → New Query');
    console.log('4. Cole o SQL abaixo e execute (Run ou Ctrl+Enter)\n');
    console.log('='.repeat(70));
    console.log('\n📄 SQL PARA EXECUTAR:\n');
    console.log(migrationSQL);
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Após executar, as políticas RLS estarão criadas!\n');
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    });

