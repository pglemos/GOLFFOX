const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function createTestUser() {
    const email = 'teste@empresa.com'
    const password = 'senha123'
    const role = 'operador'

    console.log(`Creating/Updating user ${email}...`)

    // 1. Get a company
    const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('is_active', true)
        .limit(1)

    if (!companies || companies.length === 0) {
        console.error('No active companies found. Cannot create operator user.')
        process.exit(1)
    }
    const companyId = companies[0].id
    console.log(`Assigning to company: ${companyId}`)

    // 2. Check if user exists in Auth
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existingAuthUser = users.find(u => u.email === email)

    let userId

    if (existingAuthUser) {
        console.log('User exists in Auth, updating password...')
        userId = existingAuthUser.id
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: password,
            user_metadata: { role: role }
        })
        if (updateError) console.error('Error updating auth user:', updateError)
    } else {
        console.log('Creating new Auth user...')
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: role }
        })
        if (createError) {
            console.error('Error creating auth user:', createError)
            process.exit(1)
        }
        userId = newUser.user.id
    }

    // 3. Upsert into public.users
    console.log('Upserting into public.users...')
    const { error: upsertError } = await supabase
        .from('users')
        .upsert({
            id: userId,
            email: email,
            name: 'Teste Empresa',
            role: role,
            company_id: companyId,
            is_active: true
        })

    if (upsertError) {
        console.error('Error upserting public user:', upsertError)
    } else {
        console.log('User created/updated successfully!')
    }

    // 4. Ensure mapping exists
    console.log('Ensuring user-company mapping...')
    const { error: mapError } = await supabase
        .from('gf_user_company_map')
        .upsert({
            user_id: userId,
            company_id: companyId,
            role: role
        }, { onConflict: 'user_id, company_id' })

    if (mapError) {
        console.error('Error creating mapping:', mapError)
    } else {
        console.log('Mapping created/updated successfully!')
    }
}

createTestUser()
