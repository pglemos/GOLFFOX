require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function resetPasswords() {
    const users = ['teste@motorista.com', 'teste@passageiro.com']
    const newPassword = '123456' // Senha simples para teste

    console.log('🔄 Resetando senhas para:', newPassword)

    for (const email of users) {
        // 1. Buscar ID do usuário
        const { data: { users: foundUsers }, error: searchError } = await supabase.auth.admin.listUsers()
        const user = foundUsers?.find(u => u.email === email)

        if (!user) {
            console.log(`❌ Usuário não encontrado: ${email}`)
            continue
        }

        // 2. Atualizar senha
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        )

        if (updateError) {
            console.error(`❌ Erro ao atualizar ${email}:`, updateError.message)
        } else {
            console.log(`✅ Senha atualizada: ${email}`)
        }
    }
}

resetPasswords()
