const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Tenta carregar env local
try {
  const envLocal = path.join(__dirname, '..', '..', 'web-app', '.env.local')
  if (fs.existsSync(envLocal)) {
    require('dotenv').config({ path: envLocal })
  }
} catch (_) {}

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    console.log('🔌 Conectando ao banco...')
    await client.connect()
    console.log('✅ Conectado')

    const sqlPath = path.join(__dirname, 'create_web_vitals_table.sql')
    if (!fs.existsSync(sqlPath)) {
      throw new Error('Arquivo SQL não encontrado: ' + sqlPath)
    }
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('📝 Executando criação da tabela gf_web_vitals...')
    await client.query(sql)
    console.log('✅ Tabela criada (ou já existia)')

    // Forçar reload do schema cache do PostgREST
    try {
      await client.query(`select pg_notify('pgrst','reload schema');`)
      console.log('🔁 Schema cache recarregado')
    } catch (err) {
      console.warn('⚠️ Falha ao recarregar schema cache:', err.message)
    }

    // Validação
    const check = await client.query(`select to_regclass('public.gf_web_vitals') as reg`)
    if (!check.rows[0].reg) {
      throw new Error('Tabela gf_web_vitals não encontrada após migração')
    }
    console.log('🎯 Validação OK: gf_web_vitals existe')
  } catch (err) {
    console.error('❌ Erro ao criar gf_web_vitals:', err.message)
    process.exitCode = 1
  } finally {
    await client.end()
    console.log('🔌 Conexão encerrada')
  }
}

main()

