/**
 * Script para executar migration de roles via REST API do Supabase
 * Usa a Management API (requer acesso ao SQL Editor)
 */

const https = require('https');

const SUPABASE_URL = 'vmoxzesvjcfmrebagcwo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A';

const sql = `
-- 1. Remover constraint antiga
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Migrar roles
UPDATE users SET role = 'empresa' WHERE role = 'operator';
UPDATE users SET role = 'operador' WHERE role = 'carrier';
UPDATE users SET role = 'motorista' WHERE role = 'driver';
UPDATE users SET role = 'passageiro' WHERE role = 'passenger';

-- 3. Adicionar nova constraint
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'empresa', 'operador', 'motorista', 'passageiro'));
`;

async function executeSql() {
    console.log('🚀 Executando migration via REST API...\n');

    const postData = JSON.stringify({ query: sql });

    const options = {
        hostname: SUPABASE_URL,
        port: 443,
        path: '/rest/v1/rpc/exec_sql',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Status:', res.statusCode);
                console.log('Response:', data);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function checkCurrentRoles() {
    console.log('\n📊 Verificando roles atuais...');

    return new Promise((resolve, reject) => {
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: '/rest/v1/users?select=role',
            method: 'GET',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const users = JSON.parse(data);
                    const roleCount = {};
                    users.forEach(u => { roleCount[u.role] = (roleCount[u.role] || 0) + 1; });
                    console.log('Roles encontradas:', roleCount);
                    resolve(roleCount);
                } catch (e) {
                    console.log('Response:', data);
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    try {
        // Verificar roles antes
        const before = await checkCurrentRoles();

        // Se já temos roles em PT-BR, mostrar instruções para o usuário
        const hasOldRoles = before.operator || before.carrier || before.driver || before.passenger;

        if (!hasOldRoles) {
            console.log('\n✅ Roles já estão em PT-BR! Nenhuma migração necessária.');
            return;
        }

        // Tentar executar via RPC (provavelmente vai falhar)
        try {
            await executeSql();
            console.log('✅ Migration executada com sucesso!');
        } catch (e) {
            console.log('\n⚠️ RPC não disponível. Execute manualmente no Supabase Dashboard:\n');
            console.log('='.repeat(60));
            console.log(sql);
            console.log('='.repeat(60));
        }

        // Verificar roles depois
        await checkCurrentRoles();

    } catch (e) {
        console.error('❌ Erro:', e.message);
    }
}

main();
