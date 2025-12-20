/**
 * Script para Aplicar Migrations via Supabase
 * 
 * Este script aplica as migrations de nomenclatura PT-BR no banco de dados
 */

const fs = require('fs')
const path = require('path')

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
 * Gerar instruções para aplicação manual
 */
function generateInstructions() {
  console.log('\n' + '='.repeat(60))
  console.log('📋 INSTRUÇÕES PARA APLICAÇÃO DAS MIGRATIONS')
  console.log('='.repeat(60))
  
  for (const fileName of MIGRATIONS_TO_APPLY) {
    console.log(`\n📄 Migration: ${fileName}`)
    console.log(`\n1. Acesse: https://supabase.com/dashboard`)
    console.log(`2. Selecione seu projeto`)
    console.log(`3. Vá em SQL Editor`)
    console.log(`4. Cole o conteúdo abaixo e execute:`)
    console.log(`\n${'─'.repeat(60)}`)
    console.log(readMigration(fileName))
    console.log(`${'─'.repeat(60)}\n`)
  }
  
  console.log('\n✅ Após aplicar, execute os testes de verificação.')
}

// Executar
console.log('🚀 Preparando aplicação de migrations...\n')
generateInstructions()

