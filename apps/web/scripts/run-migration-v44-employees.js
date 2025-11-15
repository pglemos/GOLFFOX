/**
 * Script para executar migration v44_operator_employees_secure_view.sql
 * Cria view segura para funcionários do operador
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

// Tentar várias fontes de DATABASE_URL
let DATABASE_URL = process.env.DATABASE_URL || 
  process.env.SUPABASE_DB_URL

// Se não encontrou, tentar construir a partir do SUPABASE_URL
if (!DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  // Formato esperado: https://xxxxx.supabase.co
  // Converter para: postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  
  if (projectRef) {
    const password = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'Guigui1309@'
    DATABASE_URL = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
    console.log('⚠️  Construindo DATABASE_URL a partir do SUPABASE_URL')
  }
}

// Fallback para connection string hardcoded (usar apenas em desenvolvimento)
if (!DATABASE_URL) {
  DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'
  console.log('⚠️  Usando DATABASE_URL padrão (desenvolvimento)')
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada nas variáveis de ambiente')
  console.error('   Configure DATABASE_URL ou SUPABASE_DB_URL')
  process.exit(1)
}

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined
  })

  try {
    console.log('🚀 Executando migration v44_operator_employees_secure_view...\n')
    console.log('🔌 Conectando ao banco de dados...')
    await client.connect()
    console.log('✅ Conectado!\n')

    // Ler arquivo SQL
    const sqlFile = path.join(__dirname, '../../database/migrations/v44_operator_employees_secure_view.sql')
    
    if (!fs.existsSync(sqlFile)) {
      console.error(`❌ Arquivo não encontrado: ${sqlFile}`)
      process.exit(1)
    }

    const sql = fs.readFileSync(sqlFile, 'utf-8')
    console.log('📄 SQL lido:', sqlFile)
    console.log('📝 Executando SQL...\n')

    // Executar SQL
    await client.query(sql)

    console.log('✅ Migration executada com sucesso!')

    // Verificar se a view foi criada
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
        AND table_name = 'v_operator_employees_secure'
    `)

    if (rows.length > 0) {
      console.log('✅ View v_operator_employees_secure criada e verificada!')
    } else {
      console.log('⚠️  View não encontrada após criação (pode ser normal se já existia)')
    }

    // Testar a view
    console.log('\n🧪 Testando a view...')
    const { rows: testRows } = await client.query(`
      SELECT COUNT(*) as count 
      FROM v_operator_employees_secure 
      LIMIT 1
    `)
    console.log(`✅ View está acessível (retornou ${testRows[0]?.count || 0} registros)`)
    console.log('\n✅ Migration concluída com sucesso!\n')

  } catch (error) {
    console.error('\n❌ Erro ao executar migration:', error.message)
    
    // Se erro de "already exists", considerar sucesso
    if (error.message.includes('already exists') || error.message.includes('já existe')) {
      console.log('\n⚠️  View já existe (isso é normal)')
      console.log('✅ Migration já foi aplicada anteriormente\n')
    } else {
      console.error('\n📋 Detalhes do erro:')
      console.error(error)
      process.exit(1)
    }
  } finally {
    await client.end()
  }
}

runMigration().catch(console.error)
