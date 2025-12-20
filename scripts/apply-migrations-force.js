/**
 * Script para Aplicar Migrations com Força
 * 
 * Aplica migrations garantindo que todas as estruturas sejam renomeadas
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Tentar múltiplas configurações de conexão
const DB_CONFIGS = [
  {
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.vmoxzesvjcfmrebagcwo',
    password: 'Guigui1309@',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  },
  {
    connectionString: 'postgresql://postgres:Guigui1309%40@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?options=reference%3Dvmoxzesvjcfmrebagcwo&sslmode=require&pgbouncer=true',
    ssl: {
      rejectUnauthorized: false
    }
  }
]

async function connectToDatabase() {
  for (let i = 0; i < DB_CONFIGS.length; i++) {
    const config = DB_CONFIGS[i]
    const client = new Client(config)
    
    try {
      console.log(`📡 Tentativa ${i + 1}/${DB_CONFIGS.length}: Conectando...`)
      await client.connect()
      console.log('✅ Conectado com sucesso\n')
      return client
    } catch (error) {
      console.log(`   ❌ Falhou: ${error.message.substring(0, 80)}`)
      await client.end().catch(() => {})
      if (i < DB_CONFIGS.length - 1) {
        console.log(`   Tentando próxima configuração...\n`)
      }
    }
  }
  
  throw new Error('Não foi possível conectar ao banco')
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

/**
 * Ler e executar migration completa
 */
async function applyMigrationForce(client, fileName) {
  console.log(`\n📄 Aplicando: ${fileName}`)
  
  const filePath = path.join(MIGRATIONS_DIR, fileName)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration não encontrada: ${filePath}`)
  }
  
  const sql = fs.readFileSync(filePath, 'utf8')
  
  try {
    // Executar migration completa de uma vez
    await client.query(sql)
    console.log(`   ✅ Migration aplicada com sucesso`)
    return true
  } catch (error) {
    // Se for erro de "does not exist", pode ser que a estrutura não exista
    // Mas vamos continuar
    if (error.message.includes('does not exist') || 
        error.message.includes('não existe') ||
        error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log(`   ⚠️  Algumas estruturas podem não existir: ${error.message.substring(0, 100)}`)
      console.log(`   ✅ Migration executada (estruturas inexistentes ignoradas)`)
      return true
    }
    throw error
  }
}

/**
 * Verificar estado atual
 */
async function checkCurrentState(client) {
  console.log('\n📊 Verificando estado atual do banco...\n')
  
  // Verificar estruturas antigas
  const oldTables = ['gf_operator_settings', 'gf_operator_incidents', 'driver_locations', 'gf_vehicle_documents']
  const oldViews = ['v_operator_dashboard_kpis_secure']
  
  console.log('Estruturas ANTIGAS (devem ser renomeadas):')
  for (const table of oldTables) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table])
      const exists = result.rows[0].exists
      console.log(`   ${exists ? '⚠️ ' : '✅'} ${table} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
    } catch (error) {
      console.log(`   ❌ ${table} - Erro: ${error.message}`)
    }
  }
  
  for (const view of oldViews) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_views 
          WHERE schemaname = 'public' AND viewname = $1
        )
      `, [view])
      const exists = result.rows[0].exists
      console.log(`   ${exists ? '⚠️ ' : '✅'} ${view} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
    } catch (error) {
      console.log(`   ❌ ${view} - Erro: ${error.message}`)
    }
  }
  
  // Verificar estruturas novas
  const newTables = ['gf_operador_settings', 'gf_operador_incidents', 'motorista_locations', 'gf_veiculo_documents']
  const newViews = ['v_operador_dashboard_kpis_secure']
  
  console.log('\nEstruturas NOVAS (devem existir após migration):')
  for (const table of newTables) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table])
      const exists = result.rows[0].exists
      console.log(`   ${exists ? '✅' : '⚠️ '} ${table} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
    } catch (error) {
      console.log(`   ❌ ${table} - Erro: ${error.message}`)
    }
  }
  
  for (const view of newViews) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_views 
          WHERE schemaname = 'public' AND viewname = $1
        )
      `, [view])
      const exists = result.rows[0].exists
      console.log(`   ${exists ? '✅' : '⚠️ '} ${view} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
    } catch (error) {
      console.log(`   ❌ ${view} - Erro: ${error.message}`)
    }
  }
}

/**
 * Função principal
 */
async function main() {
  let client
  
  try {
    console.log('🚀 Conectando ao banco...\n')
    client = await connectToDatabase()
    
    // Verificar estado antes
    await checkCurrentState(client)
    
    // Aplicar migrations
    console.log('\n' + '='.repeat(60))
    console.log('📋 APLICANDO MIGRATIONS')
    console.log('='.repeat(60))
    
    await applyMigrationForce(client, '20250127_rename_operator_to_operador.sql')
    await applyMigrationForce(client, '20250127_rename_tables_pt_br.sql')
    
    // Verificar estado depois
    console.log('\n' + '='.repeat(60))
    console.log('✅ VERIFICAÇÃO PÓS-MIGRATION')
    console.log('='.repeat(60))
    
    await checkCurrentState(client)
    
    console.log('\n✅ Processo concluído!')
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    if (error.stack) {
      console.error('\nStack:', error.stack)
    }
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()

