/**
 * Script de Teste Completo - Sistema de Empresas e Operadores
 * Testa todas as funcionalidades de forma autônoma
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

if (!url || !serviceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('   Verifique se NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas em .env.local')
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
    operator: null
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
  console.log('⏳ Aguardando servidor estar pronto...')
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${API_BASE}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })
      if (response.ok) {
        console.log('✅ Servidor está pronto\n')
        return true
      }
    } catch (error) {
      // Servidor não está pronto ainda
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  console.log('⚠️ Servidor não respondeu, mas continuando testes...\n')
  return false
}

// TESTE 1: Criar empresa SEM operador (apenas nome)
async function testCreateCompanyWithoutOperator() {
  console.log('\n📝 TESTE 1: Criar Empresa SEM Operador')
  try {
    const companyName = `Empresa Teste ${Date.now()}`
    const testCompany = {
      companyName: companyName,
      cnpj: `12345678000${Date.now() % 10000}`,
      address: 'Rua Teste, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      companyPhone: '11999999999',
      companyEmail: `test${Date.now()}@test.com`
      // NÃO enviar operatorEmail, operatorName, operatorPassword
    }

    const response = await fetch(`${API_BASE}/api/admin/create-operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCompany)
    })

    const result = await response.json()
    
    if (response.ok && result.success && result.companyId) {
      testResults.createdIds.company = result.companyId
      logTest('Criação de Empresa SEM Operador', true, null, { 
        id: result.companyId, 
        name: result.company?.name || companyName 
      })
      return true
    } else {
      logTest('Criação de Empresa SEM Operador', false, result.error || result.message, { 
        status: response.status, 
        result 
      })
      return false
    }
  } catch (error) {
    logTest('Criação de Empresa SEM Operador', false, error)
    return false
  }
}

// TESTE 2: Listar empresas
async function testListCompanies() {
  console.log('\n📋 TESTE 2: Listar Empresas')
  try {
    const response = await fetch(`${API_BASE}/api/admin/companies-list`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const result = await response.json()
    
    if (response.ok && result.success && Array.isArray(result.companies)) {
      logTest('Listagem de Empresas', true, null, { 
        count: result.companies.length 
      })
      return true
    } else {
      logTest('Listagem de Empresas', false, result.error || 'Formato inválido', { 
        status: response.status, 
        result 
      })
      return false
    }
  } catch (error) {
    logTest('Listagem de Empresas', false, error)
    return false
  }
}

// TESTE 3: Criar operador para empresa existente
async function testCreateOperatorForCompany() {
  console.log('\n👤 TESTE 3: Criar Operador para Empresa Existente')
  
  if (!testResults.createdIds.company) {
    logTest('Criação de Operador', false, 'Empresa não foi criada anteriormente')
    return false
  }

  try {
    const operatorEmail = `operador${Date.now()}@test.com`
    const testOperator = {
      company_id: testResults.createdIds.company,
      email: operatorEmail,
      password: 'Teste123456',
      name: 'Operador Teste',
      phone: '11988888888'
    }

    const response = await fetch(`${API_BASE}/api/admin/create-operator-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOperator)
    })

    const result = await response.json()
    
    // Verificar diferentes formatos de resposta
    const operatorId = result.userId || result.operatorId || result.user?.id
    
    if (response.ok && result.success && operatorId) {
      testResults.createdIds.operator = operatorId
      logTest('Criação de Operador', true, null, { 
        id: operatorId, 
        email: operatorEmail 
      })
      return true
    } else {
      logTest('Criação de Operador', false, result.error || result.message || 'Formato de resposta inválido', { 
        status: response.status, 
        result 
      })
      return false
    }
  } catch (error) {
    logTest('Criação de Operador', false, error)
    return false
  }
}

// TESTE 4: Listar operadores de uma empresa
async function testListOperators() {
  console.log('\n👥 TESTE 4: Listar Operadores da Empresa')
  
  if (!testResults.createdIds.company) {
    logTest('Listagem de Operadores', false, 'Empresa não foi criada anteriormente')
    return false
  }

  try {
    const response = await fetch(`${API_BASE}/api/admin/users-list?company_id=${testResults.createdIds.company}&role=operator`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const result = await response.json()
    
    if (response.ok && result.success && Array.isArray(result.users)) {
      logTest('Listagem de Operadores', true, null, { 
        count: result.users.length 
      })
      return true
    } else {
      logTest('Listagem de Operadores', false, result.error || 'Formato inválido', { 
        status: response.status, 
        result 
      })
      return false
    }
  } catch (error) {
    logTest('Listagem de Operadores', false, error)
    return false
  }
}

// TESTE 5: Editar empresa
async function testEditCompany() {
  console.log('\n✏️ TESTE 5: Editar Empresa')
  
  if (!testResults.createdIds.company) {
    logTest('Edição de Empresa', false, 'Empresa não foi criada anteriormente')
    return false
  }

  try {
    const updatedName = `Empresa Editada ${Date.now()}`
    const response = await fetch(`${API_BASE}/api/admin/companies/${testResults.createdIds.company}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: updatedName,
        address: 'Rua Editada, 456',
        city: 'Rio de Janeiro',
        state: 'RJ'
      })
    })

    const result = await response.json()
    
    if (response.ok && (result.success || result.name === updatedName)) {
      logTest('Edição de Empresa', true, null, { 
        id: testResults.createdIds.company, 
        newName: updatedName 
      })
      return true
    } else {
      logTest('Edição de Empresa', false, result.error || result.message, { 
        status: response.status, 
        result 
      })
      return false
    }
  } catch (error) {
    logTest('Edição de Empresa', false, error)
    return false
  }
}

// TESTE 6: Verificar conexão com Supabase
async function testSupabaseConnection() {
  console.log('\n🔌 TESTE 6: Conexão com Supabase')
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
    
    if (error) throw error
    logTest('Conexão com Supabase', true)
    return true
  } catch (error) {
    logTest('Conexão com Supabase', false, error)
    return false
  }
}

// TESTE 7: Verificar estrutura da resposta da API de listagem
async function testCompaniesListFormat() {
  console.log('\n📊 TESTE 7: Formato da Resposta da API de Listagem')
  try {
    const response = await fetch(`${API_BASE}/api/admin/companies-list`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const result = await response.json()
    
    // Verificar se tem success e companies
    const hasSuccess = typeof result.success === 'boolean'
    const hasCompanies = Array.isArray(result.companies)
    
    if (hasSuccess && hasCompanies) {
      logTest('Formato da Resposta', true, null, { 
        hasSuccess, 
        hasCompanies, 
        count: result.companies.length 
      })
      return true
    } else {
      logTest('Formato da Resposta', false, 'Formato inválido', { 
        result,
        hasSuccess,
        hasCompanies
      })
      return false
    }
  } catch (error) {
    logTest('Formato da Resposta', false, error)
    return false
  }
}

// Limpeza: Excluir dados de teste
async function cleanup() {
  console.log('\n🧹 Limpando dados de teste...')
  
  // Excluir operador se foi criado
  if (testResults.createdIds.operator) {
    try {
      await fetch(`${API_BASE}/api/admin/users/delete?id=${testResults.createdIds.operator}`, {
        method: 'DELETE'
      })
      console.log('✅ Operador de teste excluído')
    } catch (error) {
      console.warn('⚠️ Erro ao excluir operador:', error.message)
    }
  }
  
  // Excluir empresa se foi criada
  if (testResults.createdIds.company) {
    try {
      await fetch(`${API_BASE}/api/admin/companies/delete?id=${testResults.createdIds.company}`, {
        method: 'DELETE'
      })
      console.log('✅ Empresa de teste excluída')
    } catch (error) {
      console.warn('⚠️ Erro ao excluir empresa:', error.message)
    }
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando Testes Autônomos do Sistema de Empresas e Operadores\n')
  console.log('='.repeat(60))
  
  // Verificar servidor
  await waitForServer()
  
  // Executar testes
  await testSupabaseConnection()
  await testCompaniesListFormat()
  await testCreateCompanyWithoutOperator()
  await testListCompanies()
  await testCreateOperatorForCompany()
  await testListOperators()
  await testEditCompany()
  
  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 RESUMO DOS TESTES\n')
  console.log(`✅ Testes Passados: ${testResults.passed}`)
  console.log(`❌ Testes Falhados: ${testResults.failed}`)
  console.log(`📈 Taxa de Sucesso: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:\n')
    testResults.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.test}:`)
      console.log(`   ${err.error}`)
      if (err.data) {
        console.log(`   Dados: ${JSON.stringify(err.data, null, 2)}`)
      }
    })
  }
  
  // Limpeza
  const shouldCleanup = process.argv.includes('--cleanup') || process.argv.includes('-c')
  if (shouldCleanup) {
    await cleanup()
  } else {
    console.log('\n💡 Dica: Execute com --cleanup para limpar dados de teste automaticamente')
    console.log(`   Empresa criada: ${testResults.createdIds.company || 'N/A'}`)
    console.log(`   Operador criado: ${testResults.createdIds.operator || 'N/A'}`)
  }
  
  console.log('\n' + '='.repeat(60))
  
  // Exit code baseado nos resultados
  process.exit(testResults.failed > 0 ? 1 : 0)
}

// Executar
runAllTests().catch(error => {
  console.error('\n💥 Erro fatal ao executar testes:', error)
  process.exit(1)
})
