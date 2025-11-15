/**
 * Script: Aplicar migrações essenciais no Supabase (admin core + RLS)
 * - Executa v43_admin_core.sql e v43_admin_rls.sql
 * - (Opcional) Executa gf_operator_tables.sql e v43_operator_rls_complete.sql se existirem
 * - Força reload do schema cache via pg_notify
 * - Valida existência de tabelas críticas (gf_incidents, gf_service_requests)
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/apply-supabase-core.js
 *   ou configure SUPABASE_DB_URL em .env.local / .env
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Tenta carregar variáveis de ambiente locais
try {
  const envLocal = path.join(__dirname, '..', '.env.local')
  const env = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envLocal)) {
    require('dotenv').config({ path: envLocal })
  } else if (fs.existsSync(env)) {
    require('dotenv').config({ path: env })
  }
} catch (_) {}

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

const MIGRATIONS = [
  { file: 'v43_admin_core.sql', required: true },
  { file: 'v43_admin_rls.sql', required: true },
  { file: 'gf_operator_tables.sql', required: false },
  { file: 'v43_operator_rls_complete.sql', required: false },
]

async function execFile(client, migrationsDir, file, required) {
  const fullPath = path.join(migrationsDir, file)
  if (!fs.existsSync(fullPath)) {
    const msg = `Arquivo não encontrado: ${fullPath}`
    if (required) throw new Error(msg)
    console.log(`⚠️  ${msg} (opcional, ignorado)`)
    return { status: 'skipped', file }
  }

  console.log(`📄 Lendo: ${file}`)
  const sql = fs.readFileSync(fullPath, 'utf8')
  const start = Date.now()
  try {
    await client.query(sql)
    const duration = Date.now() - start
    console.log(`✅ Executado: ${file} (${duration}ms)\n`)
    return { status: 'applied', file, duration }
  } catch (error) {
    const msg = (error.message || '').toLowerCase()
    const isIdempotent =
      msg.includes('already exists') ||
      msg.includes('duplicate') ||
      msg.includes('relation already exists') ||
      msg.includes('constraint already exists') ||
      msg.includes('function already exists') ||
      msg.includes('index already exists') ||
      msg.includes('view already exists') ||
      msg.includes('policy') && msg.includes('already')

    if (isIdempotent) {
      console.log(`⚠️  Já aplicado (ignorado): ${file}\n`)
      return { status: 'skipped', file, reason: 'already_exists' }
    }

    console.error(`❌ Erro ao executar ${file}: ${error.message}`)
    if (required) throw error
    console.log('   Continuando com próximas migrations...\n')
    return { status: 'failed', file, reason: error.message }
  }
}

async function validateTables(client) {
  const checks = ['gf_incidents', 'gf_service_requests']
  const result = {}
  for (const t of checks) {
    const q = await client.query(
      `SELECT CASE WHEN to_regclass('public.${t}') IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status`
    )
    result[t] = q.rows[0].status
  }
  return result
}

async function main() {
  console.log('🔌 Conectando ao Supabase...')
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('✅ Conectado!\n')

  const migrationsDir = path.join(__dirname, '..', '..', 'database', 'migrations')
  const summary = { applied: [], skipped: [], failed: [] }

  try {
    for (const m of MIGRATIONS) {
      const r = await execFile(client, migrationsDir, m.file, m.required)
      summary[r.status]?.push(r)
    }

    console.log('🔁 Forçando reload do schema cache (pg_notify)...')
    try {
      await client.query(`select pg_notify('pgrst','reload schema');`)
      console.log('✅ Schema cache recarregado!\n')
    } catch (err) {
      console.warn('⚠️  Falha ao notificar reload de schema:', err.message)
    }

    console.log('🔎 Validando tabelas críticas...')
    const tables = await validateTables(client)
    Object.entries(tables).forEach(([k, v]) => {
      console.log(`   ${k}: ${v}`)
    })

    const allOk = Object.values(tables).every((s) => s === 'EXISTS')
    console.log('\n📊 Resumo:')
    console.log(`   ✅ Aplicadas: ${summary.applied.length}`)
    console.log(`   ⏭️  Ignoradas: ${summary.skipped.length}`)
    console.log(`   ❌ Falhadas: ${summary.failed.length}`)

    if (!allOk) {
      console.log('\n⚠️  Algumas tabelas ainda estão ausentes. Verifique o log acima.')
      process.exitCode = 2
    } else {
      console.log('\n🎉 Tudo certo! Migrações essenciais aplicadas e validadas.')
    }
  } catch (fatal) {
    console.error('\n💥 Erro fatal durante migrações:', fatal.message)
    process.exitCode = 1
  } finally {
    await client.end()
    console.log('🔌 Conexão encerrada')
  }
}

main()

