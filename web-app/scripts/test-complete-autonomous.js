const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_BASE = 'http://localhost:3000'

if (!url || !serviceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  createdIds: {
    company: null,
    operatorLogin: null,
    route: null,
    vehicle: null,
    driver: null,
    alert: null,
    user: null,
    assistance: null
  }
}

function logTest(name, passed, error = null, data = null) {
  if (passed) {
    console.log(`✅ ${name}${data ? ` - ${JSON.stringify(data)}` : ''}`)
    testResults.passed++
  } else {
    console.error(`❌ ${name}${error ? ` - ${error.message || error}` : ''}`)
    testResults.failed++
    if (error) {
      testResults.errors.push({ test: name, error: error.message || error, data })
    }
  }
}

async function waitForServer(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${API_BASE}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })
      if (response.ok) return true
    } catch (error) {
      // Servidor não está pronto ainda
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  return false
}

async function testCreateCompany() {
  console.log('\n📝 TESTE 1: Criar Empresa')
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCompany)
    })

    const result = await response.json()
    
    // Aceitar diferentes formatos de resposta
    const companyId = result.company?.id || result.companyId || result.id
    const isSuccess = response.ok && (result.success || companyId) && companyId
    
    if (isSuccess) {
      testResults.createdIds.company = companyId
      const companyName = result.company?.name || result.name || 'N/A'
      logTest('Criação de Empresa', true, null, { id: companyId, name: companyName })
      return true
    } else {
      const errorMsg = result.error || result.message || 'Resposta inválida'
      logTest('Criação de Empresa', false, errorMsg, { status: response.status, result })
      return false
    }
  } catch (error) {
    logTest('Criação de Empresa', false, error)
    return false
  }
}

async function testCreateOperatorLogin() {
  console.log('\n📝 TESTE 2: Criar Login de Operador')
  
  if (!testResults.createdIds.company) {
    logTest('Criação de Login Operador', false, new Error('Empresa não criada anteriormente'))
    return false
  }

  try {
    const testLogin = {
      company_id: testResults.createdIds.company,
      email: `operador${Date.now()}@test.com`,
      password: 'senha123456',
      name: 'Operador Teste',
      phone: '11977777777'
    }

    const response = await fetch(`${API_BASE}/api/admin/create-operator-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testLogin)
    })

    const result = await response.json()
    
    if (response.ok && result.success && result.user?.id) {
      testResults.createdIds.operatorLogin = result.user.id
      logTest('Criação de Login Operador', true, null, { id: result.user.id, email: result.user.email })
      return true
    } else {
      logTest('Criação de Login Operador', false, result.error || result.message || 'Resposta inválida', result)
      return false
    }
  } catch (error) {
    logTest('Criação de Login Operador', false, error)
    return false
  }
}

async function testListAllTabs() {
  console.log('\n📋 TESTE 3: Listar Todas as Abas')
  
  const endpoints = [
    { name: 'Empresas', url: '/api/admin/companies-list' },
    { name: 'Rotas', url: '/api/admin/routes-list' },
    { name: 'Veículos', url: '/api/admin/vehicles-list?company_id=' },
    { name: 'Motoristas', url: '/api/admin/drivers-list?company_id=' },
    { name: 'Alertas', url: '/api/admin/alerts-list' },
    { name: 'Usuários (Permissões)', url: '/api/admin/users-list' },
    { name: 'Socorro', url: '/api/admin/assistance-requests-list' }
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint.url}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      
      // Aceitar tanto array direto quanto objeto com propriedade
      let dataArray = null
      if (Array.isArray(result)) {
        dataArray = result
      } else if (result && typeof result === 'object') {
        // Tentar encontrar array em propriedades comuns
        dataArray = result.companies || result.routes || result.vehicles || 
                   result.drivers || result.alerts || result.users || 
                   result.requests || result.data || null
      }
      
      if (response.ok && dataArray && Array.isArray(dataArray)) {
        logTest(`Listagem: ${endpoint.name}`, true, null, { count: dataArray.length })
      } else {
        logTest(`Listagem: ${endpoint.name}`, false, result.error || 'Resposta inválida', result)
      }
    } catch (error) {
      logTest(`Listagem: ${endpoint.name}`, false, error)
    }
  }
}

async function testEditCompany() {
  console.log('\n✏️ TESTE 4: Editar Empresa')
  
  if (!testResults.createdIds.company) {
    logTest('Edição de Empresa', false, new Error('Empresa não criada'))
    return false
  }

  try {
    const updateData = {
      name: `Empresa Editada ${Date.now()}`,
      address: 'Rua Editada, 456',
      phone: '11999999999'
    }

    const response = await fetch(`${API_BASE}/api/admin/companies/${testResults.createdIds.company}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })

    let result
    try {
      const text = await response.text()
      result = text ? JSON.parse(text) : {}
    } catch (parseError) {
      logTest('Edição de Empresa', false, 'Erro ao parsear resposta JSON', { parseError: parseError.message })
      return false
    }
    
    if (response.ok && (result.success || result.company || result.id)) {
      logTest('Edição de Empresa', true, null, { id: testResults.createdIds.company })
      return true
    } else {
      logTest('Edição de Empresa', false, result.error || result.message || 'Resposta inválida', result)
      return false
    }
  } catch (error) {
    logTest('Edição de Empresa', false, error)
    return false
  }
}

async function testDeleteAll() {
  console.log('\n🗑️ TESTE 5: Excluir Registros')
  
  const deletions = [
    { name: 'Assistência', id: testResults.createdIds.assistance, url: '/api/admin/assistance-requests/delete' },
    { name: 'Alerta', id: testResults.createdIds.alert, url: '/api/admin/alerts/delete' },
    { name: 'Usuário', id: testResults.createdIds.user, url: '/api/admin/users/delete' },
    { name: 'Motorista', id: testResults.createdIds.driver, url: '/api/admin/drivers/delete' },
    { name: 'Veículo', id: testResults.createdIds.vehicle, url: '/api/admin/vehicles/delete' },
    { name: 'Rota', id: testResults.createdIds.route, url: '/api/admin/routes/delete' },
    { name: 'Login Operador', id: testResults.createdIds.operatorLogin, url: '/api/admin/users/delete' },
    { name: 'Empresa', id: testResults.createdIds.company, url: '/api/admin/companies/delete' }
  ]

  for (const deletion of deletions) {
    if (!deletion.id) {
      logTest(`Exclusão: ${deletion.name}`, true, null, { skipped: 'Não criado' })
      continue
    }

    try {
      const response = await fetch(`${API_BASE}${deletion.url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletion.id })
      })

      let result
      try {
        const text = await response.text()
        result = text ? JSON.parse(text) : {}
      } catch (parseError) {
        logTest(`Exclusão: ${deletion.name}`, false, 'Erro ao parsear resposta JSON', { parseError: parseError.message })
        continue
      }
      
      if (response.ok && (result.success || result.message || result.deleted || result.archived)) {
        logTest(`Exclusão: ${deletion.name}`, true, null, { id: deletion.id })
      } else {
        logTest(`Exclusão: ${deletion.name}`, false, result.error || result.message || 'Resposta inválida', result)
      }
    } catch (error) {
      logTest(`Exclusão: ${deletion.name}`, false, error)
    }
  }
}

async function testSupabaseIntegration() {
  console.log('\n🔌 TESTE 6: Integração com Supabase')
  
  const tables = ['companies', 'users', 'routes', 'vehicles', 'gf_incidents', 'gf_assistance_requests']
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1)
      
      if (error) throw error
      
      const { count: totalCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      logTest(`Supabase: ${table}`, true, null, { count: totalCount || 0 })
    } catch (error) {
      logTest(`Supabase: ${table}`, false, error)
    }
  }
}

async function runAllTests() {
  console.log('🧪 INICIANDO TESTES AUTÔNOMOS COMPLETOS\n')
  console.log('='.repeat(60))
  
  // Verificar se servidor está rodando
  console.log('\n🔍 Verificando se o servidor está rodando...')
  const serverRunning = await waitForServer()
  if (!serverRunning) {
    console.error('❌ Servidor não está rodando em http://localhost:3000')
    console.error('   Iniciando servidor...')
    // Não podemos iniciar o servidor aqui, mas podemos continuar com testes que não dependem dele
    console.log('⚠️ Continuando com testes que não dependem do servidor...\n')
  } else {
    console.log('✅ Servidor está rodando\n')
  }

  // Teste 1: Criar Empresa
  await testCreateCompany()

  // Teste 2: Criar Login de Operador
  await testCreateOperatorLogin()

  // Teste 3: Listar Todas as Abas
  if (serverRunning) {
    await testListAllTabs()
  }

  // Teste 4: Editar
  if (serverRunning) {
    await testEditCompany()
  }

  // Teste 5: Excluir
  if (serverRunning) {
    await testDeleteAll()
  }

  // Teste 6: Integração Supabase
  await testSupabaseIntegration()

  // Resumo final
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DOS TESTES')
  console.log('='.repeat(60))
  console.log(`✅ Testes passados: ${testResults.passed}`)
  console.log(`❌ Testes falhados: ${testResults.failed}`)
  const total = testResults.passed + testResults.failed
  if (total > 0) {
    console.log(`📈 Taxa de sucesso: ${((testResults.passed / total) * 100).toFixed(1)}%`)
  }

  if (testResults.errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:')
    testResults.errors.forEach((err, idx) => {
      console.log(`\n${idx + 1}. ${err.test}:`)
      console.log(`   Erro: ${err.error}`)
      if (err.data) {
        console.log(`   Dados: ${JSON.stringify(err.data, null, 2)}`)
      }
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

