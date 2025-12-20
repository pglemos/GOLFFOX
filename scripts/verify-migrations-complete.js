/**
 * Script para Verificar Migrations Completas e Testar Funcionalidades
 */

const { Client } = require('pg')

const DB_CONFIG = {
  connectionString: 'postgresql://postgres:Guigui1309%40@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?options=reference%3Dvmoxzesvjcfmrebagcwo&sslmode=require&pgbouncer=true',
  ssl: {
    rejectUnauthorized: false
  }
}

const SUPABASE_URL = 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A'

/**
 * Verificar estruturas antigas (ainda existem?)
 */
async function checkOldStructures(client) {
  console.log('\n📊 Verificando estruturas ANTIGAS (devem NÃO existir)...\n')
  
  const oldStructures = {
    tables: ['gf_operator_settings', 'gf_operator_incidents', 'driver_locations', 'gf_vehicle_documents'],
    views: ['v_operator_dashboard_kpis_secure', 'v_operator_routes_secure']
  }
  
  for (const table of oldStructures.tables) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table])
      const exists = result.rows[0].exists
      console.log(`   ${exists ? '⚠️ ' : '✅'} ${table} - ${exists ? 'AINDA EXISTE' : 'NÃO EXISTE (correto)'}`)
    } catch (error) {
      console.log(`   ❌ ${table} - Erro: ${error.message}`)
    }
  }
  
  for (const view of oldStructures.views) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_views 
          WHERE schemaname = 'public' AND viewname = $1
        )
      `, [view])
      const exists = result.rows[0].exists
      console.log(`   ${exists ? '⚠️ ' : '✅'} ${view} - ${exists ? 'AINDA EXISTE' : 'NÃO EXISTE (correto)'}`)
    } catch (error) {
      console.log(`   ❌ ${view} - Erro: ${error.message}`)
    }
  }
}

/**
 * Verificar estruturas novas (foram criadas?)
 */
async function checkNewStructures(client) {
  console.log('\n📊 Verificando estruturas NOVAS (devem existir)...\n')
  
  const newStructures = {
    tables: [
      'gf_operador_settings',
      'gf_operador_incidents',
      'gf_operador_documents',
      'gf_operador_audits',
      'motorista_locations',
      'motorista_messages',
      'motorista_positions',
      'passageiro_checkins',
      'passageiro_cancellations',
      'trip_passageiros',
      'veiculo_checklists',
      'gf_veiculo_checklists',
      'gf_veiculo_documents',
      'gf_motorista_compensation',
      'gf_transportadora_documents'
    ],
    views: [
      'v_operador_dashboard_kpis',
      'v_operador_dashboard_kpis_secure',
      'v_operador_routes',
      'v_operador_routes_secure',
      'v_operador_alerts',
      'v_operador_alerts_secure',
      'v_operador_costs',
      'v_operador_costs_secure',
      'v_operador_assigned_carriers'
    ],
    matviews: ['mv_operador_kpis'],
    functions: ['refresh_mv_operador_kpis']
  }
  
  const results = { tables: [], views: [], matviews: [], functions: [] }
  
  for (const table of newStructures.tables) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table])
      const exists = result.rows[0].exists
      if (exists) results.tables.push(table)
      console.log(`   ${exists ? '✅' : '⚠️ '} ${table} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
    } catch (error) {
      console.log(`   ❌ ${table} - Erro: ${error.message}`)
    }
  }
  
  for (const view of newStructures.views) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_views 
          WHERE schemaname = 'public' AND viewname = $1
        )
      `, [view])
      const exists = result.rows[0].exists
      if (exists) results.views.push(view)
      console.log(`   ${exists ? '✅' : '⚠️ '} ${view} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
    } catch (error) {
      console.log(`   ❌ ${view} - Erro: ${error.message}`)
    }
  }
  
  for (const matview of newStructures.matviews) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_matviews 
          WHERE schemaname = 'public' AND matviewname = $1
        )
      `, [matview])
      const exists = result.rows[0].exists
      if (exists) results.matviews.push(matview)
      console.log(`   ${exists ? '✅' : '⚠️ '} ${matview} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
    } catch (error) {
      console.log(`   ❌ ${matview} - Erro: ${error.message}`)
    }
  }
  
  for (const func of newStructures.functions) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_proc p 
          JOIN pg_namespace n ON p.pronamespace = n.oid 
          WHERE n.nspname = 'public' AND p.proname = $1
        )
      `, [func])
      const exists = result.rows[0].exists
      if (exists) results.functions.push(func)
      console.log(`   ${exists ? '✅' : '⚠️ '} ${func} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
    } catch (error) {
      console.log(`   ❌ ${func} - Erro: ${error.message}`)
    }
  }
  
  return results
}

/**
 * Testar funcionalidades críticas via API REST
 */
async function testCriticalAPIs() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 TESTANDO FUNCIONALIDADES CRÍTICAS VIA API')
  console.log('='.repeat(60))
  
  // Testar views via REST API
  const criticalViews = [
    'v_operador_dashboard_kpis_secure',
    'v_operador_routes_secure',
    'v_operador_alerts_secure'
  ]
  
  console.log('\n📊 Testando Views via REST API:\n')
  
  let viewsOk = 0
  for (const viewName of criticalViews) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${viewName}?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      })
      const exists = response.ok || response.status === 200
      console.log(`   ${exists ? '✅' : '❌'} ${viewName} - ${exists ? 'ACESSÍVEL' : 'NÃO ACESSÍVEL'}`)
      if (exists) viewsOk++
    } catch (error) {
      console.log(`   ❌ ${viewName} - Erro: ${error.message}`)
    }
  }
  
  // Testar tabelas via REST API
  const criticalTables = [
    'gf_operador_settings',
    'gf_operador_incidents'
  ]
  
  console.log('\n📊 Testando Tabelas via REST API:\n')
  
  let tablesOk = 0
  for (const tableName of criticalTables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      })
      const exists = response.ok || response.status === 200
      console.log(`   ${exists ? '✅' : '⚠️ '} ${tableName} - ${exists ? 'ACESSÍVEL' : 'NÃO ACESSÍVEL'}`)
      if (exists) tablesOk++
    } catch (error) {
      console.log(`   ⚠️  ${tableName} - Erro: ${error.message}`)
    }
  }
  
  return { viewsOk, tablesOk, totalViews: criticalViews.length, totalTables: criticalTables.length }
}

/**
 * Função principal
 */
async function main() {
  const client = new Client(DB_CONFIG)
  
  try {
    console.log('🚀 Conectando ao banco para verificação completa...\n')
    await client.connect()
    console.log('✅ Conectado\n')
    
    // Verificar estruturas antigas
    await checkOldStructures(client)
    
    // Verificar estruturas novas
    const newResults = await checkNewStructures(client)
    
    // Testar APIs
    const apiResults = await testCriticalAPIs()
    
    // Resumo final
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO FINAL DA VERIFICAÇÃO')
    console.log('='.repeat(60))
    
    console.log(`\n✅ Tabelas renomeadas encontradas: ${newResults.tables.length}`)
    console.log(`✅ Views renomeadas encontradas: ${newResults.views.length}`)
    console.log(`✅ Materialized Views renomeadas: ${newResults.matviews.length}`)
    console.log(`✅ Funções renomeadas: ${newResults.functions.length}`)
    console.log(`\n✅ Views acessíveis via API: ${apiResults.viewsOk}/${apiResults.totalViews}`)
    console.log(`✅ Tabelas acessíveis via API: ${apiResults.tablesOk}/${apiResults.totalTables}`)
    
    const success = newResults.tables.length > 0 || newResults.views.length > 0
    
    if (success) {
      console.log('\n✅ Migrations aplicadas com sucesso!')
      console.log('✅ Estruturas renomeadas encontradas no banco!')
    } else {
      console.log('\n⚠️  Nenhuma estrutura renomeada encontrada.')
      console.log('   Isso pode significar que:')
      console.log('   1. As estruturas originais não existiam')
      console.log('   2. As migrations precisam ser aplicadas novamente')
      console.log('   3. As estruturas têm nomes diferentes')
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()

