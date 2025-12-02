const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('==================================================')
console.log('CRIANDO USUARIOS DE TESTE - GOLFFOX')
console.log('==================================================\n')

const testUsers = [
    {
        email: 'golffox@admin.com',
        password: 'senha123',
        role: 'admin',
        name: 'Admin GolfFox'
    },
    {
        email: 'teste@transportadora.com',
        password: 'senha123',
        role: 'carrier',
        name: 'Teste Transportadora'
    },
    {
        email: 'teste@empresa.com',
        password: 'senha123',
        role: 'operador',
        name: 'Teste Empresa'
    }
]

async function createUsers() {
    for (const user of testUsers) {
        console.log(`\nCriando usuario: ${user.email}`)
        console.log(`  Role: ${user.role}`)

        try {
            // 1. Criar no Supabase Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: {
                    name: user.name,
                    role: user.role
                }
            })

            if (authError) {
                if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
                    console.log(`  OK Usuario ja existe no Auth`)

                    // Buscar ID do usuario existente
                    const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers()
                    const existingUser = existingUsers.find(u => u.email === user.email)

                    if (existingUser) {
                        console.log(`  ID: ${existingUser.id}`)

                        // Tentar criar/atualizar na tabela users
                        const { error: upsertError } = await supabaseAdmin
                            .from('users')
                            .upsert({
                                id: existingUser.id,
                                email: user.email,
                                role: user.role,
                                name: user.name,
                                is_active: true
                            }, {
                                onConflict: 'id'
                            })

                        if (upsertError) {
                            console.log(`  Aviso: Erro ao atualizar tabela users: ${upsertError.message}`)
                        } else {
                            console.log(`  OK Atualizado na tabela users`)
                        }
                    }
                } else {
                    console.log(`  ERRO: ${authError.message}`)
                }
                continue
            }

            if (authData && authData.user) {
                console.log(`  OK Criado no Auth - ID: ${authData.user.id}`)

                // 2. Criar na tabela users
                const { error: userError } = await supabaseAdmin
                    .from('users')
                    .upsert({
                        id: authData.user.id,
                        email: user.email,
                        role: user.role,
                        name: user.name,
                        is_active: true
                    }, {
                        onConflict: 'id'
                    })

                if (userError) {
                    console.log(`  Aviso: Erro ao criar na tabela users: ${userError.message}`)
                } else {
                    console.log(`  OK Criado na tabela users`)
                }
            }

        } catch (e) {
            console.log(`  ERRO: ${e.message}`)
        }
    }

    // Verificação final
    console.log('\n==================================================')
    console.log('VERIFICACAO FINAL')
    console.log('==================================================\n')

    try {
        const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()
        const testAuthUsers = authUsers.filter(u =>
            u.email === 'golffox@admin.com' ||
            u.email === 'teste@transportadora.com' ||
            u.email === 'teste@empresa.com'
        )

        console.log(`Usuarios no Supabase Auth: ${testAuthUsers.length}/3`)
        testAuthUsers.forEach(u => {
            console.log(`  - ${u.email} (ID: ${u.id})`)
        })

        const { data: dbUsers } = await supabaseAdmin
            .from('users')
            .select('id, email, role')
            .in('email', ['golffox@admin.com', 'teste@transportadora.com', 'teste@empresa.com'])

        console.log(`\nUsuarios na tabela users: ${dbUsers?.length || 0}/3`)
        if (dbUsers) {
            dbUsers.forEach(u => {
                console.log(`  - ${u.email} (Role: ${u.role})`)
            })
        }

        console.log('\n==================================================')
        if (testAuthUsers.length === 3 && dbUsers?.length === 3) {
            console.log('SUCESSO! Todos os usuarios criados.')
        } else {
            console.log('ATENCAO: Alguns usuarios podem estar faltando.')
        }
        console.log('==================================================')

    } catch (e) {
        console.log(`Erro na verificacao: ${e.message}`)
    }
}

createUsers().catch(console.error)
