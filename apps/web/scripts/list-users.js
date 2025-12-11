// Script para listar usuários existentes no banco
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function listUsers() {
    console.log('🔍 Listando usuários no banco de dados...\n');

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email,role,name,is_active&order=email`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('❌ Erro na API:', response.status, response.statusText);
            return;
        }

        const users = await response.json();

        console.log('📋 Usuários encontrados:\n');
        console.log('Email'.padEnd(35) + 'Role'.padEnd(15) + 'Ativo'.padEnd(8) + 'Nome');
        console.log('-'.repeat(80));

        users.forEach(user => {
            console.log(
                (user.email || 'N/A').padEnd(35) +
                (user.role || 'N/A').padEnd(15) +
                (user.is_active ? 'Sim' : 'Não').padEnd(8) +
                (user.name || 'N/A')
            );
        });

        console.log('\n✅ Total de usuários:', users.length);

        // Verificar se teste@empresa.com existe
        const testeEmpresa = users.find(u => u.email === 'teste@empresa.com');
        if (testeEmpresa) {
            console.log('\n📧 teste@empresa.com encontrado:', testeEmpresa);
        } else {
            console.log('\n⚠️ teste@empresa.com NÃO encontrado no banco!');
            console.log('   Use um dos emails acima para login.');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

listUsers();
