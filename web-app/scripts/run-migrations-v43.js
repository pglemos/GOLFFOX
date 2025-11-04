const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

const migrations = [
  'v43_gf_user_company_map.sql',
  'v43_company_ownership_function.sql',
  'v43_company_branding.sql',
  'v43_operator_rls_complete.sql',
  'v43_operator_secure_views.sql',
  'v43_operator_kpi_matviews.sql',
  'v43_route_optimization_cache.sql',
  'v43_report_scheduling.sql'
]

async function runMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔌 Conectando ao banco de dados...')
    await client.connect()
    console.log('✅ Conectado!\n')

    const migrationsDir = path.join(__dirname, '..', '..', 'database', 'migrations')

    for (let i = 0; i < migrations.length; i++) {
      const migrationFile = migrations[i]
      const migrationPath = path.join(migrationsDir, migrationFile)

      if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Arquivo não encontrado: ${migrationPath}`)
        continue
      }

      console.log(`📦 Executando migration ${i + 1}/${migrations.length}: ${migrationFile}`)
      
      const sql = fs.readFileSync(migrationPath, 'utf8')
      
      try {
        await client.query(sql)
        console.log(`✅ Migration executada com sucesso: ${migrationFile}\n`)
      } catch (error) {
        // Ignorar erros de "já existe" (idempotência)
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  Migration já existe (ignorado): ${migrationFile}\n`)
        } else {
          console.error(`❌ Erro ao executar ${migrationFile}:`, error.message)
          throw error
        }
      }
    }

    console.log('✅ Todas as migrations foram executadas com sucesso!')
    
    // Popular materialized view
    console.log('\n🔄 Populando materialized view mv_operator_kpis...')
    try {
      await client.query('REFRESH MATERIALIZED VIEW mv_operator_kpis;')
      console.log('✅ Materialized view populada!')
    } catch (error) {
      console.log(`⚠️  Aviso ao popular materialized view: ${error.message}`)
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Conexão fechada.')
  }
}

runMigrations()
