/**
 * Script de diagnóstico completo para a página de funcionários
 * Verifica: migrations, RLS, dados, views, funções
 */

const { Client } = require('pg')
const fs = require('fs')
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

if (!DATABASE_URL) {
  DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'
}

const report = {
  timestamp: new Date().toISOString(),
  checks: [],
  errors: [],
  warnings: [],
  recommendations: []
}

function addCheck(name, status, details = '') {
  const check = { name, status, details }
  report.checks.push(check)
  
  const icon = status === 'OK' ? '✅' : status === 'WARNING' ? '⚠️' : '❌'
  console.log(`${icon} ${name}: ${status}`)
  if (details) console.log(`   ${details}`)
}

function addError(error) {
  report.errors.push(error)
  console.error(`❌ ERRO: ${error}`)
}

function addWarning(warning) {
  report.warnings.push(warning)
  console.warn(`⚠️  AVISO: ${warning}`)
}

function addRecommendation(rec) {
  report.recommendations.push(rec)
  console.log(`💡 RECOMENDAÇÃO: ${rec}`)
}

async function diagnose() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined
  })

  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO - Página de Funcionários\n')
    console.log('=' .repeat(80))
    
    // 1. Conectar ao banco
    console.log('\n📡 1. CONEXÃO COM BANCO DE DADOS')
    await client.connect()
    addCheck('Conexão com banco', 'OK', 'Conectado com sucesso')

    // 2. Verificar tabela gf_employee_company
    console.log('\n📊 2. TABELA gf_employee_company')
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gf_employee_company'
      ) as exists
    `)
    
    if (tableCheck.rows[0].exists) {
      addCheck('Tabela gf_employee_company', 'OK', 'Tabela existe')
      
      // Verificar colunas
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'gf_employee_company'
        ORDER BY ordinal_position
      `)
      
      const expectedColumns = ['id', 'company_id', 'name', 'cpf', 'email', 'phone', 'address', 'latitude', 'longitude', 'is_active']
      const actualColumns = columns.rows.map(r => r.column_name)
      
      console.log('   Colunas encontradas:', actualColumns.join(', '))
      
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col))
      if (missingColumns.length > 0) {
        addWarning(`Colunas esperadas ausentes: ${missingColumns.join(', ')}`)
      } else {
        addCheck('Colunas da tabela', 'OK', 'Todas as colunas necessárias existem')
      }
      
      // Contar registros
      const count = await client.query('SELECT COUNT(*) as count FROM gf_employee_company')
      addCheck('Dados na tabela', count.rows[0].count > 0 ? 'OK' : 'WARNING', 
        `${count.rows[0].count} funcionários cadastrados`)
      
      if (count.rows[0].count === 0) {
        addRecommendation('Nenhum funcionário cadastrado. Execute: node scripts/seed-operator-data.js')
      }
      
      // Verificar RLS
      const rlsCheck = await client.query(`
        SELECT relname, relrowsecurity, relforcerowsecurity
        FROM pg_class
        WHERE relname = 'gf_employee_company'
      `)
      
      if (rlsCheck.rows[0]?.relrowsecurity) {
        addCheck('RLS na tabela', 'OK', 'Row Level Security está ATIVADO')
        
        // Verificar policies
        const policies = await client.query(`
          SELECT policyname, permissive, roles, qual, with_check
          FROM pg_policies
          WHERE tablename = 'gf_employee_company'
        `)
        
        if (policies.rows.length > 0) {
          addCheck('Policies RLS', 'OK', `${policies.rows.length} policies encontradas`)
          console.log('   Policies:', policies.rows.map(p => p.policyname).join(', '))
        } else {
          addError('Nenhuma policy RLS encontrada para gf_employee_company')
          addRecommendation('Execute migration: v43_operator_rls_complete.sql')
        }
      } else {
        addWarning('RLS não está ativado na tabela gf_employee_company')
        addRecommendation('Execute: ALTER TABLE gf_employee_company ENABLE ROW LEVEL SECURITY;')
      }
      
    } else {
      addError('Tabela gf_employee_company NÃO EXISTE')
      addRecommendation('Execute migration: gf_tables_auxiliares.sql')
    }

    // 3. Verificar função company_ownership
    console.log('\n🔧 3. FUNÇÃO company_ownership')
    const funcCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'company_ownership'
      ) as exists
    `)
    
    if (funcCheck.rows[0].exists) {
      addCheck('Função company_ownership', 'OK', 'Função existe')
      
      // Testar função
      try {
        const testFunc = await client.query(`
          SELECT public.company_ownership('11111111-1111-4111-8111-1111111111c1'::uuid) as result
        `)
        addCheck('Teste da função', 'OK', `Retornou: ${testFunc.rows[0].result}`)
      } catch (err) {
        addError(`Erro ao testar função: ${err.message}`)
      }
    } else {
      addError('Função company_ownership NÃO EXISTE')
      addRecommendation('Execute migration: v43_company_ownership_function.sql')
    }

    // 4. Verificar tabela gf_user_company_map
    console.log('\n👥 4. TABELA gf_user_company_map (mapeamento user-empresa)')
    const mapTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gf_user_company_map'
      ) as exists
    `)
    
    if (mapTableCheck.rows[0].exists) {
      addCheck('Tabela gf_user_company_map', 'OK', 'Tabela existe')
      
      const mapCount = await client.query('SELECT COUNT(*) as count FROM gf_user_company_map')
      addCheck('Mapeamentos cadastrados', mapCount.rows[0].count > 0 ? 'OK' : 'WARNING',
        `${mapCount.rows[0].count} mapeamentos user→empresa`)
      
      if (mapCount.rows[0].count === 0) {
        addWarning('Nenhum mapeamento user→empresa encontrado')
        addRecommendation('Execute: node scripts/seed-operator-mappings.js')
      }
      
      // Verificar mapeamentos com detalhes
      const mappings = await client.query(`
        SELECT 
          ucm.user_id,
          ucm.company_id,
          u.email,
          u.role,
          c.name as company_name
        FROM gf_user_company_map ucm
        LEFT JOIN users u ON u.id = ucm.user_id
        LEFT JOIN companies c ON c.id = ucm.company_id
        LIMIT 5
      `)
      
      if (mappings.rows.length > 0) {
        console.log('\n   📋 Primeiros 5 mapeamentos:')
        mappings.rows.forEach(m => {
          console.log(`      - ${m.email} (${m.role}) → ${m.company_name}`)
        })
      }
    } else {
      addError('Tabela gf_user_company_map NÃO EXISTE')
      addRecommendation('Execute migration: v43_gf_user_company_map.sql')
    }

    // 5. Verificar views
    console.log('\n👁️  5. VIEWS DE FUNCIONÁRIOS')
    
    const views = ['v_operator_employees_secure', 'v_operator_employees']
    for (const viewName of views) {
      const viewCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists
      `, [viewName])
      
      if (viewCheck.rows[0].exists) {
        addCheck(`View ${viewName}`, 'OK', 'View existe')
        
        // Testar query na view
        try {
          const testView = await client.query(`SELECT COUNT(*) as count FROM ${viewName}`)
          console.log(`   Registros acessíveis: ${testView.rows[0].count}`)
        } catch (err) {
          addError(`Erro ao consultar ${viewName}: ${err.message}`)
        }
      } else {
        addWarning(`View ${viewName} não existe`)
        if (viewName === 'v_operator_employees_secure') {
          addRecommendation('Execute migration: v44_operator_employees_secure_view.sql')
        }
      }
    }

    // 6. Verificar view v_my_companies
    console.log('\n🏢 6. VIEW v_my_companies (empresas do usuário)')
    const myCompaniesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views
        WHERE table_schema = 'public' 
        AND table_name = 'v_my_companies'
      ) as exists
    `)
    
    if (myCompaniesCheck.rows[0].exists) {
      addCheck('View v_my_companies', 'OK', 'View existe')
    } else {
      addError('View v_my_companies NÃO EXISTE')
      addRecommendation('Execute migration: v43_operator_secure_views.sql')
    }

    // 7. Verificar empresas
    console.log('\n🏢 7. EMPRESAS')
    const companies = await client.query(`
      SELECT id, name, role 
      FROM companies 
      WHERE role = 'operator' 
      LIMIT 5
    `)
    
    if (companies.rows.length > 0) {
      addCheck('Empresas operadoras', 'OK', `${companies.rows.length} empresas encontradas`)
      console.log('\n   📋 Empresas:')
      companies.rows.forEach(c => {
        console.log(`      - ${c.name} (${c.id})`)
      })
      
      // Verificar se 11111111-1111-4111-8111-1111111111c1 existe
      const targetCompany = companies.rows.find(c => c.id === '11111111-1111-4111-8111-1111111111c1')
      if (targetCompany) {
        addCheck('Empresa de teste', 'OK', `Empresa ${targetCompany.name} existe`)
      } else {
        addWarning('Empresa 11111111-1111-4111-8111-1111111111c1 não encontrada')
      }
    } else {
      addWarning('Nenhuma empresa operadora encontrada')
      addRecommendation('Execute: node scripts/seed-operator-data.js')
    }

    // 8. Teste de query completa
    console.log('\n🧪 8. TESTE DE QUERY COMPLETA')
    try {
      const testQuery = await client.query(`
        SELECT 
          ec.id,
          ec.company_id,
          ec.name,
          ec.cpf,
          ec.email,
          ec.phone,
          ec.is_active,
          c.name as company_name
        FROM gf_employee_company ec
        JOIN companies c ON c.id = ec.company_id
        WHERE ec.company_id = '11111111-1111-4111-8111-1111111111c1'
        LIMIT 5
      `)
      
      if (testQuery.rows.length > 0) {
        addCheck('Query de teste', 'OK', `${testQuery.rows.length} funcionários retornados`)
        console.log('\n   📋 Funcionários da empresa de teste:')
        testQuery.rows.forEach(f => {
          console.log(`      - ${f.name} (${f.email || 'sem email'})`)
        })
      } else {
        addWarning('Query de teste não retornou resultados')
        addRecommendation('Cadastre funcionários para a empresa 11111111-1111-4111-8111-1111111111c1')
      }
    } catch (err) {
      addError(`Erro na query de teste: ${err.message}`)
    }

    // Resumo final
    console.log('\n' + '='.repeat(80))
    console.log('\n📊 RESUMO DO DIAGNÓSTICO\n')
    
    const okCount = report.checks.filter(c => c.status === 'OK').length
    const warningCount = report.checks.filter(c => c.status === 'WARNING').length
    const errorCount = report.checks.filter(c => c.status === 'ERROR').length
    
    console.log(`✅ OK: ${okCount}`)
    console.log(`⚠️  Avisos: ${warningCount}`)
    console.log(`❌ Erros: ${errorCount}`)
    
    if (report.errors.length > 0) {
      console.log('\n❌ ERROS CRÍTICOS:')
      report.errors.forEach(e => console.log(`   - ${e}`))
    }
    
    if (report.warnings.length > 0) {
      console.log('\n⚠️  AVISOS:')
      report.warnings.forEach(w => console.log(`   - ${w}`))
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:')
      report.recommendations.forEach(r => console.log(`   - ${r}`))
    }
    
    // Salvar relatório
    const reportFile = path.join(__dirname, 'DIAGNOSTICO_FUNCIONARIOS.json')
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
    console.log(`\n📄 Relatório salvo em: ${reportFile}`)

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message)
    console.error(error)
  } finally {
    await client.end()
  }
}

diagnose().catch(console.error)

