/**
 * Script para Aplicar Migrations no Supabase
 * 
 * Aplica as migrations pendentes diretamente no banco Supabase
 * usando conexão PostgreSQL
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') })

// Configuração
const DATABASE_URL = 
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL 
    ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'postgresql://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres')
    : null)

if (!DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL ou SUPABASE_DB_URL não configurado')
  console.error('   Configure no .env.local ou passe como variável de ambiente')
  process.exit(1)
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

// Migrations pendentes (novas)
const PENDING_MIGRATIONS = [
  '20250115_event_store.sql',
  '20250116_missing_tables.sql'
]

/**
 * Executar migration
 */
async function executeMigration(client, filePath, fileName) {
  console.log(`\n📄 Aplicando: ${fileName}`)
  
  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ Arquivo não encontrado: ${filePath}`)
    return { status: 'error', reason: 'file_not_found' }
  }

  const sql = fs.readFileSync(filePath, 'utf8')
  const start = Date.now()

  try {
    await client.query(sql)
    const duration = Date.now() - start
    console.log(`   ✅ Aplicada com sucesso (${duration}ms)`)
    return { status: 'applied', duration }
  } catch (error) {
    const msg = (error.message || '').toLowerCase()
    
    // Verificar se é erro de "já existe" (idempotente)
    const isIdempotent =
      msg.includes('already exists') ||
      msg.includes('duplicate') ||
      msg.includes('relation already exists') ||
      msg.includes('constraint already exists') ||
      msg.includes('function already exists') ||
      msg.includes('index already exists') ||
      msg.includes('view already exists') ||
      (msg.includes('policy') && msg.includes('already'))

    if (isIdempotent) {
      console.log(`   ⚠️  Já aplicada (ignorado: ${error.message.split('\n')[0]})`)
      return { status: 'skipped', reason: 'already_exists' }
    }

    console.error(`   ❌ Erro: ${error.message}`)
    return { status: 'error', reason: error.message }
  }
}

/**
 * Verificar tabelas criadas
 */
async function verifyTables(client) {
  const expectedTables = [
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log'
  ]

  console.log('\n🔍 Verificando tabelas criadas...\n')

  const { rows } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = ANY($1::text[])
    ORDER BY table_name
  `, [expectedTables])

  const found = rows.map(r => r.table_name)
  const missing = expectedTables.filter(t => !found.includes(t))

  expectedTables.forEach(table => {
    if (found.includes(table)) {
      console.log(`   ✅ ${table}`)
    } else {
      console.log(`   ❌ ${table} (não encontrada)`)
    }
  })

  return { found, missing }
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Aplicando Migrations no Supabase\n')
  console.log(`📂 Diretório: ${MIGRATIONS_DIR}\n`)

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    console.log('✅ Conectado ao Supabase!\n')

    const summary = { applied: [], skipped: [], errors: [] }

    // Aplicar migrations pendentes
    for (const fileName of PENDING_MIGRATIONS) {
      const filePath = path.join(MIGRATIONS_DIR, fileName)
      const result = await executeMigration(client, filePath, fileName)
      
      summary[result.status === 'applied' ? 'applied' : result.status === 'skipped' ? 'skipped' : 'errors'].push({
        file: fileName,
        ...result
      })
    }

    // Verificar tabelas
    const verification = await verifyTables(client)

    // Resumo
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO')
    console.log('='.repeat(60) + '\n')
    console.log(`✅ Aplicadas: ${summary.applied.length}`)
    console.log(`⏭️  Puladas (já existiam): ${summary.skipped.length}`)
    console.log(`❌ Erros: ${summary.errors.length}`)
    console.log(`\n📋 Tabelas encontradas: ${verification.found.length}/${verification.found.length + verification.missing.length}`)

    if (verification.missing.length > 0) {
      console.log(`\n⚠️  Tabelas faltando: ${verification.missing.join(', ')}`)
    }

    if (summary.errors.length > 0) {
      console.log('\n❌ Erros encontrados:')
      summary.errors.forEach(e => {
        console.log(`   - ${e.file}: ${e.reason}`)
      })
      process.exitCode = 1
    } else {
      console.log('\n🎉 Todas as migrations foram aplicadas com sucesso!')
    }

  } catch (error) {
    console.error('\n💥 Erro fatal:', error.message)
    process.exitCode = 1
  } finally {
    await client.end()
    console.log('\n🔌 Conexão encerrada')
  }
}

// Executar
if (require.main === module) {
  main().catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })
}

module.exports = { main, executeMigration, verifyTables }
