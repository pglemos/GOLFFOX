#!/usr/bin/env node
/**
 * Script simplificado para criar usuários de teste para o App Mobile
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const mobileUsers = [
    {
        email: 'teste@motorista.com',
        password: 'senha123',
        name: 'Motorista Teste',
        role: 'motorista'
    },
    {
        email: 'teste@passageiro.com',
        password: 'senha123',
        name: 'Passageiro Mobile',
        role: 'passageiro'
    }
]

async function createMobileUsers() {
    console.log('🚀 Criando usuários para o App Mobile...\n')

    for (const user of mobileUsers) {
        try {
            // Verificar se já existe
            const { data: existingUser } = await supabase.auth.admin.getUserByEmail(user.email)

            if (existingUser?.user) {
                console.log(`⏭️  ${user.email} já existe (ID: ${existingUser.user.id})`)

                // Atualizar metadados
                await supabase.auth.admin.updateUserById(existingUser.user.id, {
                    user_metadata: { name: user.name, role: user.role }
                })
                console.log(`   ✅ Metadados atualizados\n`)
                continue
            }

            // Criar usuário
            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: {
                    name: user.name,
                    role: user.role
                }
            })

            if (error) {
                console.error(`❌ Erro ao criar ${user.email}: ${error.message}\n`)
                continue
            }

            console.log(`✅ Criado: ${user.email}`)
            console.log(`   ID: ${data.user.id}`)
            console.log(`   Role: ${user.role}\n`)

            // Tentar inserir na tabela users (se existir)
            const { error: profileError } = await supabase
                .from('users')
                .upsert({
                    id: data.user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }, { onConflict: 'id' })

            if (profileError) {
                console.log(`   ⚠️  Aviso tabela users: ${profileError.message}`)
            } else {
                console.log(`   ✅ Perfil criado na tabela users`)
            }

        } catch (err) {
            console.error(`❌ Erro: ${err.message}\n`)
        }
    }

    console.log('\n📋 Credenciais de Login:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    mobileUsers.forEach(u => {
        console.log(`   ${u.email} / ${u.password} (${u.role})`)
    })
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n✅ Pronto! Teste no app mobile.')
}

createMobileUsers()
