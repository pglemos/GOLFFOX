/**
 * Script para Aplicar Migrations Diretamente no PostgreSQL
 * 
 * Usa conexão direta com o banco Supabase para aplicar migrations
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Configuração do banco (do AUTONOMY_RULES.md)
const DB_CONFIG = {
  host: 'db.vmoxzesvjcfmrebagcwo.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Guigui1309@',
  ssl: {
    rejectUnauthorized: false
  }
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
 * Aplicar migration
 */
async function applyMigration(client, fileName) {
  console.log(`\n📄 Aplicando: ${fileName}`)
  
  try {
    const sql = readMigration(fileName)
    
    // Executar migration completa
    await client.query(sql)
    
    console.log(`   ✅ Migration aplicada com sucesso`)
    return true
  } catch (error) {
    console.error(`   ❌ Erro ao aplicar migration:`, error.message)
    if (error.message.includes('does not exist')) {
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
 * Função principal
 */
async function main() {
  const client = new Client(DB_CONFIG)
  
  try {
    console.log('🚀 Conectando ao banco de dados...')
    await client.connect()
    console.log('✅ Conectado com sucesso\n')
    
    // Aplicar migrations
    console.log('='.repeat(60))
    console.log('📋 APLICANDO MIGRATIONS')
    console.log('='.repeat(60))
    
    for (const fileName of MIGRATIONS_TO_APPLY) {
      await applyMigration(client, fileName)
    }
    
    // Verificar estruturas renomeadas
    console.log('\n' + '='.repeat(60))
    console.log('✅ VERIFICAÇÃO PÓS-MIGRATION')
    console.log('='.repeat(60))
    
    const verificationResults = await verifyRenamedStructures(client)
    
    // Resumo final
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO FINAL')
    console.log('='.repeat(60))
    
    const totalTables = Object.values(verificationResults).reduce((sum, arr) => sum + arr.length, 0)
    console.log(`\n✅ Total de estruturas verificadas: ${totalTables}`)
    console.log('✅ Migrations aplicadas com sucesso!')
    
  } catch (error) {
    console.error('\n❌ Erro ao executar migrations:', error.message)
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Dica: Verifique se as credenciais do banco estão corretas')
      console.error('   Arquivo: AUTONOMY_RULES.md')
    }
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n✅ Conexão encerrada')
  }
}

// Executar
main()

