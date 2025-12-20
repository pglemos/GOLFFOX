/**
 * Script para Validar SQL das Migrations
 * 
 * Valida sintaxe e estrutura das migrations antes de aplicar
 */

const fs = require('fs')
const path = require('path')

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

const MIGRATIONS_TO_VALIDATE = [
  '20250115_event_store.sql',
  '20250116_missing_tables.sql'
]

/**
 * Validar SQL básico
 */
function validateSQL(sql, fileName) {
  const errors = []
  const warnings = []

  // Verificar comandos perigosos
  const dangerousCommands = ['DROP TABLE', 'TRUNCATE', 'DELETE FROM']
  dangerousCommands.forEach(cmd => {
    if (sql.toUpperCase().includes(cmd)) {
      warnings.push(`⚠️  Comando potencialmente perigoso encontrado: ${cmd}`)
    }
  })

  // Verificar se tem CREATE TABLE
  if (!sql.toUpperCase().includes('CREATE TABLE')) {
    errors.push('❌ Nenhum CREATE TABLE encontrado')
  }

  // Verificar se tem IF NOT EXISTS (idempotência)
  const createTableMatches = sql.match(/CREATE TABLE\s+(\w+)/gi)
  if (createTableMatches) {
    createTableMatches.forEach(match => {
      if (!match.includes('IF NOT EXISTS') && !sql.includes('CREATE OR REPLACE')) {
        warnings.push(`⚠️  CREATE TABLE sem IF NOT EXISTS: ${match}`)
      }
    })
  }

  // Verificar RLS
  if (sql.includes('ENABLE ROW LEVEL SECURITY') && !sql.includes('CREATE POLICY')) {
    warnings.push('⚠️  RLS habilitado mas nenhuma policy encontrada')
  }

  // Verificar índices
  const indexCount = (sql.match(/CREATE INDEX/gi) || []).length
  if (indexCount === 0) {
    warnings.push('⚠️  Nenhum índice criado')
  }

  return { errors, warnings }
}

/**
 * Main
 */
function main() {
  console.log('🔍 Validando SQL das Migrations\n')
  console.log('='.repeat(60) + '\n')

  let totalErrors = 0
  let totalWarnings = 0

  for (const fileName of MIGRATIONS_TO_VALIDATE) {
    const filePath = path.join(MIGRATIONS_DIR, fileName)
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${fileName}`)
      totalErrors++
      continue
    }

    const sql = fs.readFileSync(filePath, 'utf8')
    const { errors, warnings } = validateSQL(sql, fileName)

    console.log(`📄 ${fileName}`)
    console.log(`   📏 Tamanho: ${(sql.length / 1024).toFixed(2)} KB`)
    console.log(`   📝 Linhas: ${sql.split('\n').length}`)

    if (errors.length > 0) {
      console.log(`   ❌ Erros: ${errors.length}`)
      errors.forEach(err => console.log(`      ${err}`))
      totalErrors += errors.length
    }

    if (warnings.length > 0) {
      console.log(`   ⚠️  Avisos: ${warnings.length}`)
      warnings.forEach(warn => console.log(`      ${warn}`))
      totalWarnings += warnings.length
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`   ✅ Validação OK`)
    }

    console.log('')
  }

  console.log('='.repeat(60))
  console.log('📊 RESUMO')
  console.log('='.repeat(60))
  console.log(`✅ Migrations validadas: ${MIGRATIONS_TO_VALIDATE.length}`)
  console.log(`❌ Erros: ${totalErrors}`)
  console.log(`⚠️  Avisos: ${totalWarnings}`)

  if (totalErrors > 0) {
    console.log('\n❌ Validação falhou! Corrija os erros antes de aplicar.')
    process.exit(1)
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  Validação passou com avisos. Revise antes de aplicar.')
    process.exit(0)
  } else {
    console.log('\n✅ Todas as migrations estão válidas!')
    console.log('\n💡 Próximo passo: Aplicar migrations')
    console.log('   Ver: docs/MIGRATIONS_APLICAR_URGENTE.md')
    process.exit(0)
  }
}

if (require.main === module) {
  main()
}

module.exports = { validateSQL }

