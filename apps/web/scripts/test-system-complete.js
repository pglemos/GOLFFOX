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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Função para verificar se o servidor está rodando
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    return response.ok
  } catch (error) {
    return false
  }
}

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
}

function logTest(name, passed, error = null) {
  if (passed) {
    console.log(`✅ ${name}`)
    testResults.passed++
  } else {
    console.error(`❌ ${name}`)
    testResults.failed++
    if (error) {
      testResults.errors.push({ test: name, error: error.message || error })
    }
  }
}

async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('companies').select('count').limit(1)
    if (error) throw error
    logTest('Conexão com Supabase', true)
    return true
  } catch (error) {
    logTest('Conexão com Supabase', false, error)
    return false
  }
}

async function testCreateCompany() {
  try {
    const testCompany = {
      company_name: `Test Company ${Date.now()}`,
      cnpj: `12345678000${Date.now() % 10000}`,
      address: 'Rua Teste, 123',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      company_phone: '11999999999',
      company_email: `test${Date.now()}@test.com`,
      responsible_name: 'Responsável Teste',
      responsible_email: `resp${Date.now()}@test.com`,
      responsible_phone: '11988888888'
    }

    const response = await fetch(`${API_BASE}/api/admin/create-operator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCompany)
    })

    const result = await response.json()
    
    if (response.ok && result.success) {
      logTest('Criação de Empresa', true)
      return result.company?.id
    } else {
      logTest('Criação de Empresa', false, result.error || result.message)
      return null
    }
  } catch (error) {
    logTest('Criação de Empresa', false, error)
    return null
  }
}

async function testCreateOperatorLogin(companyId) {
  if (!companyId) {
    logTest('Criação de Login Operador', false, new Error('companyId não fornecido'))
    return null
  }

  try {
    const testLogin = {
      company_id: companyId,
      email: `operador${Date.now()}@test.com`,
      password: 'senha123456',
      name: 'Operador Teste',
      phone: '11977777777'
    }

    const response = await fetch(`${API_BASE}/api/admin/create-operator-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testLogin)
    })

    const result = await response.json()
    
    if (response.ok && result.success) {
      logTest('Criação de Login Operador', true)
      return result.user?.id
    } else {
      logTest('Criação de Login Operador', false, result.error || result.message)
      return null
    }
  } catch (error) {
    logTest('Criação de Login Operador', false, error)
    return null
  }
}

async function testListCompanies() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/companies-list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()
    
    if (response.ok && Array.isArray(result)) {
      logTest('Listagem de Empresas', true)
      return result.length > 0
    } else {
      logTest('Listagem de Empresas', false, result.error || 'Resposta inválida')
      return false
    }
  } catch (error) {
    logTest('Listagem de Empresas', false, error)
    return false
  }
}

async function testListRoutes() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/routes-list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()
    
    if (response.ok && Array.isArray(result)) {
      logTest('Listagem de Rotas', true)
      return true
    } else {
      logTest('Listagem de Rotas', false, result.error || 'Resposta inválida')
      return false
    }
  } catch (error) {
    logTest('Listagem de Rotas', false, error)
    return false
  }
}

async function testListVehicles() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/vehicles-list?company_id=`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()
    
    if (response.ok && Array.isArray(result)) {
      logTest('Listagem de Veículos', true)
      return true
    } else {
      logTest('Listagem de Veículos', false, result.error || 'Resposta inválida')
      return false
    }
  } catch (error) {
    logTest('Listagem de Veículos', false, error)
    return false
  }
}

async function testListDrivers() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/drivers-list?company_id=`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()
    
    if (response.ok && Array.isArray(result)) {
      logTest('Listagem de Motoristas', true)
      return true
    } else {
      logTest('Listagem de Motoristas', false, result.error || 'Resposta inválida')
      return false
    }
  } catch (error) {
    logTest('Listagem de Motoristas', false, error)
    return false
  }
}

async function testListAlerts() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/alerts-list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()
    
    if (response.ok && Array.isArray(result)) {
      logTest('Listagem de Alertas', true)
      return true
    } else {
      logTest('Listagem de Alertas', false, result.error || 'Resposta inválida')
      return false
    }
  } catch (error) {
    logTest('Listagem de Alertas', false, error)
    return false
  }
}

async function testListUsers() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/users-list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()
    
    if (response.ok && Array.isArray(result)) {
      logTest('Listagem de Usuários (Permissões)', true)
      return true
    } else {
      logTest('Listagem de Usuários (Permissões)', false, result.error || 'Resposta inválida')
      return false
    }
  } catch (error) {
    logTest('Listagem de Usuários (Permissões)', false, error)
    return false
  }
}

async function testListAssistanceRequests() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/assistance-requests-list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()
    
    if (response.ok && Array.isArray(result)) {
      logTest('Listagem de Solicitações de Socorro', true)
      return true
    } else {
      logTest('Listagem de Solicitações de Socorro', false, result.error || 'Resposta inválida')
      return false
    }
  } catch (error) {
    logTest('Listagem de Solicitações de Socorro', false, error)
    return false
  }
}

async function testSupabaseTables() {
  const tables = [
    { name: 'companies', exists: true },
    { name: 'users', exists: true },
    { name: 'routes', exists: true },
    { name: 'vehicles', exists: true },
    { name: 'gf_incidents', exists: true }, // alerts estão em gf_incidents
    { name: 'gf_assistance_requests', exists: true }
  ]
  let allPassed = true

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table.name).select('count').limit(1)
      if (error) throw error
      logTest(`Tabela Supabase: ${table.name}`, true)
    } catch (error) {
      logTest(`Tabela Supabase: ${table.name}`, false, error)
      allPassed = false
    }
  }

  return allPassed
}

async function runAllTests() {
  console.log('🧪 Iniciando testes completos do sistema...\n')

  // Verificar se o servidor está rodando
  console.log('🔍 Verificando se o servidor está rodando...')
  const serverRunning = await checkServer()
  if (!serverRunning) {
    console.error('❌ Servidor não está rodando em http://localhost:3000')
    console.error('   Por favor, inicie o servidor com: npm run dev')
    process.exit(1)
  }
  console.log('✅ Servidor está rodando\n')

  // Teste 1: Conexão com Supabase
  const supabaseOk = await testSupabaseConnection()
  if (!supabaseOk) {
    console.error('\n❌ Falha na conexão com Supabase. Abortando testes.')
    process.exit(1)
  }

  // Teste 2: Tabelas do Supabase
  await testSupabaseTables()

  // Teste 3: Criação de Empresa
  const companyId = await testCreateCompany()

  // Teste 4: Criação de Login Operador
  if (companyId) {
    await testCreateOperatorLogin(companyId)
  }

  // Teste 5: Listagens de todas as abas
  console.log('\n📋 Testando listagens de todas as abas...')
  await testListCompanies()
  await testListRoutes()
  await testListVehicles()
  await testListDrivers()
  await testListAlerts()
  await testListUsers()
  await testListAssistanceRequests()

  // Resumo final
  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMO DOS TESTES')
  console.log('='.repeat(50))
  console.log(`✅ Testes passados: ${testResults.passed}`)
  console.log(`❌ Testes falhados: ${testResults.failed}`)
  console.log(`📈 Taxa de sucesso: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)

  if (testResults.errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:')
    testResults.errors.forEach((err, idx) => {
      console.log(`\n${idx + 1}. ${err.test}:`)
      console.log(`   ${err.error}`)
    })
  }

  if (testResults.failed > 0) {
    console.log('\n⚠️ Alguns testes falharam. Verifique os erros acima.')
    process.exit(1)
  } else {
    console.log('\n✅ Todos os testes passaram!')
    process.exit(0)
  }
}

runAllTests()

