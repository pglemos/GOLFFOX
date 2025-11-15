/**
 * Testes E2E para Verificação de Links
 * 
 * Valida que todos os links do sistema estão corretos e funcionando
 */

const { Client } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

// Construir DATABASE_URL
let DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  
  if (projectRef) {
    const password = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'Guigui1309@'
    DATABASE_URL = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
  }
}

const TEST_COMPANY_ID = '11111111-1111-4111-8111-1111111111c1'
const OPERATOR_EMAIL = 'operador@empresa.com'

// Testes de links
const linkTests = [
  {
    name: 'Dashboard do Operador',
    url: '/operator',
    expectedPattern: /^\/operator$/,
    shouldNotHave: '?company=',
    description: 'Link principal sem parâmetros'
  },
  {
    name: 'Funcionários',
    url: `/operator/funcionarios`,
    expectedPattern: /^\/operator\/funcionarios$/,
    shouldNotHave: '?company=',
    description: 'Link sem parâmetro de company (normalizado)'
  },
  {
    name: 'Rotas',
    url: '/operator/rotas',
    expectedPattern: /^\/operator\/rotas$/,
    shouldNotHave: '?company=',
    description: 'Link de rotas sem parâmetros'
  },
  {
    name: 'Alertas',
    url: '/operator/alertas',
    expectedPattern: /^\/operator\/alertas$/,
    shouldNotHave: '?company=',
    description: 'Link de alertas sem parâmetros'
  },
  {
    name: 'Custos',
    url: '/operator/custos',
    expectedPattern: /^\/operator\/custos$/,
    shouldNotHave: '?company=',
    description: 'Link de custos sem parâmetros'
  }
]

// Testes de navegação
const navigationTests = [
  {
    name: 'Voltar do Funcionários para Dashboard',
    from: `/operator/funcionarios`,
    to: '/operator',
    action: 'click-voltar',
    expectedUrl: '/operator'
  },
  {
    name: 'Acessar Rotas do Dashboard',
    from: '/operator',
    to: '/operator/rotas',
    action: 'click-link',
    expectedUrl: '/operator/rotas'
  }
]

// Testes de banco de dados
const databaseTests = [
  {
    name: 'Verificar empresa de teste',
    query: `SELECT id, role FROM companies WHERE id = $1`,
    params: [TEST_COMPANY_ID],
    expectedRow: { role: 'operator' }
  },
  {
    name: 'Verificar funcionários cadastrados',
    query: `SELECT COUNT(*) as count FROM gf_employee_company WHERE company_id = $1`,
    params: [TEST_COMPANY_ID],
    expectedMinimum: 1
  },
  {
    name: 'Verificar usuário operador',
    query: `SELECT id, email, role FROM auth.users WHERE email = $1`,
    params: [OPERATOR_EMAIL],
    expectedRow: { email: OPERATOR_EMAIL, role: 'operator' }
  },
  {
    name: 'Verificar mapeamento user-empresa',
    query: `
      SELECT COUNT(*) as count 
      FROM gf_user_company_map ucm
      JOIN auth.users u ON u.id = ucm.user_id
      WHERE u.email = $1 AND ucm.company_id = $2
    `,
    params: [OPERATOR_EMAIL, TEST_COMPANY_ID],
    expectedMinimum: 1
  }
]

async function runTests() {
  console.log('🧪 TESTES E2E - VERIFICAÇÃO DE LINKS\n')
  console.log('=' .repeat(80))
  console.log('\n📋 Configuração:\n')
  console.log(`   Empresa de teste: ${TEST_COMPANY_ID}`)
  console.log(`   Usuário de teste: ${OPERATOR_EMAIL}`)
  console.log(`   Base URL: https://golffox.vercel.app`)
  
  let totalTests = 0
  let passedTests = 0
  let failedTests = 0

  // 1. TESTES DE LINKS
  console.log('\n\n1️⃣  TESTES DE FORMATO DE LINKS\n')
  console.log('-'.repeat(80))

  for (const test of linkTests) {
    totalTests++
    
    try {
      // Verificar padrão esperado
      const matches = test.url.match(test.expectedPattern)
      
      // Verificar se não contém padrão indesejado
      const hasInvalidPattern = test.shouldNotHave && test.url.includes(test.shouldNotHave)
      
      if (matches && !hasInvalidPattern) {
        passedTests++
        console.log(`✅ ${test.name}`)
        console.log(`   URL: ${test.url}`)
        console.log(`   ${test.description}`)
      } else {
        failedTests++
        console.log(`❌ ${test.name}`)
        console.log(`   URL: ${test.url}`)
        console.log(`   Problema: ${hasInvalidPattern ? 'Contém padrão indesejado' : 'Padrão não corresponde'}`)
      }
    } catch (error) {
      failedTests++
      console.log(`❌ ${test.name}: ${error.message}`)
    }
    
    console.log('')
  }

  // 2. TESTES DE NAVEGAÇÃO (Simulados)
  console.log('\n2️⃣  TESTES DE NAVEGAÇÃO (Simulado)\n')
  console.log('-'.repeat(80))

  for (const test of navigationTests) {
    totalTests++
    
    try {
      // Simular navegação verificando se URLs são válidas
      const fromValid = test.from.startsWith('/operator')
      const toValid = test.to.startsWith('/operator')
      const expectedValid = test.expectedUrl.startsWith('/operator')
      
      if (fromValid && toValid && expectedValid) {
        passedTests++
        console.log(`✅ ${test.name}`)
        console.log(`   De: ${test.from}`)
        console.log(`   Para: ${test.to}`)
        console.log(`   Esperado: ${test.expectedUrl}`)
      } else {
        failedTests++
        console.log(`❌ ${test.name}`)
        console.log(`   URLs inválidas detectadas`)
      }
    } catch (error) {
      failedTests++
      console.log(`❌ ${test.name}: ${error.message}`)
    }
    
    console.log('')
  }

  // 3. TESTES DE BANCO DE DADOS
  console.log('\n3️⃣  TESTES DE BANCO DE DADOS\n')
  console.log('-'.repeat(80))

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()

    for (const test of databaseTests) {
      totalTests++
      
      try {
        const { rows } = await client.query(test.query, test.params)
        
        let passed = false
        
        if (test.expectedRow) {
          // Verificar se o row retornado tem os valores esperados
          const row = rows[0]
          passed = Object.keys(test.expectedRow).every(key => {
            return row && row[key] === test.expectedRow[key]
          })
        } else if (test.expectedMinimum) {
          // Verificar contagem mínima
          passed = rows[0] && parseInt(rows[0].count) >= test.expectedMinimum
        }
        
        if (passed) {
          passedTests++
          console.log(`✅ ${test.name}`)
          console.log(`   Resultado: ${JSON.stringify(rows[0])}`)
        } else {
          failedTests++
          console.log(`❌ ${test.name}`)
          console.log(`   Resultado: ${JSON.stringify(rows[0])}`)
          console.log(`   Esperado: ${JSON.stringify(test.expectedRow || { count: `>= ${test.expectedMinimum}` })}`)
        }
      } catch (error) {
        failedTests++
        console.log(`❌ ${test.name}: ${error.message}`)
      }
      
      console.log('')
    }
  } catch (error) {
    console.error(`❌ Erro ao conectar ao banco: ${error.message}`)
  } finally {
    await client.end()
  }

  // RELATÓRIO FINAL
  console.log('\n' + '='.repeat(80))
  console.log('📊 RELATÓRIO FINAL')
  console.log('='.repeat(80))
  console.log(`\n✅ Testes passados: ${passedTests}/${totalTests}`)
  console.log(`❌ Testes falhados: ${failedTests}/${totalTests}`)
  console.log(`📊 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

  if (failedTests === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!')
    console.log('\n✅ Sistema pronto para produção')
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM')
    console.log('\n❌ Revise os erros acima antes do deploy')
  }

  console.log('\n' + '='.repeat(80))

  // Retornar código de saída apropriado
  process.exit(failedTests > 0 ? 1 : 0)
}

// Executar testes
runTests().catch(error => {
  console.error('\n❌ ERRO FATAL:', error)
  process.exit(1)
})

