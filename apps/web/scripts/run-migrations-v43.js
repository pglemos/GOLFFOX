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

  const results = {
    timestamp: new Date().toISOString(),
    migrations_applied: [],
    migrations_skipped: [],
    migrations_failed: []
  }

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
        results.migrations_failed.push({ file: migrationFile, reason: 'File not found' })
        continue
      }

      console.log(`📦 Executando migration ${i + 1}/${migrations.length}: ${migrationFile}`)

      const sql = fs.readFileSync(migrationPath, 'utf8')
      const startTime = Date.now()

      try {
        await client.query(sql)
        const duration = Date.now() - startTime
        console.log(`✅ Migration executada com sucesso: ${migrationFile} (${duration}ms)\n`)
        results.migrations_applied.push({ file: migrationFile, duration_ms: duration })
      } catch (error) {
        // Ignorar erros de "já existe" (idempotência)
        const errorMsg = error.message.toLowerCase()
        const isIdempotentError = 
          errorMsg.includes('already exists') || 
          errorMsg.includes('duplicate') ||
          errorMsg.includes('relation already exists') ||
          errorMsg.includes('constraint already exists') ||
          errorMsg.includes('function already exists') ||
          errorMsg.includes('index already exists') ||
          errorMsg.includes('view already exists')

        if (isIdempotentError) {
          console.log(`⚠️  Migration já existe (ignorado): ${migrationFile}\n`)
          results.migrations_skipped.push({ file: migrationFile, reason: 'Already exists' })
        } else {
          console.error(`❌ Erro ao executar ${migrationFile}:`, error.message)
          results.migrations_failed.push({ file: migrationFile, reason: error.message })
          // Continuar com próxima migration ao invés de parar
          console.log(`   ⚠️  Continuando com próximas migrations...\n`)
        }
      }
    }

    console.log('\n📊 Resumo:')
    console.log(`   ✅ Aplicadas: ${results.migrations_applied.length}`)
    console.log(`   ⏭️  Ignoradas: ${results.migrations_skipped.length}`)
    console.log(`   ❌ Falhadas: ${results.migrations_failed.length}`)

    if (results.migrations_failed.length > 0) {
      console.log('\n⚠️  ATENÇÃO: Algumas migrations falharam!')
      results.migrations_failed.forEach(m => {
        console.log(`   - ${m.file}: ${m.reason}`)
      })
    }

    // Popular materialized view
    console.log('\n🔄 Populando materialized view mv_operator_kpis...')
    try {
      await client.query('REFRESH MATERIALIZED VIEW mv_operator_kpis;')
      console.log('✅ Materialized view populada!')
      results.materialized_view_refreshed = true
    } catch (error) {
      console.log(`⚠️  Aviso ao popular materialized view: ${error.message}`)
      results.materialized_view_refreshed = false
      results.materialized_view_error = error.message
    }

    // Salvar resultado
    const outputPath = path.join(__dirname, '..', 'MIGRATIONS_RESULT.json')
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`\n✅ Resultado salvo em: ${outputPath}`)

  } catch (error) {
    console.error('❌ Erro fatal:', error.message)
    results.fatal_error = error.message
    const outputPath = path.join(__dirname, '..', 'MIGRATIONS_RESULT.json')
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Conexão fechada.')
  }
}

runMigrations()
