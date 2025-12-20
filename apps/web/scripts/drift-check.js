/**
 * Script de Drift Check - Validação de Migrações v43
 * Verifica se todas as views, RPCs, policies e funções estão aplicadas corretamente
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || ''

// Lista de views esperadas
const EXPECTED_VIEWS = [
  // Admin views
  'v_admin_dashboard_kpis',
  'v_admin_dashboard_kpis_secure',
  // operador secure views
  'v_my_companies',
  'v_operator_dashboard_kpis_secure',
  'v_operator_routes_secure',
  'v_operator_alerts_secure',
  'v_operator_costs_secure',
  // Reports secure views
  'v_reports_delays_secure',
  'v_reports_occupancy_secure',
  'v_reports_not_boarded_secure',
  'v_reports_efficiency_secure',
  'v_reports_roi_sla_secure',
  // Map views
  'v_live_vehicles',
  'v_route_polylines',
  'v_trip_status',
  'v_alerts_open',
  // Costs views
  'v_costs_breakdown',
  // Reports views
  'v_reports_delays',
  'v_reports_occupancy',
  'v_reports_not_boarded',
]

// Lista de materialized views esperadas
const EXPECTED_MATVIEWS = [
  'mv_admin_kpis',
  'mv_operator_kpis',
]

// Lista de funções esperadas
const EXPECTED_FUNCTIONS = [
  'is_admin',
  'company_ownership',
  'refresh_mv_admin_kpis',
  'refresh_mv_admin_kpis_with_cleanup',
  'refresh_mv_operator_kpis',
  'v_positions_by_interval',
  'gf_map_snapshot_full',
  'update_gf_report_schedules_updated_at',
]

// Lista de tabelas que devem ter RLS
const TABLES_WITH_RLS = [
  'routes',
  'trips',
  'vehicles',
  'users',
  'companies',
  'gf_alerts',
  'gf_service_requests',
  'gf_assistance_requests',
  'gf_employee_company',
  'gf_invoices',
  'gf_invoice_lines',
  'gf_report_schedules',
  'gf_report_history',
  'gf_audit_log',
  'gf_vehicle_maintenance',
  'gf_vehicle_checklists',
  'gf_driver_documents',
]

async function checkViews(client) {
  const results = []
  
  console.log('\n📊 Verificando Views...')
  
  for (const viewName of EXPECTED_VIEWS) {
    try {
      const startTime = Date.now()
      const result = await client.query(`
        SELECT CASE 
          WHEN to_regclass('public.${viewName}') IS NOT NULL THEN true
          ELSE false
        END as exists
      `)
      
      const exists = result.rows[0]?.exists || false
      
      if (!exists) {
        results.push({
          name: viewName,
          status: 'MISSING',
          message: 'View não encontrada',
        })
        console.log(`   ❌ ${viewName}: MISSING`)
      } else {
        // Testar se a view pode ser consultada
        try {
          const testStart = Date.now()
          await client.query(`SELECT * FROM public.${viewName} LIMIT 1`)
          const testDuration = Date.now() - testStart
          
          if (testDuration > 250) {
            results.push({
              name: viewName,
              status: 'SLOW',
              message: `View lenta: ${testDuration}ms (p95 < 250ms)`,
              durationMs: testDuration,
            })
            console.log(`   ⚠️  ${viewName}: SLOW (${testDuration}ms)`)
          } else {
            results.push({
              name: viewName,
              status: 'OK',
              durationMs: testDuration,
            })
            console.log(`   ✅ ${viewName}: OK (${testDuration}ms)`)
          }
        } catch (error) {
          results.push({
            name: viewName,
            status: 'ERROR',
            message: `Erro ao consultar: ${error.message}`,
          })
          console.log(`   ❌ ${viewName}: ERROR - ${error.message}`)
        }
      }
    } catch (error) {
      results.push({
        name: viewName,
        status: 'ERROR',
        message: `Erro ao verificar: ${error.message}`,
      })
      console.log(`   ❌ ${viewName}: ERROR - ${error.message}`)
    }
  }
  
  return results
}

async function checkMatViews(client) {
  const results = []
  
  console.log('\n📊 Verificando Materialized Views...')
  
  for (const matviewName of EXPECTED_MATVIEWS) {
    try {
      const result = await client.query(`
        SELECT matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public' AND matviewname = $1
      `, [matviewName])
      
      if (result.rows.length === 0) {
        results.push({
          name: matviewName,
          status: 'MISSING',
          message: 'Materialized view não encontrada',
        })
        console.log(`   ❌ ${matviewName}: MISSING`)
      } else {
        // Testar se pode ser refresheada (sem CONCURRENTLY para evitar locks)
        try {
          const startTime = Date.now()
          // Não vamos realmente refresh para evitar locks, apenas verificar se existe
          results.push({
            name: matviewName,
            status: 'OK',
            message: 'Materialized view existe',
          })
          console.log(`   ✅ ${matviewName}: OK`)
        } catch (error) {
          results.push({
            name: matviewName,
            status: 'ERROR',
            message: `Erro ao verificar: ${error.message}`,
          })
          console.log(`   ❌ ${matviewName}: ERROR - ${error.message}`)
        }
      }
    } catch (error) {
      results.push({
        name: matviewName,
        status: 'ERROR',
        message: `Erro ao verificar: ${error.message}`,
      })
      console.log(`   ❌ ${matviewName}: ERROR - ${error.message}`)
    }
  }
  
  return results
}

async function checkFunctions(client) {
  const results = []
  
  console.log('\n⚙️  Verificando Funções...')
  
  for (const funcName of EXPECTED_FUNCTIONS) {
    try {
      const result = await client.query(`
        SELECT proname 
        FROM pg_proc 
        WHERE pronamespace = 'public'::regnamespace 
          AND proname = $1
      `, [funcName])
      
      if (result.rows.length === 0) {
        results.push({
          name: funcName,
          status: 'MISSING',
          message: 'Função não encontrada',
        })
        console.log(`   ❌ ${funcName}: MISSING`)
      } else {
        // Testar função is_admin() se for ela
        if (funcName === 'is_admin') {
          try {
            const startTime = Date.now()
            await client.query('SELECT public.is_admin()')
            const durationMs = Date.now() - startTime
            
            results.push({
              name: funcName,
              status: 'OK',
              durationMs,
            })
            console.log(`   ✅ ${funcName}: OK (${durationMs}ms)`)
          } catch (error) {
            results.push({
              name: funcName,
              status: 'ERROR',
              message: `Erro ao executar: ${error.message}`,
            })
            console.log(`   ❌ ${funcName}: ERROR - ${error.message}`)
          }
        } else {
          results.push({
            name: funcName,
            status: 'OK',
          })
          console.log(`   ✅ ${funcName}: OK`)
        }
      }
    } catch (error) {
      results.push({
        name: funcName,
        status: 'ERROR',
        message: `Erro ao verificar: ${error.message}`,
      })
      console.log(`   ❌ ${funcName}: ERROR - ${error.message}`)
    }
  }
  
  return results
}

async function checkRLSPolicies(client) {
  const results = []
  
  console.log('\n🔒 Verificando RLS Policies...')
  
  for (const tableName of TABLES_WITH_RLS) {
    try {
      const result = await client.query(`
        SELECT COUNT(*) as policy_count 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = $1
      `, [tableName])
      
      const policyCount = parseInt(result.rows[0]?.policy_count || '0')
      
      if (policyCount === 0) {
        results.push({
          name: tableName,
          status: 'MISSING',
          message: 'Nenhuma policy encontrada',
        })
        console.log(`   ❌ ${tableName}: MISSING (0 policies)`)
      } else {
        results.push({
          name: tableName,
          status: 'OK',
          message: `${policyCount} policies`,
        })
        console.log(`   ✅ ${tableName}: OK (${policyCount} policies)`)
      }
    } catch (error) {
      results.push({
        name: tableName,
        status: 'ERROR',
        message: `Erro ao verificar: ${error.message}`,
      })
      console.log(`   ❌ ${tableName}: ERROR - ${error.message}`)
    }
  }
  
  return results
}

async function checkRLSEnabled(client) {
  const results = []
  
  console.log('\n🔒 Verificando Status RLS...')
  
  for (const tableName of TABLES_WITH_RLS) {
    try {
      const result = await client.query(`
        SELECT tablename, 
               CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = $1
      `, [tableName])
      
      if (result.rows.length === 0) {
        results.push({
          name: tableName,
          status: 'MISSING',
          message: 'Tabela não encontrada',
        })
        console.log(`   ❌ ${tableName}: MISSING`)
      } else {
        const rlsStatus = result.rows[0].status
        const isEnabled = rlsStatus === 'ENABLED'
        
        results.push({
          name: tableName,
          status: isEnabled ? 'OK' : 'ERROR',
          message: rlsStatus,
        })
        console.log(`   ${isEnabled ? '✅' : '❌'} ${tableName}: ${rlsStatus}`)
      }
    } catch (error) {
      results.push({
        name: tableName,
        status: 'ERROR',
        message: `Erro ao verificar: ${error.message}`,
      })
      console.log(`   ❌ ${tableName}: ERROR - ${error.message}`)
    }
  }
  
  return results
}

async function checkPerformance(client) {
  const results = []
  
  console.log('\n⚡ Testando Performance das Views...')
  
  // Testar views críticas com 10 execuções para calcular p95
  const criticalViews = [
    'v_live_vehicles',
    'v_operator_dashboard_kpis_secure',
    'v_admin_dashboard_kpis',
    'v_costs_breakdown',
  ]
  
  for (const viewName of criticalViews) {
    try {
      // Verificar se view existe
      const existsResult = await client.query(`
        SELECT CASE 
          WHEN to_regclass('public.${viewName}') IS NOT NULL THEN true
          ELSE false
        END as exists
      `)
      
      if (!existsResult.rows[0]?.exists) {
        results.push({
          name: viewName,
          status: 'MISSING',
          message: 'View não encontrada',
        })
        continue
      }
      
      // Executar 10 vezes para calcular p95
      const durations = []
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now()
        await client.query(`SELECT * FROM public.${viewName} LIMIT 1`)
        durations.push(Date.now() - startTime)
      }
      
      // Calcular p95
      durations.sort((a, b) => a - b)
      const p95Index = Math.ceil(durations.length * 0.95) - 1
      const p95 = durations[p95Index]
      
      if (p95 > 250) {
        results.push({
          name: viewName,
          status: 'SLOW',
          message: `p95: ${p95}ms (deve ser < 250ms)`,
          durationMs: p95,
        })
        console.log(`   ⚠️  ${viewName}: SLOW (p95: ${p95}ms)`)
      } else {
        results.push({
          name: viewName,
          status: 'OK',
          message: `p95: ${p95}ms`,
          durationMs: p95,
        })
        console.log(`   ✅ ${viewName}: OK (p95: ${p95}ms)`)
      }
    } catch (error) {
      results.push({
        name: viewName,
        status: 'ERROR',
        message: `Erro ao testar: ${error.message}`,
      })
      console.log(`   ❌ ${viewName}: ERROR - ${error.message}`)
    }
  }
  
  return results
}

async function runDriftCheck() {
  console.log('🔍 Iniciando Drift Check - Validação de Migrações v43\n')
  
  if (!DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não configurada')
    console.error('Configure DATABASE_URL ou SUPABASE_DB_URL no .env')
    process.exit(1)
  }
  
  const client = new Client({
    connectionString: DATABASE_URL,
  })
  
  const results = {
    timestamp: new Date().toISOString(),
    views: [],
    matviews: [],
    functions: [],
    rpcFunctions: [],
    policies: [],
    rlsEnabled: [],
    performance: [],
    summary: {
      total: 0,
      ok: 0,
      missing: 0,
      errors: 0,
      slow: 0,
    },
  }
  
  try {
    console.log('Conectando ao banco de dados...')
    await client.connect()
    console.log('✅ Conectado!\n')
    
    // Executar verificações
    results.views = await checkViews(client)
    results.matviews = await checkMatViews(client)
    results.functions = await checkFunctions(client)
    results.rpcFunctions = results.functions.filter(f => f.name.includes('_') || f.name.includes('v_positions'))
    results.policies = await checkRLSPolicies(client)
    results.rlsEnabled = await checkRLSEnabled(client)
    results.performance = await checkPerformance(client)
    
    // Calcular summary
    const allResults = [
      ...results.views,
      ...results.matviews,
      ...results.functions,
      ...results.policies,
      ...results.rlsEnabled,
      ...results.performance,
    ]
    
    results.summary.total = allResults.length
    results.summary.ok = allResults.filter(r => r.status === 'OK').length
    results.summary.missing = allResults.filter(r => r.status === 'MISSING').length
    results.summary.errors = allResults.filter(r => r.status === 'ERROR').length
    results.summary.slow = allResults.filter(r => r.status === 'SLOW').length
    
    // Exibir resumo
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO DO DRIFT CHECK')
    console.log('='.repeat(60))
    console.log(`Total: ${results.summary.total}`)
    console.log(`✅ OK: ${results.summary.ok}`)
    console.log(`❌ MISSING: ${results.summary.missing}`)
    console.log(`⚠️  SLOW: ${results.summary.slow}`)
    console.log(`❌ ERRORS: ${results.summary.errors}`)
    console.log('='.repeat(60))
    
    // Determinar status geral
    const hasIssues = results.summary.missing > 0 || results.summary.errors > 0
    
    if (hasIssues) {
      console.log('\n❌ DRIFT CHECK FALHOU - Encontrados problemas!')
      console.log('\nProblemas encontrados:')
      
      if (results.summary.missing > 0) {
        console.log(`\n📋 Missing (${results.summary.missing}):`)
        allResults
          .filter(r => r.status === 'MISSING')
          .forEach(r => console.log(`   - ${r.name}: ${r.message}`))
      }
      
      if (results.summary.errors > 0) {
        console.log(`\n❌ Errors (${results.summary.errors}):`)
        allResults
          .filter(r => r.status === 'ERROR')
          .forEach(r => console.log(`   - ${r.name}: ${r.message}`))
      }
      
      if (results.summary.slow > 0) {
        console.log(`\n⚠️  Slow (${results.summary.slow}):`)
        allResults
          .filter(r => r.status === 'SLOW')
          .forEach(r => console.log(`   - ${r.name}: ${r.message}`))
      }
      
      process.exit(1)
    } else {
      console.log('\n✅ DRIFT CHECK PASSOU - Todas as verificações OK!')
      process.exit(0)
    }
  } catch (error) {
    console.error('\n❌ Erro durante drift check:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runDriftCheck().catch(console.error)
}

module.exports = { runDriftCheck }

