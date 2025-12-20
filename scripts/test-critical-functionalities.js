/**
 * Script para Testar Funcionalidades Críticas Após Migrations
 * 
 * Testa as principais funcionalidades do sistema após aplicar as migrations
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados')
  process.exit(1)
}

/**
 * Testar acesso a views renomeadas
 */
async function testRenamedViews() {
  console.log('\n📊 Testando Views Renomeadas...\n')
  
  const views = [
    'v_operador_dashboard_kpis_secure',
    'v_operador_routes_secure',
    'v_operador_alerts_secure',
    'v_operador_costs_secure',
    'v_operador_assigned_carriers'
  ]
  
  const results = []
  
  for (const viewName of views) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${viewName}?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      })
      
      if (response.ok) {
        console.log(`   ✅ ${viewName} - OK`)
        results.push({ view: viewName, status: 'ok' })
      } else {
        console.log(`   ❌ ${viewName} - Erro: ${response.status}`)
        results.push({ view: viewName, status: 'error', code: response.status })
      }
    } catch (error) {
      console.log(`   ❌ ${viewName} - Erro: ${error.message}`)
      results.push({ view: viewName, status: 'error', message: error.message })
    }
  }
  
  return results
}

/**
 * Testar acesso a tabelas renomeadas
 */
async function testRenamedTables() {
  console.log('\n📊 Testando Tabelas Renomeadas...\n')
  
  const tables = [
    'gf_operador_settings',
    'gf_operador_incidents',
    'gf_operador_documents',
    'gf_operador_audits',
    'gf_veiculo_documents',
    'gf_motorista_compensation',
    'gf_transportadora_documents'
  ]
  
  const results = []
  
  for (const tableName of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      })
      
      if (response.ok || response.status === 200) {
        console.log(`   ✅ ${tableName} - OK`)
        results.push({ table: tableName, status: 'ok' })
      } else if (response.status === 404) {
        console.log(`   ⚠️  ${tableName} - Não encontrada (pode não existir ainda)`)
        results.push({ table: tableName, status: 'not_found' })
      } else {
        console.log(`   ❌ ${tableName} - Erro: ${response.status}`)
        results.push({ table: tableName, status: 'error', code: response.status })
      }
    } catch (error) {
      console.log(`   ❌ ${tableName} - Erro: ${error.message}`)
      results.push({ table: tableName, status: 'error', message: error.message })
    }
  }
  
  return results
}

/**
 * Testar função RPC renomeada
 */
async function testRenamedFunction() {
  console.log('\n📊 Testando Função RPC Renomeada...\n')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/refresh_mv_operador_kpis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({})
    })
    
    if (response.ok) {
      console.log(`   ✅ refresh_mv_operador_kpis - OK`)
      return { function: 'refresh_mv_operador_kpis', status: 'ok' }
    } else {
      const error = await response.text()
      console.log(`   ⚠️  refresh_mv_operador_kpis - ${response.status}: ${error.substring(0, 100)}`)
      return { function: 'refresh_mv_operador_kpis', status: 'warning', code: response.status }
    }
  } catch (error) {
    console.log(`   ⚠️  refresh_mv_operador_kpis - Erro: ${error.message}`)
    return { function: 'refresh_mv_operador_kpis', status: 'error', message: error.message }
  }
}

/**
 * Testar APIs críticas
 */
async function testCriticalAPIs() {
  console.log('\n📊 Testando APIs Críticas...\n')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const endpoints = [
    { path: '/api/health', method: 'GET', description: 'Health Check' },
    { path: '/api/admin/kpis', method: 'GET', description: 'KPIs Admin' },
  ]
  
  const results = []
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        console.log(`   ✅ ${endpoint.description} (${endpoint.path}) - OK`)
        results.push({ endpoint: endpoint.path, status: 'ok' })
      } else {
        console.log(`   ⚠️  ${endpoint.description} (${endpoint.path}) - ${response.status}`)
        results.push({ endpoint: endpoint.path, status: 'warning', code: response.status })
      }
    } catch (error) {
      console.log(`   ⚠️  ${endpoint.description} (${endpoint.path}) - Erro: ${error.message}`)
      results.push({ endpoint: endpoint.path, status: 'error', message: error.message })
    }
  }
  
  return results
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando testes de funcionalidades críticas...\n')
  console.log('='.repeat(60))
  
  const allResults = {
    views: [],
    tables: [],
    functions: [],
    apis: []
  }
  
  // Testar views
  allResults.views = await testRenamedViews()
  
  // Testar tabelas
  allResults.tables = await testRenamedTables()
  
  // Testar função
  allResults.functions = [await testRenamedFunction()]
  
  // Testar APIs (se aplicação estiver rodando)
  if (process.env.TEST_APIS === 'true') {
    allResults.apis = await testCriticalAPIs()
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DOS TESTES')
  console.log('='.repeat(60))
  
  const viewsOk = allResults.views.filter(r => r.status === 'ok').length
  const tablesOk = allResults.tables.filter(r => r.status === 'ok').length
  const functionsOk = allResults.functions.filter(r => r.status === 'ok').length
  
  console.log(`\nViews: ${viewsOk}/${allResults.views.length} OK`)
  console.log(`Tabelas: ${tablesOk}/${allResults.tables.length} OK`)
  console.log(`Funções: ${functionsOk}/${allResults.functions.length} OK`)
  
  if (viewsOk === allResults.views.length && tablesOk >= allResults.tables.length * 0.7) {
    console.log('\n✅ Migrations aplicadas com sucesso!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Algumas verificações falharam. Verifique os logs acima.')
    process.exit(1)
  }
}

// Executar
main().catch(error => {
  console.error('❌ Erro ao executar testes:', error)
  process.exit(1)
})

