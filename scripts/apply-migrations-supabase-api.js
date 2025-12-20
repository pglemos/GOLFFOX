/**
 * Script para Aplicar Migrations via Supabase REST API
 * 
 * Usa a API REST do Supabase para verificar e aplicar migrations
 * Como o Supabase não permite execução direta de SQL via API por segurança,
 * este script verifica o estado atual e gera instruções detalhadas.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'web', '.env.local') })
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurado')
  process.exit(1)
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

const MIGRATIONS_TO_APPLY = [
  '20250127_rename_operator_to_operador.sql',
  '20250127_rename_tables_pt_br.sql'
]

/**
 * Ler conteúdo da migration
 */
function readMigration(fileName) {
  const filePath = path.join(MIGRATIONS_DIR, fileName)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration não encontrada: ${filePath}`)
  }
  return fs.readFileSync(filePath, 'utf8')
}

/**
 * Verificar se view existe
 */
async function checkViewExists(viewName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${viewName}?limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    })
    return response.ok || response.status === 200
  } catch (error) {
    return false
  }
}

/**
 * Verificar estruturas antes da migration
 */
async function checkStructuresBefore() {
  console.log('\n📊 Verificando estruturas ANTES da migration...\n')
  
  const structures = {
    tables: [
      'gf_operator_settings',
      'gf_operator_incidents',
      'gf_operator_documents',
      'gf_operator_audits',
      'driver_locations',
      'driver_messages',
      'driver_positions',
      'passenger_checkins',
      'passenger_cancellations',
      'trip_passengers',
      'vehicle_checklists',
      'gf_vehicle_checklists',
      'gf_vehicle_documents',
      'gf_driver_compensation',
      'gf_carrier_documents'
    ],
    views: [
      'v_operator_dashboard_kpis',
      'v_operator_dashboard_kpis_secure',
      'v_operator_routes',
      'v_operator_routes_secure',
      'v_operator_alerts',
      'v_operator_alerts_secure',
      'v_operator_costs',
      'v_operator_costs_secure',
      'v_operator_assigned_carriers'
    ]
  }
  
  const results = {
    tables: {},
    views: {}
  }
  
  for (const table of structures.tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      })
      results.tables[table] = response.ok || response.status === 200
      console.log(`   ${results.tables[table] ? '✅' : '❌'} ${table}`)
    } catch (error) {
      results.tables[table] = false
      console.log(`   ❌ ${table} - Erro: ${error.message}`)
    }
  }
  
  for (const view of structures.views) {
    const exists = await checkViewExists(view)
    results.views[view] = exists
    console.log(`   ${exists ? '✅' : '❌'} ${view}`)
  }
  
  return results
}

/**
 * Verificar estruturas depois da migration
 */
async function checkStructuresAfter() {
  console.log('\n📊 Verificando estruturas DEPOIS da migration...\n')
  
  const structures = {
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
    ]
  }
  
  const results = {
    tables: {},
    views: {}
  }
  
  for (const table of structures.tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      })
      results.tables[table] = response.ok || response.status === 200
      console.log(`   ${results.tables[table] ? '✅' : '⚠️ '} ${table}`)
    } catch (error) {
      results.tables[table] = false
      console.log(`   ⚠️  ${table} - Não encontrada (pode não existir ainda)`)
    }
  }
  
  for (const view of structures.views) {
    const exists = await checkViewExists(view)
    results.views[view] = exists
    console.log(`   ${exists ? '✅' : '⚠️ '} ${view}`)
  }
  
  return results
}

/**
 * Gerar instruções de aplicação
 */
function generateApplicationInstructions() {
  console.log('\n' + '='.repeat(60))
  console.log('📋 INSTRUÇÕES PARA APLICAÇÃO DAS MIGRATIONS')
  console.log('='.repeat(60))
  console.log('\n⚠️  NOTA: O Supabase não permite execução direta de SQL via API REST por segurança.')
  console.log('   As migrations devem ser aplicadas manualmente via Supabase Dashboard.\n')
  
  for (const fileName of MIGRATIONS_TO_APPLY) {
    console.log(`\n📄 Migration: ${fileName}`)
    console.log(`\n1. Acesse: https://supabase.com/dashboard`)
    console.log(`2. Selecione projeto: vmoxzesvjcfmrebagcwo`)
    console.log(`3. Vá em SQL Editor`)
    console.log(`4. Cole o conteúdo abaixo e execute:`)
    console.log(`\n${'─'.repeat(60)}`)
    console.log(readMigration(fileName))
    console.log(`${'─'.repeat(60)}\n`)
  }
}

/**
 * Testar funcionalidades críticas
 */
async function testCriticalFunctionalities() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 TESTANDO FUNCIONALIDADES CRÍTICAS')
  console.log('='.repeat(60))
  
  // Testar views renomeadas
  const criticalViews = [
    'v_operador_dashboard_kpis_secure',
    'v_operador_routes_secure',
    'v_operador_alerts_secure'
  ]
  
  console.log('\n📊 Testando Views Críticas:\n')
  
  let viewsOk = 0
  for (const viewName of criticalViews) {
    const exists = await checkViewExists(viewName)
    console.log(`   ${exists ? '✅' : '❌'} ${viewName}`)
    if (exists) viewsOk++
  }
  
  // Testar tabelas críticas
  const criticalTables = [
    'gf_operador_settings',
    'gf_operador_incidents'
  ]
  
  console.log('\n📊 Testando Tabelas Críticas:\n')
  
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
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`)
      if (exists) tablesOk++
    } catch (error) {
      console.log(`   ❌ ${tableName} - Erro: ${error.message}`)
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DOS TESTES')
  console.log('='.repeat(60))
  console.log(`\nViews: ${viewsOk}/${criticalViews.length} OK`)
  console.log(`Tabelas: ${tablesOk}/${criticalTables.length} OK`)
  
  if (viewsOk === criticalViews.length && tablesOk === criticalTables.length) {
    console.log('\n✅ Todas as funcionalidades críticas estão funcionando!')
    return true
  } else {
    console.log('\n⚠️  Algumas funcionalidades podem não estar disponíveis ainda.')
    console.log('   Isso é normal se as migrations ainda não foram aplicadas.')
    return false
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando processo de aplicação de migrations...\n')
  
  // Verificar estruturas antes
  const beforeResults = await checkStructuresBefore()
  
  // Gerar instruções
  generateApplicationInstructions()
  
  console.log('\n' + '='.repeat(60))
  console.log('⏳ AGUARDANDO APLICAÇÃO MANUAL DAS MIGRATIONS')
  console.log('='.repeat(60))
  console.log('\n📝 Por favor, aplique as migrations acima no Supabase Dashboard.')
  console.log('   Após aplicar, execute este script novamente para verificar.\n')
  console.log('   Ou pressione ENTER para testar funcionalidades críticas agora...')
  
  // Testar funcionalidades críticas
  await testCriticalFunctionalities()
  
  // Verificar estruturas depois (se migrations foram aplicadas)
  const afterResults = await checkStructuresAfter()
  
  // Comparar resultados
  console.log('\n' + '='.repeat(60))
  console.log('📊 COMPARAÇÃO ANTES/DEPOIS')
  console.log('='.repeat(60))
  
  const beforeTables = Object.values(beforeResults.tables).filter(Boolean).length
  const afterTables = Object.values(afterResults.tables).filter(Boolean).length
  const beforeViews = Object.values(beforeResults.views).filter(Boolean).length
  const afterViews = Object.values(afterResults.views).filter(Boolean).length
  
  console.log(`\nTabelas (antes): ${beforeTables} | (depois): ${afterTables}`)
  console.log(`Views (antes): ${beforeViews} | (depois): ${afterViews}`)
  
  if (afterTables > 0 || afterViews > 0) {
    console.log('\n✅ Migrations parecem ter sido aplicadas!')
  } else {
    console.log('\n⚠️  Migrations ainda não foram aplicadas.')
    console.log('   Siga as instruções acima para aplicar manualmente.')
  }
}

// Executar
main().catch(error => {
  console.error('\n❌ Erro:', error.message)
  process.exit(1)
})

