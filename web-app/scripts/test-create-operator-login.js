const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testCreateUser() {
  const testEmail = `test-${Date.now()}@test.com`
  const testPassword = 'test123456'
  const testName = 'Test User'

  console.log('🔐 Testando criação de usuário...')
  console.log(`   Email: ${testEmail}`)
  console.log(`   Password: ${testPassword}`)
  console.log(`   Name: ${testName}`)

  try {
    // Tentar criar usuário simples primeiro
    console.log('\n📝 Tentativa 1: Criar usuário sem metadata...')
    const result1 = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })

    if (result1.error) {
      console.error('❌ Erro na tentativa 1:', {
        message: result1.error.message,
        status: result1.error.status,
        code: result1.error.code
      })

      // Tentar sem email_confirm
      console.log('\n📝 Tentativa 2: Criar usuário sem email_confirm...')
      const result2 = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword
      })

      if (result2.error) {
        console.error('❌ Erro na tentativa 2:', {
          message: result2.error.message,
          status: result2.error.status,
          code: result2.error.code
        })

        // Tentar com senha mais simples
        console.log('\n📝 Tentativa 3: Criar usuário com senha mais simples...')
        const result3 = await supabase.auth.admin.createUser({
          email: testEmail,
          password: '123456'
        })

        if (result3.error) {
          console.error('❌ Erro na tentativa 3:', {
            message: result3.error.message,
            status: result3.error.status,
            code: result3.error.code
          })
          console.error('\n❌ Todas as tentativas falharam. Verifique:')
          console.error('   1. Se o Supabase está configurado corretamente')
          console.error('   2. Se há triggers ou funções no banco que estão falhando')
          console.error('   3. Se há constraints que estão bloqueando a criação')
          process.exit(1)
        } else {
          console.log('✅ Sucesso na tentativa 3!')
          console.log('   User ID:', result3.data.user.id)
          
          // Limpar usuário de teste
          await supabase.auth.admin.deleteUser(result3.data.user.id)
          console.log('✅ Usuário de teste removido')
        }
      } else {
        console.log('✅ Sucesso na tentativa 2!')
        console.log('   User ID:', result2.data.user.id)
        
        // Limpar usuário de teste
        await supabase.auth.admin.deleteUser(result2.data.user.id)
        console.log('✅ Usuário de teste removido')
      }
    } else {
      console.log('✅ Sucesso na tentativa 1!')
      console.log('   User ID:', result1.data.user.id)
      
      // Limpar usuário de teste
      await supabase.auth.admin.deleteUser(result1.data.user.id)
      console.log('✅ Usuário de teste removido')
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

testCreateUser()
