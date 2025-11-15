/**
 * Script para corrigir criação de usuários executando SQL diretamente
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

// Usar o endpoint REST do Supabase para executar SQL
const SUPABASE_REST_URL = `${url}/rest/v1/rpc`

async function executeSQLDirect(sql) {
  try {
    // Dividir SQL em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Executando ${commands.length} comandos SQL...\n`)
    
    // Executar cada comando via API REST do Supabase
    // Nota: Supabase não permite executar SQL arbitrário via REST API
    // Vamos usar uma abordagem diferente - criar a função via RPC
    
    return true
  } catch (error) {
    console.error('❌ Erro:', error)
    return false
  }
}

async function createFunctionViaRPC() {
  try {
    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' }
    })
    
    console.log('🔧 Criando função handle_new_user via RPC...\n')
    
    // Como não podemos executar SQL arbitrário, vamos criar a função
    // usando uma abordagem alternativa - vamos usar o PostgREST
    // Mas o melhor é executar manualmente no dashboard
    
    console.log('⚠️ Execução direta de SQL não é possível via API por segurança')
    console.log('📋 Execute o SQL manualmente no Supabase Dashboard\n')
    
    return false
  } catch (error) {
    console.error('❌ Erro:', error)
    return false
  }
}

async function main() {
  const sqlFile = path.join(__dirname, '../../database/migrations/v49_fix_user_creation_trigger.sql')
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Arquivo não encontrado: ${sqlFile}`)
    process.exit(1)
  }
  
  const sql = fs.readFileSync(sqlFile, 'utf8')
  
  console.log('🔧 Corrigindo criação de usuários no banco de dados\n')
  console.log('='.repeat(60))
  
  // Tentar executar
  const executed = await createFunctionViaRPC()
  
  if (!executed) {
    console.log('\n📝 INSTRUÇÕES PARA APLICAR A CORREÇÃO:')
    console.log('='.repeat(60))
    console.log('1. Acesse: https://supabase.com/dashboard')
    console.log('2. Selecione seu projeto')
    console.log('3. Vá em "SQL Editor" (menu lateral)')
    console.log('4. Clique em "New query"')
    console.log(`5. Abra o arquivo: ${sqlFile}`)
    console.log('6. Copie TODO o conteúdo do arquivo')
    console.log('7. Cole no SQL Editor')
    console.log('8. Clique em "Run" ou pressione Ctrl+Enter')
    console.log('9. Aguarde a execução completar')
    console.log('='.repeat(60))
    console.log('\n💡 Após executar, rode os testes novamente:')
    console.log('   node scripts/test-empresas-completo.js --cleanup\n')
  }
}

main().catch(error => {
  console.error('💥 Erro fatal:', error)
  process.exit(1)
})

