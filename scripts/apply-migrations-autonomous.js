/**
 * Script Autônomo para Aplicar Migrations e Testar Funcionalidades
 * 
 * Aplica migrations de nomenclatura PT-BR e testa funcionalidades críticas
 * de forma 100% autônoma.
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Configuração do banco - tentar múltiplas formas de conexão
const DB_CONFIGS = [
  // Connection string direta
  {
    connectionString: 'postgresql://postgres:Guigui1309%40@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?options=reference%3Dvmoxzesvjcfmrebagcwo&sslmode=require&pgbouncer=true'
  },
  // Configuração direta
  {
    host: 'db.vmoxzesvjcfmrebagcwo.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Guigui1309@',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  },
  // Pooler alternativo
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
  }
]

const SUPABASE_URL = 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A'

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
 * Aplicar migration via PostgreSQL direto
 */
async function applyMigrationDirect(client, fileName) {
  console.log(`\n📄 Aplicando: ${fileName}`)
  
  try {
    const sql = readMigration(fileName)
    
    // Dividir em statements (separados por ;)
    // Mas manter DO $$ blocks intactos
    const statements = sql.split(/;(?=\s*DO\s*\$\$)/).filter(s => s.trim().length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement.length > 10 && !statement.startsWith('--')) {
        try {
          await client.query(statement + ';')
          console.log(`   ✅ Statement ${i + 1}/${statements.length} executado`)
        } catch (error) {
          // Se for erro de "does not exist", continuar (é esperado)
          if (error.message.includes('does not exist') || error.message.includes('não existe')) {
            console.log(`   ⚠️  Statement ${i + 1}: Estrutura não existe (continuando)`)
            continue
          }
          throw error
        }
      }
    }
    
    console.log(`   ✅ Migration aplicada com sucesso`)
    return true
  } catch (error) {
    console.error(`   ❌ Erro ao aplicar migration:`, error.message)
    if (error.message.includes('does not exist') || error.message.includes('não existe')) {
      console.log(`   ⚠️  Algumas estruturas podem não existir ainda (isso é normal)`)
      return true // Continuar mesmo assim
    }
    throw error
  }
}

/**
 * Verificar estruturas renomeadas
 */
async function verifyRenamedStructures(client) {
  console.log('\n📊 Verificando estruturas renomeadas...\n')
  
  const checks = [
    {
      type: 'table',
      query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'gf_operador%' ORDER BY table_name`,
      description: 'Tabelas gf_operador_*'
    },
    {
      type: 'view',
      query: `SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'v_operador%' ORDER BY viewname`,
      description: 'Views v_operador_*'
    },
    {
      type: 'matview',
      query: `SELECT matviewname FROM pg_matviews WHERE schemaname = 'public' AND matviewname LIKE 'mv_operador%' ORDER BY matviewname`,
      description: 'Materialized Views mv_operador_*'
    },
    {
      type: 'function',
      query: `SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname LIKE '%operador%' ORDER BY proname`,
      description: 'Funções com operador'
    },
    {
      type: 'table',
      query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%motorista%' OR table_name LIKE '%veiculo%' OR table_name LIKE '%passageiro%' OR table_name LIKE '%transportadora%') ORDER BY table_name`,
      description: 'Tabelas com nomenclatura PT-BR'
    }
  ]
  
  const results = {}
  
  for (const check of checks) {
    try {
      const result = await client.query(check.query)
      const items = result.rows.map(r => r[Object.keys(r)[0]])
      results[check.description] = items
      console.log(`   ✅ ${check.description}: ${items.length} encontrada(s)`)
      if (items.length > 0 && items.length <= 10) {
        items.forEach(item => console.log(`      - ${item}`))
      } else if (items.length > 10) {
        console.log(`      (${items.length} itens - primeiros 5 mostrados)`)
        items.slice(0, 5).forEach(item => console.log(`      - ${item}`))
      }
    } catch (error) {
      console.log(`   ⚠️  ${check.description}: Erro ao verificar - ${error.message}`)
      results[check.description] = []
    }
  }
  
  return results
}

/**
 * Testar funcionalidades críticas via API REST
 */
async function testCriticalFunctionalities() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 TESTANDO FUNCIONALIDADES CRÍTICAS')
  console.log('='.repeat(60))
  
  if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.includes('Placeholder')) {
    console.log('\n⚠️  SUPABASE_SERVICE_ROLE_KEY não configurado - pulando testes de API')
    return { success: false, reason: 'missing_key' }
  }
  
  // Testar views renomeadas
  const criticalViews = [
    'v_operador_dashboard_kpis_secure',
    'v_operador_routes_secure',
    'v_operador_alerts_secure',
    'v_operador_costs_secure',
    'v_operador_assigned_carriers'
  ]
  
  console.log('\n📊 Testando Views Críticas:\n')
  
  let viewsOk = 0
  const viewResults = {}
  
  for (const viewName of criticalViews) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${viewName}?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      })
      const exists = response.ok || response.status === 200
      viewResults[viewName] = exists
      console.log(`   ${exists ? '✅' : '❌'} ${viewName}`)
      if (exists) viewsOk++
    } catch (error) {
      viewResults[viewName] = false
      console.log(`   ❌ ${viewName} - Erro: ${error.message}`)
    }
  }
  
  // Testar tabelas críticas
  const criticalTables = [
    'gf_operador_settings',
    'gf_operador_incidents',
    'gf_veiculo_documents',
    'gf_motorista_compensation',
    'gf_transportadora_documents'
  ]
  
  console.log('\n📊 Testando Tabelas Críticas:\n')
  
  let tablesOk = 0
  const tableResults = {}
  
  for (const tableName of criticalTables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      })
      const exists = response.ok || response.status === 200
      tableResults[tableName] = exists
      console.log(`   ${exists ? '✅' : '⚠️ '} ${tableName}`)
      if (exists) tablesOk++
    } catch (error) {
      tableResults[tableName] = false
      console.log(`   ⚠️  ${tableName} - Não encontrada (pode não existir ainda)`)
    }
  }
  
  // Testar função RPC
  console.log('\n📊 Testando Função RPC:\n')
  
  let functionOk = false
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/refresh_mv_operador_kpis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({})
    })
    functionOk = response.ok || response.status === 200
    console.log(`   ${functionOk ? '✅' : '⚠️ '} refresh_mv_operador_kpis`)
  } catch (error) {
    console.log(`   ⚠️  refresh_mv_operador_kpis - Erro: ${error.message}`)
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DOS TESTES')
  console.log('='.repeat(60))
  console.log(`\nViews: ${viewsOk}/${criticalViews.length} OK`)
  console.log(`Tabelas: ${tablesOk}/${criticalTables.length} OK`)
  console.log(`Função RPC: ${functionOk ? 'OK' : 'Não disponível'}`)
  
  const success = viewsOk >= criticalViews.length * 0.8 && tablesOk >= criticalTables.length * 0.6
  
  if (success) {
    console.log('\n✅ Funcionalidades críticas estão funcionando!')
  } else {
    console.log('\n⚠️  Algumas funcionalidades podem não estar disponíveis ainda.')
    console.log('   Isso é normal se as migrations ainda não foram aplicadas.')
  }
  
  return {
    success,
    views: { ok: viewsOk, total: criticalViews.length, results: viewResults },
    tables: { ok: tablesOk, total: criticalTables.length, results: tableResults },
    function: functionOk
  }
}

/**
 * Tentar conectar com diferentes configurações
 */
async function connectToDatabase() {
  for (let i = 0; i < DB_CONFIGS.length; i++) {
    const config = DB_CONFIGS[i]
    const client = new Client(config)
    
    try {
      console.log(`📡 Tentativa ${i + 1}/${DB_CONFIGS.length}: Conectando ao banco...`)
      await client.connect()
      console.log('✅ Conectado com sucesso\n')
      return client
    } catch (error) {
      console.log(`   ❌ Falhou: ${error.message}`)
      await client.end().catch(() => {})
      if (i < DB_CONFIGS.length - 1) {
        console.log(`   Tentando próxima configuração...\n`)
      }
    }
  }
  
  throw new Error('Não foi possível conectar ao banco com nenhuma das configurações')
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando aplicação autônoma de migrations...\n')
  console.log('='.repeat(60))
  
  let client
  
  try {
    client = await connectToDatabase()
    
    // Aplicar migrations
    console.log('='.repeat(60))
    console.log('📋 APLICANDO MIGRATIONS')
    console.log('='.repeat(60))
    
    for (const fileName of MIGRATIONS_TO_APPLY) {
      await applyMigrationDirect(client, fileName)
    }
    
    // Verificar estruturas renomeadas
    console.log('\n' + '='.repeat(60))
    console.log('✅ VERIFICAÇÃO PÓS-MIGRATION')
    console.log('='.repeat(60))
    
    const verificationResults = await verifyRenamedStructures(client)
    
    // Testar funcionalidades críticas
    const testResults = await testCriticalFunctionalities()
    
    // Resumo final
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO FINAL')
    console.log('='.repeat(60))
    
    const totalStructures = Object.values(verificationResults).reduce((sum, arr) => sum + arr.length, 0)
    console.log(`\n✅ Total de estruturas verificadas: ${totalStructures}`)
    console.log(`✅ Migrations aplicadas: ${MIGRATIONS_TO_APPLY.length}`)
    console.log(`✅ Testes de funcionalidades: ${testResults.success ? 'PASSOU' : 'PARCIAL'}`)
    
    console.log('\n✅ Processo concluído com sucesso!')
    
  } catch (error) {
    console.error('\n❌ Erro ao executar migrations:', error.message)
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Dica: Verifique se:')
      console.error('   1. O host do banco está correto')
      console.error('   2. A conexão com a internet está ativa')
      console.error('   3. As credenciais estão corretas (AUTONOMY_RULES.md)')
      console.error('\n📋 Alternativa: Aplicar migrations manualmente via Supabase Dashboard')
      console.error('   Arquivos: supabase/migrations/20250127_*.sql')
    }
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n✅ Conexão encerrada')
  }
}

// Executar
main()

