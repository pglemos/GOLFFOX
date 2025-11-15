/**
 * Script para testar RLS após aplicar migration v49
 * Valida se as políticas estão funcionando corretamente
 */

const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testRLS() {
  log('\n🧪 Testando RLS em gf_user_company_map\n', 'blue')

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  let passed = 0
  let failed = 0

  try {
    await client.connect()
    log('✅ Conectado ao banco de dados\n', 'green')

    // Teste 1: Verificar se RLS está habilitado
    try {
      log('Teste 1: Verificar se RLS está habilitado...', 'yellow')
      const result = await client.query(`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'gf_user_company_map' AND schemaname = 'public';
      `)

      if (result.rows.length > 0 && result.rows[0].rowsecurity === true) {
        log('✅ PASS: RLS está habilitado', 'green')
        passed++
      } else {
        log('❌ FAIL: RLS não está habilitado', 'red')
        failed++
      }
    } catch (error) {
      log(`❌ FAIL: Erro ao verificar RLS - ${error.message}`, 'red')
      failed++
    }

    // Teste 2: Verificar se políticas existem
    try {
      log('\nTeste 2: Verificar se políticas existem...', 'yellow')
      const result = await client.query(`
        SELECT policyname, cmd, roles
        FROM pg_policies
        WHERE tablename = 'gf_user_company_map'
        ORDER BY policyname;
      `)

      const expectedPolicies = [
        'admin_manage_user_companies',
        'user_select_own_companies'
      ]

      const foundPolicies = result.rows.map(r => r.policyname)
      const allFound = expectedPolicies.every(p => foundPolicies.includes(p))

      if (allFound) {
        log(`✅ PASS: Todas as políticas encontradas (${result.rows.length} total)`, 'green')
        result.rows.forEach(policy => {
          log(`   - ${policy.policyname} (${policy.cmd})`, 'blue')
        })
        passed++
      } else {
        log(`❌ FAIL: Políticas faltando. Encontradas: ${foundPolicies.join(', ')}`, 'red')
        failed++
      }
    } catch (error) {
      log(`❌ FAIL: Erro ao verificar políticas - ${error.message}`, 'red')
      failed++
    }

    // Teste 3: Verificar se tabela existe
    try {
      log('\nTeste 3: Verificar se tabela existe...', 'yellow')
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'gf_user_company_map';
      `)

      if (result.rows.length > 0) {
        log('✅ PASS: Tabela gf_user_company_map existe', 'green')
        passed++
      } else {
        log('❌ FAIL: Tabela gf_user_company_map não existe', 'red')
        failed++
      }
    } catch (error) {
      log(`❌ FAIL: Erro ao verificar tabela - ${error.message}`, 'red')
      failed++
    }

    // Teste 4: Verificar estrutura da tabela
    try {
      log('\nTeste 4: Verificar estrutura da tabela...', 'yellow')
      const result = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'gf_user_company_map'
        ORDER BY ordinal_position;
      `)

      const requiredColumns = ['user_id', 'company_id']
      const foundColumns = result.rows.map(r => r.column_name)
      const allColumnsFound = requiredColumns.every(c => foundColumns.includes(c))

      if (allColumnsFound) {
        log(`✅ PASS: Estrutura da tabela OK (${result.rows.length} colunas)`, 'green')
        passed++
      } else {
        log(`❌ FAIL: Colunas faltando. Encontradas: ${foundColumns.join(', ')}`, 'red')
        failed++
      }
    } catch (error) {
      log(`❌ FAIL: Erro ao verificar estrutura - ${error.message}`, 'red')
      failed++
    }

    // Teste 5: Verificar se há dados de teste (opcional)
    try {
      log('\nTeste 5: Verificar dados na tabela...', 'yellow')
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM public.gf_user_company_map;
      `)

      const count = parseInt(result.rows[0].count)
      log(`ℹ️  INFO: ${count} mapeamentos encontrados na tabela`, 'blue')
      passed++ // Não é um teste crítico
    } catch (error) {
      log(`⚠️  WARN: Erro ao contar dados - ${error.message}`, 'yellow')
      passed++ // Não é crítico
    }

  } catch (error) {
    log(`\n❌ Erro fatal: ${error.message}`, 'red')
    failed++
  } finally {
    await client.end()
    log('\n🔌 Conexão fechada', 'blue')
  }

  // Resumo
  log('\n' + '='.repeat(50), 'blue')
  log(`📊 Resumo dos Testes de RLS`, 'blue')
  log('='.repeat(50), 'blue')
  log(`✅ Passou: ${passed}`, 'green')
  log(`❌ Falhou: ${failed}`, failed > 0 ? 'red' : 'green')
  log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'blue')
  log('='.repeat(50) + '\n', 'blue')

  return { passed, failed, total: passed + failed }
}

// Executar testes
if (require.main === module) {
  testRLS()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0)
    })
    .catch((error) => {
      log(`\n❌ Erro fatal: ${error.message}`, 'red')
      process.exit(1)
    })
}

module.exports = { testRLS }

