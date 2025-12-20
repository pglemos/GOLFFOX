/**
 * Script para Aplicar Migrations Statement por Statement
 * 
 * PgBouncer não suporta blocos DO $$, então executamos cada ALTER TABLE diretamente
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Usar pooler (porta 6543) - funciona mas não suporta DO $$, então executamos comandos diretos
const DB_CONFIG = {
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543, // Pooler
  database: 'postgres',
  user: 'postgres.vmoxzesvjcfmrebagcwo',
  password: 'Guigui1309@',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

/**
 * Extrair statements individuais de blocos DO $$
 */
function extractStatements(sql) {
  const statements = []
  
  // Encontrar todos os blocos DO $$
  const doBlockRegex = /DO\s+\$\$\s*BEGIN\s*([\s\S]*?)\s*END\s*;\s*\$\$/gi
  let match
  
  while ((match = doBlockRegex.exec(sql)) !== null) {
    const blockContent = match[1]
    
    // Extrair comandos ALTER TABLE, CREATE VIEW, etc. do bloco
    const alterTableRegex = /ALTER\s+TABLE\s+[^;]+;/gi
    const createViewRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+[^;]+;/gi
    const dropViewRegex = /DROP\s+VIEW\s+[^;]+;/gi
    const createFunctionRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+[^;]+;/gi
    const dropFunctionRegex = /DROP\s+FUNCTION\s+[^;]+;/gi
    
    // Extrair ALTER TABLE statements
    let alterMatch
    while ((alterMatch = alterTableRegex.exec(blockContent)) !== null) {
      statements.push(alterMatch[0].trim())
    }
    
    // Extrair CREATE VIEW statements
    let createMatch
    while ((createMatch = createViewRegex.exec(blockContent)) !== null) {
      statements.push(createMatch[0].trim())
    }
    
    // Extrair DROP VIEW statements
    let dropMatch
    while ((dropMatch = dropViewRegex.exec(blockContent)) !== null) {
      statements.push(dropMatch[0].trim())
    }
    
    // Extrair CREATE FUNCTION statements
    let funcMatch
    while ((funcMatch = createFunctionRegex.exec(blockContent)) !== null) {
      statements.push(funcMatch[0].trim())
    }
    
    // Extrair DROP FUNCTION statements
    let dropFuncMatch
    while ((dropFuncMatch = dropFunctionRegex.exec(blockContent)) !== null) {
      statements.push(dropFuncMatch[0].trim())
    }
  }
  
  // Se não encontrou blocos DO, tentar extrair statements diretos
  if (statements.length === 0) {
    const directStatements = sql.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    statements.push(...directStatements)
  }
  
  return statements
}

/**
 * Executar renomeação direta (sem DO block)
 */
async function renameTableDirect(client, oldName, newName) {
  try {
    // Verificar se existe
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )
    `, [oldName])
    
    if (!checkResult.rows[0].exists) {
      console.log(`   ⚠️  ${oldName} não existe, pulando...`)
      return false
    }
    
    // Renomear
    await client.query(`ALTER TABLE public.${oldName} RENAME TO ${newName}`)
    console.log(`   ✅ ${oldName} → ${newName}`)
    return true
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log(`   ⚠️  ${oldName} não existe, pulando...`)
      return false
    }
    throw error
  }
}

/**
 * Renomear view (recriar com novo nome)
 */
async function renameViewDirect(client, oldName, newName) {
  try {
    // Verificar se existe
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = $1
      )
    `, [oldName])
    
    if (!checkResult.rows[0].exists) {
      console.log(`   ⚠️  ${oldName} não existe, pulando...`)
      return false
    }
    
    // Obter definição
    const defResult = await client.query(`SELECT pg_get_viewdef('public.${oldName}', true) as definition`)
    const definition = defResult.rows[0].definition
    
    // Criar nova view
    await client.query(`CREATE OR REPLACE VIEW public.${newName} AS ${definition}`)
    
    // Dropar view antiga (usar CASCADE para remover dependências)
    await client.query(`DROP VIEW IF EXISTS public.${oldName} CASCADE`)
    
    console.log(`   ✅ ${oldName} → ${newName}`)
    return true
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log(`   ⚠️  ${oldName} não existe, pulando...`)
      return false
    }
    throw error
  }
}

/**
 * Aplicar migration 1: operator → operador
 */
async function applyMigration1(client) {
  console.log('\n📄 Aplicando Migration 1: operator → operador\n')
  
  // Renomear tabelas
  const tables = [
    ['gf_operator_settings', 'gf_operador_settings'],
    ['gf_operator_incidents', 'gf_operador_incidents'],
    ['gf_operator_documents', 'gf_operador_documents'],
    ['gf_operator_audits', 'gf_operador_audits']
  ]
  
  for (const [oldName, newName] of tables) {
    await renameTableDirect(client, oldName, newName)
  }
  
  // Renomear views (precisa recriar)
  const views = [
    ['v_operator_dashboard_kpis', 'v_operador_dashboard_kpis'],
    ['v_operator_dashboard_kpis_secure', 'v_operador_dashboard_kpis_secure'],
    ['v_operator_routes', 'v_operador_routes'],
    ['v_operator_routes_secure', 'v_operador_routes_secure'],
    ['v_operator_alerts', 'v_operador_alerts'],
    ['v_operator_alerts_secure', 'v_operador_alerts_secure'],
    ['v_operator_costs', 'v_operador_costs'],
    ['v_operator_costs_secure', 'v_operador_costs_secure'],
    ['v_operator_assigned_carriers', 'v_operador_assigned_carriers']
  ]
  
  for (const [oldName, newName] of views) {
    await renameViewDirect(client, oldName, newName)
  }
  
  console.log('\n   ✅ Migration 1 aplicada')
}

/**
 * Aplicar migration 2: tabelas em inglês → português
 */
async function applyMigration2(client) {
  console.log('\n📄 Aplicando Migration 2: tabelas em inglês → português\n')
  
  // Renomear tabelas driver → motorista
  const driverTables = [
    ['driver_locations', 'motorista_locations'],
    ['driver_messages', 'motorista_messages'],
    ['driver_positions', 'motorista_positions']
  ]
  
  for (const [oldName, newName] of driverTables) {
    await renameTableDirect(client, oldName, newName)
  }
  
  // Renomear tabelas passenger → passageiro
  const passengerTables = [
    ['passenger_checkins', 'passageiro_checkins'],
    ['passenger_cancellations', 'passageiro_cancellations'],
    ['trip_passengers', 'trip_passageiros']
  ]
  
  for (const [oldName, newName] of passengerTables) {
    await renameTableDirect(client, oldName, newName)
  }
  
  // Renomear tabelas vehicle → veiculo
  const vehicleTables = [
    ['vehicle_checklists', 'veiculo_checklists'],
    ['gf_vehicle_checklists', 'gf_veiculo_checklists'],
    ['gf_vehicle_documents', 'gf_veiculo_documents']
  ]
  
  for (const [oldName, newName] of vehicleTables) {
    await renameTableDirect(client, oldName, newName)
  }
  
  // Renomear outras tabelas
  const otherTables = [
    ['gf_driver_compensation', 'gf_motorista_compensation'],
    ['gf_carrier_documents', 'gf_transportadora_documents']
  ]
  
  for (const [oldName, newName] of otherTables) {
    await renameTableDirect(client, oldName, newName)
  }
  
  console.log('\n   ✅ Migration 2 aplicada')
}

/**
 * Verificar resultado final
 */
async function verifyFinalState(client) {
  console.log('\n' + '='.repeat(60))
  console.log('✅ VERIFICAÇÃO FINAL')
  console.log('='.repeat(60))
  
  const checks = [
    { type: 'table', name: 'gf_operador_settings', description: 'Tabela operador settings' },
    { type: 'table', name: 'gf_operador_incidents', description: 'Tabela operador incidents' },
    { type: 'table', name: 'motorista_locations', description: 'Tabela motorista locations' },
    { type: 'table', name: 'gf_veiculo_documents', description: 'Tabela veiculo documents' },
    { type: 'view', name: 'v_operador_dashboard_kpis_secure', description: 'View operador KPIs secure' }
  ]
  
  let successCount = 0
  
  for (const check of checks) {
    try {
      let query
      if (check.type === 'table') {
        query = `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`
      } else {
        query = `SELECT EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = $1)`
      }
      
      const result = await client.query(query, [check.name])
      const exists = result.rows[0].exists
      
      if (exists) {
        console.log(`   ✅ ${check.name} - ${check.description} - EXISTE`)
        successCount++
      } else {
        console.log(`   ⚠️  ${check.name} - ${check.description} - NÃO EXISTE`)
      }
    } catch (error) {
      console.log(`   ❌ ${check.name} - Erro: ${error.message}`)
    }
  }
  
  console.log(`\n✅ Estruturas verificadas: ${successCount}/${checks.length}`)
  
  return successCount === checks.length
}

/**
 * Função principal
 */
async function main() {
  const client = new Client(DB_CONFIG)
  
  try {
    console.log('🚀 Conectando ao banco de dados...')
    await client.connect()
    console.log('✅ Conectado com sucesso\n')
    
    console.log('='.repeat(60))
    console.log('📋 APLICANDO MIGRATIONS')
    console.log('='.repeat(60))
    
    // Aplicar migrations
    await applyMigration1(client)
    await applyMigration2(client)
    
    // Verificar resultado
    const allOk = await verifyFinalState(client)
    
    if (allOk) {
      console.log('\n✅ Todas as migrations foram aplicadas com sucesso!')
    } else {
      console.log('\n⚠️  Migrations aplicadas, mas algumas estruturas podem não existir ainda.')
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    if (error.stack) {
      console.error('\nStack:', error.stack.substring(0, 500))
    }
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n✅ Conexão encerrada')
  }
}

main()

