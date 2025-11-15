require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

// Este script apenas exibe o SQL que precisa ser executado
// pois o Supabase não permite executar ALTER TABLE via REST API diretamente

const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'fix_companies_updated_at_final.sql')

if (!fs.existsSync(sqlPath)) {
  console.error('❌ Arquivo SQL não encontrado:', sqlPath)
  process.exit(1)
}

const sql = fs.readFileSync(sqlPath, 'utf-8')

console.log('📋 SQL Migration para executar no Supabase Dashboard:\n')
console.log('='.repeat(70))
console.log(sql)
console.log('='.repeat(70))
console.log('\n💡 Instruções:')
console.log('1. Acesse: https://supabase.com/dashboard')
console.log('2. Selecione seu projeto')
console.log('3. Vá em: SQL Editor')
console.log('4. Cole o SQL acima')
console.log('5. Clique em "Run"')
console.log('\n✅ Após executar, rode: node scripts/auto-fix-and-test.js')

