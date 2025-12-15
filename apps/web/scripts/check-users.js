require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
    const m = await supabase.auth.admin.getUserByEmail('teste@motorista.com')
    const p = await supabase.auth.admin.getUserByEmail('teste@passageiro.com')

    console.log('Motorista:', m.data?.user ? `EXISTS (ID: ${m.data.user.id})` : 'NOT FOUND')
    console.log('Passageiro:', p.data?.user ? `EXISTS (ID: ${p.data.user.id})` : 'NOT FOUND')
}

check()
