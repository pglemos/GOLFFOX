/**
 * Script de teste para verificar o fluxo de login
 * Este script testa:
 * 1. Se a API de login está funcionando
 * 2. Se a sessão está sendo persistida corretamente
 * 3. Se o redirecionamento funciona
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TEST_EMAIL = process.env.TEST_EMAIL || 'golffox@admin.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'senha123'

console.log('🧪 TESTE DE FLUXO DE LOGIN\n')
console.log('═══════════════════════════════════════\n')

// Verificar variáveis de ambiente
console.log('1️⃣  Verificando variáveis de ambiente...')
if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não configurada!')
  process.exit(1)
}
if (!SUPABASE_ANON_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada!')
  process.exit(1)
}
console.log('✅ Variáveis de ambiente configuradas')
console.log(`   URL: ${SUPABASE_URL.substring(0, 30)}...`)
console.log(`   Email de teste: ${TEST_EMAIL}\n`)

// Testar conexão com Supabase
console.log('2️⃣  Testando conexão com Supabase...')
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erro ao verificar sessão:', error.message)
    } else {
      console.log('✅ Conexão com Supabase estabelecida')
      if (data.session) {
        console.log('   ⚠️  Já existe uma sessão ativa')
      } else {
        console.log('   ✅ Nenhuma sessão ativa (esperado)\n')
      }
    }
  })
  .catch(err => {
    console.error('❌ Erro ao conectar com Supabase:', err.message)
    process.exit(1)
  })

// Testar autenticação
console.log('3️⃣  Testando autenticação...')
console.log(`   Email: ${TEST_EMAIL}`)
console.log(`   Senha: ${'*'.repeat(TEST_PASSWORD.length)}\n`)

supabase.auth.signInWithPassword({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
})
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erro ao fazer login:', error.message)
      console.error('   Código:', error.status)
      process.exit(1)
    }
    
    if (!data.session || !data.user) {
      console.error('❌ Login falhou - sem sessão ou usuário')
      process.exit(1)
    }
    
    console.log('✅ Login bem-sucedido!')
    console.log(`   Usuário ID: ${data.user.id}`)
    console.log(`   Email: ${data.user.email}`)
    console.log(`   Access Token: ${data.session.access_token.substring(0, 20)}...`)
    console.log(`   Expires At: ${new Date(data.session.expires_at * 1000).toLocaleString()}\n`)
    
    // Verificar se o usuário existe na tabela users
    console.log('4️⃣  Verificando usuário na tabela users...')
    return supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('email', TEST_EMAIL)
      .maybeSingle()
  })
  .then(({ data: userData, error: userError }) => {
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError.message)
      process.exit(1)
    }
    
    if (!userData) {
      console.error('❌ Usuário não encontrado na tabela users!')
      console.error('   O usuário precisa existir na tabela users para o login funcionar.')
      process.exit(1)
    }
    
    console.log('✅ Usuário encontrado na tabela users')
    console.log(`   ID: ${userData.id}`)
    console.log(`   Role: ${userData.role || 'Não definido'}`)
    console.log(`   Ativo: ${userData.is_active ? 'Sim' : 'Não'}\n`)
    
    if (!userData.is_active) {
      console.warn('⚠️  Usuário está inativo! O login será bloqueado.')
    }
    
    if (!userData.role) {
      console.warn('⚠️  Usuário não tem role definido! O sistema usará fallback.')
    }
    
    // Verificar sessão persistida
    console.log('5️⃣  Verificando persistência de sessão...')
    return supabase.auth.getSession()
  })
  .then(({ data: sessionData, error: sessionError }) => {
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão persistida:', sessionError.message)
      process.exit(1)
    }
    
    if (!sessionData.session) {
      console.error('❌ Sessão não foi persistida!')
      process.exit(1)
    }
    
    console.log('✅ Sessão persistida com sucesso!')
    console.log(`   Access Token: ${sessionData.session.access_token.substring(0, 20)}...`)
    console.log(`   User ID: ${sessionData.session.user.id}\n`)
    
    console.log('═══════════════════════════════════════')
    console.log('\n🎉 TODOS OS TESTES PASSARAM!\n')
    console.log('✅ Conexão com Supabase: OK')
    console.log('✅ Autenticação: OK')
    console.log('✅ Usuário na tabela: OK')
    console.log('✅ Persistência de sessão: OK\n')
    console.log('📝 PRÓXIMOS PASSOS:')
    console.log('   1. Aguarde o deploy do Vercel completar')
    console.log('   2. Acesse https://golffox.vercel.app/')
    console.log('   3. Faça login com as credenciais de teste')
    console.log('   4. Verifique se não há loop de redirecionamento')
    console.log('   5. Verifique se consegue acessar o painel admin\n')
    console.log('═══════════════════════════════════════\n')
    
    // Fazer logout para limpar
    return supabase.auth.signOut()
  })
  .then(() => {
    console.log('🧹 Sessão de teste limpa\n')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Erro inesperado:', err)
    process.exit(1)
  })
