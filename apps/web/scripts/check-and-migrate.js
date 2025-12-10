/**
 * Script para executar SQL via fetch diretamente no Supabase
 * Usa a API REST com service role key
 */

const SUPABASE_URL = 'https://vmoxzesvjcfmrebagcwo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A';

// Migrations para executar uma por uma
const migrations = [
    // Campos bancários
    { name: 'bank_name', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_name TEXT` },
    { name: 'bank_code', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_code TEXT` },
    { name: 'bank_agency', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_agency TEXT` },
    { name: 'bank_account', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_account TEXT` },
    { name: 'bank_account_type', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_account_type TEXT DEFAULT 'corrente'` },
    { name: 'pix_key', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS pix_key TEXT` },
    { name: 'pix_key_type', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cnpj'` },

    // Campos representante legal
    { name: 'legal_rep_name', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_name TEXT` },
    { name: 'legal_rep_cpf', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_cpf TEXT` },
    { name: 'legal_rep_rg', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_rg TEXT` },
    { name: 'legal_rep_email', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_email TEXT` },
    { name: 'legal_rep_phone', sql: `ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_phone TEXT` },
];

async function checkColumnExists(columnName) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/carriers?select=${columnName}&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        // Se a coluna não existe, o Supabase retorna erro 400 ou mensagem de erro
        if (response.ok) {
            return true;
        }

        const text = await response.text();
        if (text.includes('column') && text.includes('does not exist')) {
            return false;
        }

        return response.ok;
    } catch (e) {
        return false;
    }
}

async function insertTestValue(columnName) {
    // Primeiro, pegar um carrier existente
    const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/carriers?select=id&limit=1`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
    });

    if (!getResponse.ok) {
        console.log(`   ℹ️ Não há carriers para testar`);
        return false;
    }

    const carriers = await getResponse.json();
    if (carriers.length === 0) {
        console.log(`   ℹ️ Nenhum carrier encontrado`);
        return false;
    }

    const carrierId = carriers[0].id;

    // Tentar atualizar com valor de teste
    const updateBody = {};
    updateBody[columnName] = `test_${Date.now()}`;

    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/carriers?id=eq.${carrierId}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateBody)
    });

    if (updateResponse.ok) {
        // Limpar o valor de teste
        const clearBody = {};
        clearBody[columnName] = null;

        await fetch(`${SUPABASE_URL}/rest/v1/carriers?id=eq.${carrierId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(clearBody)
        });

        return true;
    }

    return false;
}

async function runMigrations() {
    console.log('🚀 Verificando e aplicando migrations de colunas...\n');

    let columnsOk = 0;
    let columnsMissing = 0;

    for (const migration of migrations) {
        const exists = await checkColumnExists(migration.name);

        if (exists) {
            console.log(`✅ ${migration.name} - já existe`);
            columnsOk++;
        } else {
            console.log(`❌ ${migration.name} - NÃO EXISTE (precisa executar SQL manualmente)`);
            columnsMissing++;
        }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Colunas existentes: ${columnsOk}`);
    console.log(`   ❌ Colunas faltando: ${columnsMissing}`);

    if (columnsMissing > 0) {
        console.log(`\n⚠️ Algumas colunas não existem.`);
        console.log(`   Por favor, execute o SQL manualmente no Supabase Dashboard.`);
        console.log(`   URL: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/sql/new`);

        console.log(`\n📝 SQL para copiar e colar:\n`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_name TEXT;`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_code TEXT;`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_agency TEXT;`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_account TEXT;`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_account_type TEXT DEFAULT 'corrente';`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS pix_key TEXT;`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cnpj';`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_name TEXT;`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_cpf TEXT;`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_rg TEXT;`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_email TEXT;`);
        console.log(`ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_phone TEXT;`);
    } else {
        console.log(`\n🎉 Todas as colunas já existem! Nenhuma migration necessária.`);
    }

    // Tentar verificar tabela trip_passengers
    console.log(`\n📊 Verificando tabela trip_passengers...`);
    const tpResponse = await fetch(`${SUPABASE_URL}/rest/v1/trip_passengers?select=*&limit=1`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
    });

    if (tpResponse.ok) {
        console.log(`   ✅ Tabela trip_passengers existe`);
    } else {
        console.log(`   ❌ Tabela trip_passengers NÃO existe (precisa criar)`);
        console.log(`\n📝 SQL para criar trip_passengers:\n`);
        console.log(`CREATE TABLE IF NOT EXISTS public.trip_passengers (`);
        console.log(`    trip_id UUID NOT NULL,`);
        console.log(`    passenger_id UUID NOT NULL,`);
        console.log(`    status TEXT DEFAULT 'scheduled',`);
        console.log(`    boarded_at TIMESTAMPTZ,`);
        console.log(`    created_at TIMESTAMPTZ DEFAULT NOW(),`);
        console.log(`    PRIMARY KEY (trip_id, passenger_id)`);
        console.log(`);`);
    }
}

runMigrations();
