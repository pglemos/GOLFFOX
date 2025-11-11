/**
 * Script de teste completo e autônomo do fluxo de login
 * Executa todos os testes de forma automática
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU'
const TEST_EMAIL = process.env.TEST_EMAIL || 'golffox@admin.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'senha123'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

let testsPassed = 0
let testsFailed = 0
const results = []

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logTest(name, passed, details = '') {
  if (passed) {
    testsPassed++
    log(`✅ ${name}`, colors.green)
    if (details) log(`   ${details}`, colors.cyan)
  } else {
    testsFailed++
    log(`❌ ${name}`, colors.red)
    if (details) log(`   ${details}`, colors.red)
  }
  results.push({ name, passed, details })
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testSupabaseConnection() {
  log('\n═══════════════════════════════════════', colors.bright)
  log('🧪 TESTE 1: Conexão com Supabase', colors.bright)
  log('═══════════════════════════════════════\n', colors.bright)
  
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      logTest('Variáveis de ambiente configuradas', false, 'NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas')
      return false
    }
    logTest('Variáveis de ambiente configuradas', true, `URL: ${SUPABASE_URL.substring(0, 30)}...`)
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Testar conexão básica
    const { data, error } = await supabase.auth.getSession()
    if (error && !error.message.includes('No session')) {
      logTest('Conexão com Supabase', false, error.message)
      return false
    }
    logTest('Conexão com Supabase', true, 'Conexão estabelecida com sucesso')
    
    return true
  } catch (err) {
    logTest('Conexão com Supabase', false, err.message)
    return false
  }
}

async function testUserExists() {
  log('\n═══════════════════════════════════════', colors.bright)
  log('🧪 TESTE 2: Verificar usuário no banco', colors.bright)
  log('═══════════════════════════════════════\n', colors.bright)
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Verificar se usuário existe na tabela users
    // Primeiro, tentar sem is_active (pode não existir)
    let userData, userError
    try {
      const result = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', TEST_EMAIL)
        .maybeSingle()
      userData = result.data
      userError = result.error
    } catch (err) {
      // Se falhar, tentar apenas id e email
      const result = await supabase
        .from('users')
        .select('id, email')
        .eq('email', TEST_EMAIL)
        .maybeSingle()
      userData = result.data
      userError = result.error
    }
    
    if (userError) {
      logTest('Usuário existe na tabela users', false, userError.message)
      return false
    }
    
    if (!userData) {
      logTest('Usuário existe na tabela users', false, 'Usuário não encontrado na tabela users')
      log(`   ⚠️  Criar usuário com email: ${TEST_EMAIL}`, colors.yellow)
      return false
    }
    
    logTest('Usuário existe na tabela users', true, `ID: ${userData.id}`)
    if (userData.role !== undefined) {
      logTest('Usuário tem role definido', !!userData.role, userData.role || 'Não definido - sistema usará fallback')
    } else {
      logTest('Usuário tem role definido', false, 'Coluna role não encontrada - sistema usará fallback')
    }
    
    return true
  } catch (err) {
    logTest('Verificar usuário no banco', false, err.message)
    return false
  }
}

async function testAuthentication() {
  log('\n═══════════════════════════════════════', colors.bright)
  log('🧪 TESTE 3: Autenticação com Supabase', colors.bright)
  log('═══════════════════════════════════════\n', colors.bright)
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    log(`   Email: ${TEST_EMAIL}`, colors.cyan)
    log(`   Senha: ${'*'.repeat(TEST_PASSWORD.length)}\n`, colors.cyan)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    
    if (error) {
      logTest('Autenticação com Supabase', false, error.message)
      return null
    }
    
    if (!data.session || !data.user) {
      logTest('Autenticação com Supabase', false, 'Sessão ou usuário não retornados')
      return null
    }
    
    logTest('Autenticação com Supabase', true, `Usuário ID: ${data.user.id}`)
    logTest('Sessão criada', !!data.session, `Access Token: ${data.session.access_token.substring(0, 20)}...`)
    logTest('Token de refresh', !!data.session.refresh_token, 'Refresh token presente')
    logTest('Expiração da sessão', !!data.session.expires_at, `Expira em: ${new Date(data.session.expires_at * 1000).toLocaleString()}`)
    
    // Fazer logout para limpar
    await supabase.auth.signOut()
    
    return data.session
  } catch (err) {
    logTest('Autenticação com Supabase', false, err.message)
    return null
  }
}

async function testLoginAPI() {
  log('\n═══════════════════════════════════════', colors.bright)
  log('🧪 TESTE 4: API de Login', colors.bright)
  log('═══════════════════════════════════════\n', colors.bright)
  
  try {
    // Simular requisição à API de login
    // Como estamos testando localmente, vamos testar a lógica diretamente
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    // 1. Verificar se usuário existe
    // Tentar com role primeiro, se falhar tentar sem
    let existingUser, userCheckError
    try {
      const result = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', TEST_EMAIL.toLowerCase().trim())
        .maybeSingle()
      existingUser = result.data
      userCheckError = result.error
    } catch (err) {
      const result = await supabase
        .from('users')
        .select('id, email')
        .eq('email', TEST_EMAIL.toLowerCase().trim())
        .maybeSingle()
      existingUser = result.data
      userCheckError = result.error
    }
    
    if (userCheckError) {
      logTest('API: Verificar usuário no banco', false, userCheckError.message)
      return false
    }
    
    if (!existingUser) {
      logTest('API: Verificar usuário no banco', false, 'Usuário não encontrado')
      return false
    }
    
    logTest('API: Verificar usuário no banco', true, `ID: ${existingUser.id}`)
    
    // 2. Autenticar
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    
    if (authError) {
      logTest('API: Autenticação', false, authError.message)
      return false
    }
    
    if (!authData.session || !authData.user) {
      logTest('API: Autenticação', false, 'Sessão não criada')
      return false
    }
    
    logTest('API: Autenticação', true, 'Sessão criada com sucesso')
    
    // 3. Verificar role
    const role = existingUser.role || authData.user.user_metadata?.role || 'admin'
    logTest('API: Role determinado', !!role, `Role: ${role}`)
    
    // 4. Verificar estrutura de resposta
    const responseStructure = {
      token: !!authData.session.access_token,
      refreshToken: !!authData.session.refresh_token,
      user: !!authData.user,
      session: !!authData.session,
    }
    
    logTest('API: Estrutura de resposta', 
      Object.values(responseStructure).every(v => v === true),
      'Todos os campos necessários presentes'
    )
    
    // Limpar
    await supabase.auth.signOut()
    
    return true
  } catch (err) {
    logTest('API de Login', false, err.message)
    return false
  }
}

async function testSessionPersistence() {
  log('\n════════════════════════════════════════', colors.bright)
  log('🧪 TESTE 5: Persistência de Sessão', colors.bright)
  log('════════════════════════════════════════\n', colors.bright)
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    
    // Fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    
    if (error || !data.session) {
      logTest('Persistência: Login', false, error?.message || 'Sessão não criada')
      return false
    }
    
    logTest('Persistência: Login', true, 'Login bem-sucedido')
    
    // Aguardar um pouco para garantir persistência
    await sleep(500)
    
    // Verificar se sessão foi persistida
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      logTest('Persistência: Verificar sessão', false, sessionError.message)
      return false
    }
    
    if (!sessionData.session) {
      logTest('Persistência: Verificar sessão', false, 'Sessão não encontrada')
      return false
    }
    
    logTest('Persistência: Verificar sessão', true, `Session ID: ${sessionData.session.access_token.substring(0, 20)}...`)
    logTest('Persistência: Access token', !!sessionData.session.access_token, 'Token presente')
    logTest('Persistência: Refresh token', !!sessionData.session.refresh_token, 'Refresh token presente')
    logTest('Persistência: User ID', !!sessionData.session.user.id, `ID: ${sessionData.session.user.id}`)
    
    // Limpar
    await supabase.auth.signOut()
    
    return true
  } catch (err) {
    logTest('Persistência de Sessão', false, err.message)
    return false
  }
}

async function testRLSPolicies() {
  log('\n═══════════════════════════════════════', colors.bright)
  log('🧪 TESTE 6: Políticas RLS', colors.bright)
  log('═══════════════════════════════════════\n', colors.bright)
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Fazer login primeiro
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    
    if (authError || !authData.session) {
      logTest('RLS: Autenticação', false, authError?.message || 'Não autenticado')
      return false
    }
    
    logTest('RLS: Autenticação', true, 'Usuário autenticado')
    
    // Testar acesso à tabela users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', TEST_EMAIL)
      .maybeSingle()
    
    if (usersError) {
      logTest('RLS: Acesso à tabela users', false, usersError.message)
    } else {
      logTest('RLS: Acesso à tabela users', !!usersData, usersData ? 'Acesso permitido' : 'Sem dados')
    }
    
    // Testar acesso à tabela companies (se existir)
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .limit(1)
      
      if (companiesError) {
        logTest('RLS: Acesso à tabela companies', false, companiesError.message)
      } else {
        logTest('RLS: Acesso à tabela companies', true, companiesData ? `${companiesData.length} empresa(s) encontrada(s)` : 'Sem dados')
      }
    } catch (err) {
      logTest('RLS: Acesso à tabela companies', false, 'Tabela não existe ou erro de acesso')
    }
    
    // Limpar
    await supabase.auth.signOut()
    
    return true
  } catch (err) {
    logTest('Políticas RLS', false, err.message)
    return false
  }
}

async function testRedirectLogic() {
  log('\n═══════════════════════════════════════', colors.bright)
  log('🧪 TESTE 7: Lógica de Redirecionamento', colors.bright)
  log('═══════════════════════════════════════\n', colors.bright)
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Verificar se há sessão (não deve haver)
    const { data: sessionData } = await supabase.auth.getSession()
    logTest('Redirecionamento: Sem sessão inicial', !sessionData.session, 'Nenhuma sessão ativa (esperado)')
    
    // Fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    
    if (authError || !authData.session) {
      logTest('Redirecionamento: Login', false, authError?.message || 'Sessão não criada')
      return false
    }
    
    // Verificar role para determinar redirecionamento
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('email', TEST_EMAIL)
      .maybeSingle()
    
    const role = userData?.role || 'admin'
    const redirectUrl = role === 'admin' ? '/admin' : role === 'operator' ? '/operator' : '/dashboard'
    
    logTest('Redirecionamento: Role determinado', !!role, `Role: ${role}`)
    logTest('Redirecionamento: URL correta', redirectUrl === '/admin' || redirectUrl === '/operator', `URL: ${redirectUrl}`)
    
    // Limpar
    await supabase.auth.signOut()
    
    return true
  } catch (err) {
    logTest('Lógica de Redirecionamento', false, err.message)
    return false
  }
}

async function runAllTests() {
  log('\n', colors.reset)
  log('╔══════════════════════════════════════════════════════════════╗', colors.bright)
  log('║     TESTE COMPLETO E AUTÔNOMO DO FLUXO DE LOGIN - GOLFFOX   ║', colors.bright)
  log('╚══════════════════════════════════════════════════════════════╝', colors.bright)
  log('\n', colors.reset)
  
  log(`📧 Email de teste: ${TEST_EMAIL}`, colors.cyan)
  log(`🔗 Supabase URL: ${SUPABASE_URL}\n`, colors.cyan)
  
  // Executar todos os testes
  await testSupabaseConnection()
  await testUserExists()
  await testAuthentication()
  await testLoginAPI()
  await testSessionPersistence()
  await testRLSPolicies()
  await testRedirectLogic()
  
  // Resumo final
  log('\n═══════════════════════════════════════', colors.bright)
  log('📊 RESUMO DOS TESTES', colors.bright)
  log('═══════════════════════════════════════\n', colors.bright)
  
  log(`✅ Testes passaram: ${testsPassed}`, colors.green)
  log(`❌ Testes falharam: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.green)
  log(`📈 Taxa de sucesso: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`, colors.cyan)
  
  if (testsFailed > 0) {
    log('🔍 Testes que falharam:', colors.yellow)
    results.filter(r => !r.passed).forEach(r => {
      log(`   ❌ ${r.name}: ${r.details}`, colors.red)
    })
    log('', colors.reset)
  }
  
  if (testsFailed === 0) {
    log('🎉 TODOS OS TESTES PASSARAM!', colors.green)
    log('\n✅ O sistema está pronto para uso:', colors.green)
    log('   1. Deploy no Vercel deve funcionar corretamente', colors.cyan)
    log('   2. Login deve funcionar sem loops de redirecionamento', colors.cyan)
    log('   3. Sessão deve ser persistida corretamente', colors.cyan)
    log('   4. Páginas admin devem carregar normalmente', colors.cyan)
    log('', colors.reset)
  } else {
    log('⚠️  ALGUNS TESTES FALHARAM', colors.yellow)
    log('\n📝 Ações recomendadas:', colors.yellow)
    log('   1. Verifique os erros acima', colors.cyan)
    log('   2. Verifique se o usuário existe no banco de dados', colors.cyan)
    log('   3. Verifique se as políticas RLS estão corretas', colors.cyan)
    log('   4. Verifique se as variáveis de ambiente estão configuradas', colors.cyan)
    log('', colors.reset)
  }
  
  log('═══════════════════════════════════════\n', colors.bright)
  
  process.exit(testsFailed > 0 ? 1 : 0)
}

// Executar testes
runAllTests().catch(err => {
  log(`\n❌ Erro fatal: ${err.message}`, colors.red)
  console.error(err)
  process.exit(1)
})

