/**
 * Script para executar todos os testes de validação
 * Executa testes de middleware, API auth e RLS
 */

const { testMiddleware } = require('./test-middleware-auth')
const { testAPIAuth } = require('./test-api-auth')
const { testRLS } = require('./test-rls')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'magenta')
  log('🚀 Executando Todos os Testes de Validação', 'magenta')
  log('='.repeat(60) + '\n', 'magenta')

  const results = {
    middleware: { passed: 0, failed: 0 },
    api: { passed: 0, failed: 0 },
    rls: { passed: 0, failed: 0 }
  }

  // Teste 1: Middleware
  try {
    log('📋 Teste 1: Middleware de Autenticação\n', 'blue')
    const middlewareResult = await testMiddleware()
    results.middleware = middlewareResult
  } catch (error) {
    log(`❌ Erro ao testar middleware: ${error.message}`, 'red')
    results.middleware.failed++
  }

  // Teste 2: API Auth
  try {
    log('\n📋 Teste 2: Validação de Autenticação em APIs\n', 'blue')
    const apiResult = await testAPIAuth()
    results.api = apiResult
  } catch (error) {
    log(`❌ Erro ao testar API auth: ${error.message}`, 'red')
    results.api.failed++
  }

  // Teste 3: RLS
  try {
    log('\n📋 Teste 3: Row Level Security (RLS)\n', 'blue')
    const rlsResult = await testRLS()
    results.rls = rlsResult
  } catch (error) {
    log(`❌ Erro ao testar RLS: ${error.message}`, 'red')
    results.rls.failed++
  }

  // Resumo Final
  log('\n' + '='.repeat(60), 'magenta')
  log('📊 RESUMO FINAL DOS TESTES', 'magenta')
  log('='.repeat(60), 'magenta')

  const totalPassed = results.middleware.passed + results.api.passed + results.rls.passed
  const totalFailed = results.middleware.failed + results.api.failed + results.rls.failed
  const total = totalPassed + totalFailed

  log(`\n🔐 Middleware:     ${results.middleware.passed}✅ / ${results.middleware.failed}❌`, 
      results.middleware.failed > 0 ? 'yellow' : 'green')
  log(`🔒 API Auth:       ${results.api.passed}✅ / ${results.api.failed}❌`, 
      results.api.failed > 0 ? 'yellow' : 'green')
  log(`🛡️  RLS:            ${results.rls.passed}✅ / ${results.rls.failed}❌`, 
      results.rls.failed > 0 ? 'yellow' : 'green')
  
  log('\n' + '-'.repeat(60), 'blue')
  log(`📈 TOTAL:          ${totalPassed}✅ / ${totalFailed}❌`, 
      totalFailed > 0 ? 'red' : 'green')
  log(`📊 Taxa de Sucesso: ${((totalPassed / total) * 100).toFixed(1)}%`, 
      totalFailed > 0 ? 'yellow' : 'green')
  log('='.repeat(60) + '\n', 'magenta')

  if (totalFailed === 0) {
    log('🎉 Todos os testes passaram! Sistema pronto para produção.', 'green')
  } else {
    log('⚠️  Alguns testes falharam. Revise os erros acima.', 'yellow')
  }

  return { totalPassed, totalFailed, results }
}

// Executar
if (require.main === module) {
  runAllTests()
    .then(({ totalFailed }) => {
      process.exit(totalFailed > 0 ? 1 : 0)
    })
    .catch((error) => {
      log(`\n❌ Erro fatal: ${error.message}`, 'red')
      process.exit(1)
    })
}

module.exports = { runAllTests }

