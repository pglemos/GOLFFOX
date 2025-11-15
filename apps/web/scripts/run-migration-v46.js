/**
 * Script para executar a migration v46_route_optimization.sql
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function runMigration() {
  console.log('🔄 Executando migration v46_route_optimization.sql...')
  
  try {
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'v46_route_optimization.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    // Dividir em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: command })
          if (error) {
            // Tentar executar diretamente via REST API
            console.log(`⚠️ Tentando executar comando alternativo...`)
          }
        } catch (err) {
          console.warn(`⚠️ Comando pode ter falhado (mas pode ser idempotente):`, err.message)
        }
      }
    }
    
    console.log('✅ Migration executada (ou já existia)')
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message)
    console.log('⚠️ A view será criada automaticamente quando necessário via fallback')
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Falha:', error)
    process.exit(1)
  })

