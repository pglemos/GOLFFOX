// Script para corrigir role do usuário teste@empresa.com
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fixUserRole() {
    const email = 'teste@empresa.com';
    const newRole = 'empresa';

    console.log(`🔧 Atualizando role do usuário ${email} para ${newRole}...`);

    try {
        // Primeiro, verificar o usuário atual
        const getResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id,email,role,name`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const users = await getResponse.json();
        console.log('📋 Usuário atual:', users);

        if (users.length === 0) {
            console.log('❌ Usuário não encontrado!');
            return;
        }

        // Atualizar o role
        const updateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ role: newRole })
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.text();
            console.error('❌ Erro ao atualizar:', error);
            return;
        }

        const updated = await updateResponse.json();
        console.log('✅ Usuário atualizado:', updated);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

fixUserRole();
