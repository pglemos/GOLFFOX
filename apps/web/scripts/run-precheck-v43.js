/**
 * Script de Pré-Check v43
 * Verifica objetos existentes no Supabase antes de aplicar migrações
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

async function runPrecheck() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  const results = {
    timestamp: new Date().toISOString(),
    tables: {},
    views: {},
    matviews: {},
    functions: {},
    rls_policies: {},
    rls_enabled: {},
    mappings: {}
  }

  try {
    console.log('Conectando ao banco de dados...')
    await client.connect()
    console.log('Conectado!\n')

    // 1. Verificar tabelas
    console.log('Verificando tabelas...')
    const tables = ['gf_user_company_map', 'gf_company_branding', 'gf_route_optimization_cache', 'gf_report_schedules', 'gf_report_history']
    for (const table of tables) {
      const result = await client.query(`SELECT CASE WHEN to_regclass('public.${table}') IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status`)
      results.tables[table] = result.rows[0].status
      console.log(`   ${table}: ${result.rows[0].status}`)
    }

    // 2. Verificar views
    console.log('\nVerificando views seguras...')
    const viewsResult = await client.query(`SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname IN ('v_my_companies', 'v_operator_dashboard_kpis_secure', 'v_operator_routes_secure', 'v_operator_alerts_secure', 'v_operator_costs_secure', 'v_reports_delays_secure', 'v_reports_occupancy_secure', 'v_reports_not_boarded_secure', 'v_reports_efficiency_secure', 'v_reports_roi_sla_secure') ORDER BY viewname`)
    const existingViews = viewsResult.rows.map(r => r.viewname)
    const expectedViews = ['v_my_companies', 'v_operator_dashboard_kpis_secure', 'v_operator_routes_secure', 'v_operator_alerts_secure', 'v_operator_costs_secure', 'v_reports_delays_secure', 'v_reports_occupancy_secure', 'v_reports_not_boarded_secure', 'v_reports_efficiency_secure', 'v_reports_roi_sla_secure']
    expectedViews.forEach(view => {
      results.views[view] = existingViews.includes(view) ? 'EXISTS' : 'MISSING'
      console.log(`   ${view}: ${results.views[view]}`)
    })

    // 3. Verificar materialized view
    console.log('\nVerificando materialized views...')
    const matviewResult = await client.query(`SELECT matviewname FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_operator_kpis'`)
    results.matviews['mv_operator_kpis'] = matviewResult.rows.length > 0 ? 'EXISTS' : 'MISSING'
    console.log(`   mv_operator_kpis: ${results.matviews['mv_operator_kpis']}`)

    // 4. Verificar funções
    console.log('\nVerificando funções...')
    const functionsResult = await client.query(`SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('company_ownership', 'refresh_mv_operator_kpis') ORDER BY proname`)
    const existingFunctions = functionsResult.rows.map(r => r.proname)
    const expectedFunctions = ['company_ownership', 'refresh_mv_operator_kpis']
    expectedFunctions.forEach(func => {
      results.functions[func] = existingFunctions.includes(func) ? 'EXISTS' : 'MISSING'
      console.log(`   ${func}: ${results.functions[func]}`)
    })

    // 5. Verificar RLS policies
    console.log('\nVerificando RLS policies...')
    const policiesResult = await client.query(`SELECT tablename, COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('routes', 'trips', 'gf_alerts', 'gf_service_requests', 'gf_employee_company', 'gf_invoices', 'gf_invoice_lines') GROUP BY tablename ORDER BY tablename`)
    const expectedTables = ['routes', 'trips', 'gf_alerts', 'gf_service_requests', 'gf_employee_company', 'gf_invoices', 'gf_invoice_lines']
    expectedTables.forEach(table => {
      const policyData = policiesResult.rows.find(r => r.tablename === table)
      results.rls_policies[table] = policyData ? policyData.policy_count : 0
      console.log(`   ${table}: ${results.rls_policies[table]} policies`)
    })

    // 6. Verificar se RLS está habilitado
    console.log('\nVerificando status RLS...')
    const rlsStatusResult = await client.query(`SELECT tablename, CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('routes', 'trips', 'gf_alerts', 'gf_service_requests', 'gf_employee_company', 'gf_invoices', 'gf_invoice_lines') ORDER BY tablename`)
    rlsStatusResult.rows.forEach(row => {
      results.rls_enabled[row.tablename] = row.status
      console.log(`   ${row.tablename}: ${row.status}`)
    })

    // 7. Verificar mapeamentos existentes
    console.log('\nVerificando mapeamentos existentes...')
    try {
      const mappingsResult = await client.query(`SELECT COUNT(*) as total_mappings, COUNT(DISTINCT user_id) as unique_users, COUNT(DISTINCT company_id) as unique_companies FROM public.gf_user_company_map`)
      results.mappings = mappingsResult.rows[0] || { total_mappings: 0, unique_users: 0, unique_companies: 0 }
      console.log(`   Total de mapeamentos: ${results.mappings.total_mappings}`)
      console.log(`   Usuários únicos: ${results.mappings.unique_users}`)
      console.log(`   Empresas únicas: ${results.mappings.unique_companies}`)
    } catch (error) {
      console.log('   Tabela gf_user_company_map ainda não existe')
      results.mappings = { total_mappings: 0, unique_users: 0, unique_companies: 0 }
    }

    // Salvar resultado em JSON
    const outputPath = path.join(__dirname, '..', 'SUPABASE_PRECHECK_RESULT.json')
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`\nRelatório salvo em: ${outputPath}`)

    return results

  } catch (error) {
    console.error('Erro:', error.message)
    throw error
  } finally {
    await client.end()
    console.log('\nConexão fechada.')
  }
}

runPrecheck()
  .then(() => {
    console.log('\nPré-check concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nErro fatal:', error)
    process.exit(1)
  })
