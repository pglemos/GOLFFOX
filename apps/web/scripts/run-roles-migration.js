const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vmoxzesvjcfmrebagcwo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function runMigration() {
    console.log('🚀 Iniciando migration de roles para PT-BR...\n');

    try {
        // 1. Remover constraint antiga usando RPC
        console.log('🔧 Removendo constraint users_role_check...');
        const { error: dropError } = await supabase.rpc('exec_sql', {
            query: 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;'
        });

        if (dropError) {
            console.log('⚠️ RPC exec_sql não disponível, tentando via fetch...');

            // Usar Management API para executar SQL (requer token OAuth, não disponível)
            // Alternativa: criar função RPC no banco
            console.log('⚠️ Precisa executar manualmente no Supabase Dashboard:');
            console.log('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
        } else {
            console.log('✅ Constraint removida');
        }

        // 2. Verificar roles atuais
        console.log('\n📊 Verificando roles atuais...');
        const { data: beforeData } = await supabase.from('users').select('role').limit(1000);
        const roleCount = {};
        beforeData?.forEach(u => { roleCount[u.role] = (roleCount[u.role] || 0) + 1; });
        console.log('Roles atuais:', roleCount);

        // 3. Tentar migrações (vai funcionar se constraint foi removida)
        const migrations = [
            { from: 'operator', to: 'empresa' },
            { from: 'carrier', to: 'operador' },
            { from: 'driver', to: 'motorista' },
            { from: 'passenger', to: 'passageiro' }
        ];

        for (const m of migrations) {
            console.log(`🔄 Migrando ${m.from} → ${m.to}...`);
            const { error } = await supabase.from('users').update({ role: m.to }).eq('role', m.from);
            if (error) {
                console.log(`⚠️ ${m.from} → ${m.to}: ${error.message.includes('constraint') ? 'BLOQUEADO (constraint ativa)' : error.message}`);
            } else {
                console.log(`✅ ${m.from} → ${m.to} concluído`);
            }
        }

        // 4. Verificar roles após
        console.log('\n📊 Verificando roles após migração...');
        const { data: afterData } = await supabase.from('users').select('role').limit(1000);
        const afterCount = {};
        afterData?.forEach(u => { afterCount[u.role] = (afterCount[u.role] || 0) + 1; });
        console.log('Roles depois:', afterCount);

        // 5. Instruções finais se constraint ainda ativa
        if (JSON.stringify(roleCount) === JSON.stringify(afterCount)) {
            console.log('\n⚠️ ATENÇÃO: Migration bloqueada pela constraint.');
            console.log('Execute no Supabase Dashboard (SQL Editor):\n');
            console.log('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
            console.log("UPDATE users SET role = 'motorista' WHERE role = 'driver';");
            console.log("UPDATE users SET role = 'passageiro' WHERE role = 'passenger';");
            console.log("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'empresa', 'operador', 'motorista', 'passageiro', 'transportadora'));");
        } else {
            console.log('\n✅ Migration concluída com sucesso!');
        }
    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
}

runMigration();
