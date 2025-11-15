/**
 * Script: Validação Pós-Migração v43
 * Executa queries de validação e gera relatório JSON
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

async function validateMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  const audit = {
    timestamp: new Date().toISOString(),
    migrations_applied: ['v43_gf_user_company_map', 'v43_company_ownership_function', 'v43_company_branding', 'v43_operator_rls_complete', 'v43_operator_secure_views', 'v43_operator_kpi_matviews', 'v43_route_optimization_cache', 'v43_report_scheduling'],
    objects_created: { tables: [], views: [], matviews: [], functions: [] },
    rls_enabled: {},
    policy_counts: {},
    sanity_checks: {},
    backfill: {}
  }

  try {
    console.log('Conectando ao banco de dados...')
    await client.connect()
    console.log('Conectado!\n')

    // 1. Verificar objetos criados
    console.log('Verificando objetos criados...')
    
    // Tabelas
    const tables = ['gf_user_company_map', 'gf_company_branding', 'gf_route_optimization_cache', 'gf_report_schedules', 'gf_report_history']
    for (const table of tables) {
      const exists = await client.query(`SELECT CASE WHEN to_regclass('public.${table}') IS NOT NULL THEN true ELSE false END as exists`)
      if (exists.rows[0].exists) {
        audit.objects_created.tables.push(table)
      }
    }
    console.log(`   Tabelas: ${audit.objects_created.tables.length}/${tables.length}`)

    // Views
    const viewsResult = await client.query(`SELECT viewname FROM pg_views WHERE schemaname = 'public' AND (viewname LIKE 'v_%secure' OR viewname = 'v_my_companies') ORDER BY viewname`)
    audit.objects_created.views = viewsResult.rows.map(r => r.viewname)
    console.log(`   Views: ${audit.objects_created.views.length}`)

    // Materialized views
    const matviewResult = await client.query(`SELECT matviewname FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_operator_kpis'`)
    if (matviewResult.rows.length > 0) {
      audit.objects_created.matviews.push('mv_operator_kpis')
    }
    console.log(`   Materialized views: ${audit.objects_created.matviews.length}`)

    // Funções
    const functionsResult = await client.query(`SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('company_ownership', 'refresh_mv_operator_kpis') ORDER BY proname`)
    audit.objects_created.functions = functionsResult.rows.map(r => r.proname)
    console.log(`   Funções: ${audit.objects_created.functions.length}`)

    // 2. Verificar RLS
    console.log('\nVerificando RLS...')
    const rlsResult = await client.query(`SELECT tablename, rowsecurity, (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count FROM pg_tables t WHERE schemaname = 'public' AND tablename IN ('routes', 'trips', 'gf_alerts', 'gf_service_requests', 'gf_employee_company', 'gf_invoices', 'gf_invoice_lines') ORDER BY tablename`)
    rlsResult.rows.forEach(row => {
      audit.rls_enabled[row.tablename] = row.rowsecurity
      audit.policy_counts[row.tablename] = parseInt(row.policy_count)
    })
    console.log(`   Tabelas com RLS ativo: ${Object.values(audit.rls_enabled).filter(v => v).length}/${rlsResult.rows.length}`)

    // 3. Sanity checks
    console.log('\nExecutando sanity checks...')
    
    // v_my_companies
    try {
      const myCompaniesResult = await client.query('SELECT COUNT(*) as count FROM v_my_companies')
      audit.sanity_checks.v_my_companies_count = parseInt(myCompaniesResult.rows[0].count)
      console.log(`   v_my_companies: ${audit.sanity_checks.v_my_companies_count} empresas`)
    } catch (error) {
      audit.sanity_checks.v_my_companies_count = 0
      console.log(`   v_my_companies: erro ao consultar`)
    }

    // mv_operator_kpis
    try {
      const kpisResult = await client.query('SELECT COUNT(*) as count FROM mv_operator_kpis')
      audit.sanity_checks.mv_operator_kpis_count = parseInt(kpisResult.rows[0].count)
      console.log(`   mv_operator_kpis: ${audit.sanity_checks.mv_operator_kpis_count} registros`)
    } catch (error) {
      audit.sanity_checks.mv_operator_kpis_count = 0
      console.log(`   mv_operator_kpis: erro ao consultar`)
    }

    // v_operator_routes_secure
    try {
      const routesResult = await client.query('SELECT COUNT(*) as count FROM v_operator_routes_secure')
      audit.sanity_checks.v_operator_routes_count = parseInt(routesResult.rows[0].count)
      console.log(`   v_operator_routes_secure: ${audit.sanity_checks.v_operator_routes_count} rotas`)
    } catch (error) {
      audit.sanity_checks.v_operator_routes_count = 0
    }

    // v_operator_alerts_secure
    try {
      const alertsResult = await client.query('SELECT COUNT(*) as count FROM v_operator_alerts_secure')
      audit.sanity_checks.v_operator_alerts_count = parseInt(alertsResult.rows[0].count)
      console.log(`   v_operator_alerts_secure: ${audit.sanity_checks.v_operator_alerts_count} alertas`)
    } catch (error) {
      audit.sanity_checks.v_operator_alerts_count = 0
    }

    // 4. Backfill
    console.log('\nVerificando backfill...')
    try {
      const mappingsResult = await client.query(`SELECT COUNT(*) as total_mappings, COUNT(DISTINCT user_id) as unique_users, COUNT(DISTINCT company_id) as unique_companies FROM gf_user_company_map`)
      audit.backfill.operators_mapped = parseInt(mappingsResult.rows[0].total_mappings)
      audit.backfill.unique_users = parseInt(mappingsResult.rows[0].unique_users)
      audit.backfill.unique_companies = parseInt(mappingsResult.rows[0].unique_companies)
      console.log(`   Mapeamentos: ${audit.backfill.operators_mapped}`)
    } catch (error) {
      audit.backfill.operators_mapped = 0
      audit.backfill.unique_users = 0
      audit.backfill.unique_companies = 0
    }

    try {
      const brandingResult = await client.query('SELECT COUNT(*) as count FROM gf_company_branding')
      audit.backfill.companies_with_branding = parseInt(brandingResult.rows[0].count)
      console.log(`   Empresas com branding: ${audit.backfill.companies_with_branding}`)
    } catch (error) {
      audit.backfill.companies_with_branding = 0
    }

    // Salvar relatório
    const outputPath = path.join(__dirname, '..', 'SUPABASE_V43_AUDIT.json')
    fs.writeFileSync(outputPath, JSON.stringify(audit, null, 2))
    console.log(`\nRelatório salvo em: ${outputPath}`)

    return audit

  } catch (error) {
    console.error('Erro:', error.message)
    throw error
  } finally {
    await client.end()
    console.log('\nConexão fechada.')
  }
}

validateMigrations()
  .then(() => {
    console.log('\nValidação concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nErro fatal:', error)
    process.exit(1)
  })
