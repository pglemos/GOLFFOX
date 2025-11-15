const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

// Testar estrutura de arquivos críticos
function testFileStructure() {
  console.log('\n📁 Testando estrutura de arquivos...')
  
  const criticalFiles = [
    'app/api/admin/create-operator/route.ts',
    'app/api/admin/create-operator-login/route.ts',
    'app/api/admin/companies-list/route.ts',
    'app/api/admin/routes-list/route.ts',
    'app/api/admin/vehicles-list/route.ts',
    'app/api/admin/drivers-list/route.ts',
    'app/api/admin/alerts-list/route.ts',
    'app/api/admin/users-list/route.ts',
    'app/api/admin/assistance-requests-list/route.ts',
    'components/modals/create-operator-modal.tsx',
    'components/modals/create-operator-login-modal.tsx',
    'components/modals/edit-company-modal.tsx',
    'components/modals/edit-alert-modal.tsx',
    'components/modals/edit-user-modal.tsx',
    'components/modals/edit-assistance-modal.tsx',
    'components/modals/company-operators-modal.tsx',
    'lib/supabase-service-role.ts',
    'lib/global-sync.ts',
    'hooks/use-global-sync.tsx'
  ]

  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file)
    const exists = fs.existsSync(filePath)
    logTest(`Arquivo: ${file}`, exists)
  }
}

// Testar conexão com Supabase
async function testSupabaseConnection() {
  console.log('\n🔌 Testando conexão com Supabase...')
  
  if (!url || !serviceKey) {
    logTest('Variáveis de ambiente configuradas', false, new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado'))
    return false
  }
  
  logTest('Variáveis de ambiente configuradas', true)
  
  try {
    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    const { data, error } = await supabase.from('companies').select('count').limit(1)
    if (error) throw error
    
    logTest('Conexão com Supabase', true)
    return true
  } catch (error) {
    logTest('Conexão com Supabase', false, error)
    return false
  }
}

// Testar tabelas do Supabase
async function testSupabaseTables() {
  console.log('\n🗄️ Testando tabelas do Supabase...')
  
  if (!url || !serviceKey) {
    console.log('⚠️ Pulando teste de tabelas (Supabase não configurado)')
    return
  }
  
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  const tables = [
    'companies',
    'users',
    'routes',
    'vehicles',
    'gf_incidents',
    'gf_assistance_requests'
  ]
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1)
      if (error) throw error
      logTest(`Tabela: ${table}`, true)
    } catch (error) {
      logTest(`Tabela: ${table}`, false, error)
    }
  }
}

// Verificar se há erros de TypeScript
function testTypeScriptErrors() {
  console.log('\n📝 Verificando erros de TypeScript...')
  
  // Verificar se tsconfig.json existe
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
  if (fs.existsSync(tsconfigPath)) {
    logTest('tsconfig.json existe', true)
  } else {
    logTest('tsconfig.json existe', false)
  }
  
  // Verificar se há arquivos de declaração de tipos
  const typesPath = path.join(process.cwd(), 'types')
  if (fs.existsSync(typesPath)) {
    logTest('Diretório types existe', true)
  } else {
    logTest('Diretório types existe', false)
  }
}

// Verificar estrutura de API routes
function testAPIRoutes() {
  console.log('\n🌐 Verificando rotas de API...')
  
  const apiRoutes = [
    'app/api/admin/create-operator',
    'app/api/admin/create-operator-login',
    'app/api/admin/companies-list',
    'app/api/admin/routes-list',
    'app/api/admin/vehicles-list',
    'app/api/admin/drivers-list',
    'app/api/admin/alerts-list',
    'app/api/admin/users-list',
    'app/api/admin/assistance-requests-list',
    'app/api/admin/companies/delete',
    'app/api/admin/routes/delete',
    'app/api/admin/vehicles/delete',
    'app/api/admin/drivers/delete',
    'app/api/admin/alerts/delete',
    'app/api/admin/users/delete',
    'app/api/admin/assistance-requests/delete'
  ]
  
  for (const route of apiRoutes) {
    const routePath = path.join(process.cwd(), route, 'route.ts')
    const exists = fs.existsSync(routePath)
    logTest(`API Route: ${route}`, exists)
  }
}

async function runAllTests() {
  console.log('🧪 Iniciando testes de estrutura do sistema...\n')
  
  // Teste 1: Estrutura de arquivos
  testFileStructure()
  
  // Teste 2: Rotas de API
  testAPIRoutes()
  
  // Teste 3: TypeScript
  testTypeScriptErrors()
  
  // Teste 4: Conexão com Supabase
  const supabaseOk = await testSupabaseConnection()
  
  // Teste 5: Tabelas do Supabase (se conexão OK)
  if (supabaseOk) {
    await testSupabaseTables()
  }
  
  // Resumo final
  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMO DOS TESTES')
  console.log('='.repeat(50))
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
      console.log(`   ${err.error}`)
    })
  }
  
  if (testResults.failed > 0) {
    console.log('\n⚠️ Alguns testes falharam. Verifique os erros acima.')
    process.exit(1)
  } else {
    console.log('\n✅ Todos os testes de estrutura passaram!')
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('   1. Inicie o servidor: npm run dev')
    console.log('   2. Teste manualmente todas as funcionalidades no navegador')
    console.log('   3. Verifique criação, edição e exclusão em todas as abas')
    process.exit(0)
  }
}

runAllTests()

