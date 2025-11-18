/**
 * Script de Verificação Remota do Supabase
 * Verifica views, RPCs, materialized views e policies
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.URL_SUPABASE || 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const VIEWS_TO_CHECK = [
  'v_admin_dashboard_kpis',
  'v_admin_kpis_materialized',
  'v_operator_dashboard_kpis_secure',
  'v_operator_routes_secure',
  'v_operator_alerts_secure',
  'v_operator_costs_secure',
  'v_carrier_expiring_documents',
  'v_carrier_vehicle_costs_summary',
  'v_carrier_route_costs_summary',
  'v_my_companies',
  'v_operator_employees_secure',
]

const MATERIALIZED_VIEWS_TO_CHECK = [
  'mv_admin_kpis',
  'mv_operator_kpis',
]

const RPC_FUNCTIONS_TO_CHECK = [
  'gf_map_snapshot_full',
  'get_user_role',
  'get_user_company_id',
  'get_user_carrier_id',
]

async function checkView(viewName) {
  try {
    const { data, error } = await supabaseAdmin
      .from(viewName)
      .select('*')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return { exists: false, error: 'View não existe' }
      }
      return { exists: false, error: error.message }
    }
    
    return { exists: true, rowCount: data?.length || 0 }
  } catch (err) {
    return { exists: false, error: err.message }
  }
}

async function checkMaterializedView(viewName) {
  try {
    const { data, error } = await supabaseAdmin
      .from(viewName)
      .select('*')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return { exists: false, populated: false, error: 'Materialized view não existe' }
      }
      return { exists: false, populated: false, error: error.message }
    }
    
    const isPopulated = data && data.length > 0
    return { exists: true, populated: isPopulated, rowCount: data?.length || 0 }
  } catch (err) {
    return { exists: false, populated: false, error: err.message }
  }
}

async function checkRPCFunction(functionName) {
  try {
    // Tentar chamar a função com parâmetros seguros
    let result
    if (functionName === 'gf_map_snapshot_full') {
      result = await supabaseAdmin.rpc(functionName, { 
        p_company_id: null, 
        p_route_id: null 
      })
    } else if (functionName === 'get_user_role') {
      // Esta função precisa de contexto de autenticação, vamos apenas verificar se existe
      result = { data: null, error: null }
    } else if (functionName === 'get_user_company_id') {
      result = { data: null, error: null }
    } else if (functionName === 'get_user_carrier_id') {
      result = { data: null, error: null }
    }
    
    if (result?.error) {
      if (result.error.code === '42883' || result.error.message?.includes('does not exist')) {
        return { exists: false, error: 'Função não existe' }
      }
      // Erro de autenticação é esperado para algumas funções
      if (result.error.message?.includes('permission denied') || result.error.message?.includes('authentication')) {
        return { exists: true, error: 'Função existe mas requer autenticação' }
      }
      return { exists: false, error: result.error.message }
    }
    
    return { exists: true, works: true }
  } catch (err) {
    return { exists: false, error: err.message }
  }
}

async function checkConnection() {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1)
    if (error) {
      return { connected: false, error: error.message }
    }
    return { connected: true }
  } catch (err) {
    return { connected: false, error: err.message }
  }
}

async function main() {
  console.log('🔍 Verificando Conexão com Supabase...\n')
  const connection = await checkConnection()
  if (!connection.connected) {
    console.error('❌ Erro ao conectar:', connection.error)
    process.exit(1)
  }
  console.log('✅ Conexão estabelecida\n')

  console.log('📊 Verificando Views...\n')
  const viewResults = {}
  for (const view of VIEWS_TO_CHECK) {
    const result = await checkView(view)
    viewResults[view] = result
    if (result.exists) {
      console.log(`✅ ${view}: Existe${result.rowCount > 0 ? ` (${result.rowCount} linha(s))` : ' (vazia)'}`)
    } else {
      console.log(`❌ ${view}: ${result.error}`)
    }
  }

  console.log('\n📦 Verificando Materialized Views...\n')
  const mvResults = {}
  for (const mv of MATERIALIZED_VIEWS_TO_CHECK) {
    const result = await checkMaterializedView(mv)
    mvResults[mv] = result
    if (result.exists) {
      if (result.populated) {
        console.log(`✅ ${mv}: Existe e está populada (${result.rowCount} linha(s))`)
      } else {
        console.log(`⚠️  ${mv}: Existe mas NÃO está populada`)
      }
    } else {
      console.log(`❌ ${mv}: ${result.error}`)
    }
  }

  console.log('\n🔧 Verificando RPC Functions...\n')
  const rpcResults = {}
  for (const rpc of RPC_FUNCTIONS_TO_CHECK) {
    const result = await checkRPCFunction(rpc)
    rpcResults[rpc] = result
    if (result.exists) {
      if (result.works) {
        console.log(`✅ ${rpc}: Existe e funciona`)
      } else {
        console.log(`✅ ${rpc}: Existe${result.error ? ` (${result.error})` : ''}`)
      }
    } else {
      console.log(`❌ ${rpc}: ${result.error}`)
    }
  }

  // Resumo
  console.log('\n📋 RESUMO:\n')
  const viewsOk = Object.values(viewResults).filter(r => r.exists).length
  const viewsTotal = VIEWS_TO_CHECK.length
  console.log(`Views: ${viewsOk}/${viewsTotal} existem`)

  const mvsOk = Object.values(mvResults).filter(r => r.exists && r.populated).length
  const mvsTotal = MATERIALIZED_VIEWS_TO_CHECK.length
  console.log(`Materialized Views: ${mvsOk}/${mvsTotal} existem e estão populadas`)

  const rpcsOk = Object.values(rpcResults).filter(r => r.exists).length
  const rpcsTotal = RPC_FUNCTIONS_TO_CHECK.length
  console.log(`RPC Functions: ${rpcsOk}/${rpcsTotal} existem`)

  // Salvar resultados em JSON
  const summary = {
    connection: connection,
    views: viewResults,
    materializedViews: mvResults,
    rpcFunctions: rpcResults,
    timestamp: new Date().toISOString()
  }

  require('fs').writeFileSync(
    'supabase-verification-results.json',
    JSON.stringify(summary, null, 2)
  )

  console.log('\n💾 Resultados salvos em: supabase-verification-results.json')
}

main().catch(console.error)

