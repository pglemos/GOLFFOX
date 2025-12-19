/**
 * Script para Aplicar Migrations Diretamente no Supabase
 * 
 * Usa a conexão direta do Supabase via PostgreSQL
 * 
 * Uso:
 *   node scripts/apply-migrations-direct.js
 * 
 * Requisitos:
 *   - DATABASE_URL ou SUPABASE_DB_URL configurado
 *   - Ou NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Tentar carregar .env
const envPaths = [
  path.join(__dirname, '..', 'apps', 'web', '.env.local'),
  path.join(__dirname, '..', 'apps', 'web', '.env'),
  path.join(__dirname, '..', '.env.local'),
  path.join(__dirname, '..', '.env')
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath })
    break
  }
}

// Construir DATABASE_URL
let DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!DATABASE_URL) {
  // Tentar construir a partir de NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (supabaseUrl && serviceKey) {
    // Extrair project ref da URL
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
    if (match) {
      const projectRef = match[1]
      // Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
      // Nota: Precisa da senha do banco, não do service key
      console.warn('⚠️  DATABASE_URL não encontrado. Configure DATABASE_URL ou SUPABASE_DB_URL')
      console.warn('   Formato esperado: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres')
    }
  }
  
  if (!DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL ou SUPABASE_DB_URL não configurado')
    console.error('\nOpções:')
    console.error('1. Configure DATABASE_URL no .env.local')
    console.error('2. Configure SUPABASE_DB_URL no .env.local')
    console.error('3. Ou use Supabase Dashboard para aplicar manualmente')
    console.error('\nVer: docs/MIGRATION_INSTRUCTIONS.md')
    process.exit(1)
  }
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

// Migrations a aplicar
const MIGRATIONS_TO_APPLY = [
  '20250115_event_store.sql',
  '20250116_missing_tables.sql'
]

/**
 * Executar migration
 */
async function applyMigration(client, fileName) {
  const filePath = path.join(MIGRATIONS_DIR, fileName)
  
  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ Arquivo não encontrado: ${filePath}`)
    return { status: 'error', reason: 'file_not_found' }
  }

  console.log(`\n📄 Aplicando: ${fileName}`)
  const sql = fs.readFileSync(filePath, 'utf8')
  const start = Date.now()

  try {
    await client.query(sql)
    const duration = Date.now() - start
    console.log(`   ✅ Sucesso (${duration}ms)`)
    return { status: 'applied', duration }
  } catch (error) {
    const msg = error.message.toLowerCase()
    
    // Erros idempotentes (já existe)
    if (msg.includes('already exists') || 
        msg.includes('duplicate') ||
        msg.includes('relation already exists')) {
      console.log(`   ⚠️  Já aplicada (${error.message.split('\n')[0]})`)
      return { status: 'skipped', reason: 'already_exists' }
    }

    console.error(`   ❌ Erro: ${error.message}`)
    return { status: 'error', reason: error.message }
  }
}

/**
 * Verificar resultado
 */
async function verifyMigration(client) {
  const tables = [
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log'
  ]

  console.log('\n🔍 Verificando tabelas...\n')

  const { rows } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = ANY($1::text[])
    ORDER BY table_name
  `, [tables])

  const found = rows.map(r => r.table_name)
  
  tables.forEach(table => {
    const status = found.includes(table) ? '✅' : '❌'
    console.log(`   ${status} ${table}`)
  })

  return found.length === tables.length
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Aplicando Migrations no Supabase\n')
  console.log(`📂 Migrations: ${MIGRATIONS_TO_APPLY.length}\n`)

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    console.log('✅ Conectado ao banco!\n')

    const results = []
    
    for (const migration of MIGRATIONS_TO_APPLY) {
      const result = await applyMigration(client, migration)
      results.push({ migration, ...result })
    }

    // Verificar
    const allOk = await verifyMigration(client)

    // Resumo
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO')
    console.log('='.repeat(60) + '\n')
    
    const applied = results.filter(r => r.status === 'applied').length
    const skipped = results.filter(r => r.status === 'skipped').length
    const errors = results.filter(r => r.status === 'error').length

    console.log(`✅ Aplicadas: ${applied}`)
    console.log(`⏭️  Puladas: ${skipped}`)
    console.log(`❌ Erros: ${errors}`)
    console.log(`\n🔍 Verificação: ${allOk ? '✅ Todas as tabelas criadas' : '⚠️  Algumas tabelas faltando'}`)

    if (errors > 0) {
      console.log('\n❌ Erros encontrados:')
      results.filter(r => r.status === 'error').forEach(r => {
        console.log(`   - ${r.migration}: ${r.reason}`)
      })
      process.exitCode = 1
    } else if (allOk) {
      console.log('\n🎉 Migrations aplicadas com sucesso!')
    }

  } catch (error) {
    console.error('\n💥 Erro fatal:', error.message)
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Dica: Verifique se DATABASE_URL está correto')
      console.error('   Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres')
    }
    process.exitCode = 1
  } finally {
    await client.end()
    console.log('\n🔌 Conexão encerrada')
  }
}

if (require.main === module) {
  main()
}

module.exports = { main, applyMigration }
