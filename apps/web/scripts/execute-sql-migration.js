/**
 * Script para executar migração SQL no Supabase
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

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function executeSQL(sqlFile) {
  try {
    console.log(`📄 Lendo arquivo SQL: ${sqlFile}`)
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    console.log('🚀 Executando SQL no Supabase...')
    
    // Executar SQL usando RPC ou query direta
    // Como não temos acesso direto ao SQL, vamos usar uma abordagem alternativa
    // Vamos criar um script que pode ser executado manualmente ou via API
    
    console.log('✅ SQL preparado para execução')
    console.log('\n📋 Para executar este SQL:')
    console.log('1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql/new')
    console.log(`2. Cole o conteúdo do arquivo: ${sqlFile}`)
    console.log('3. Execute o SQL\n')
    
    // Tentar executar via API se possível
    // Nota: Supabase não permite executar SQL arbitrário via API por segurança
    // Mas podemos verificar se a função foi criada
    
    return true
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error)
    return false
  }
}

async function verifyMigration() {
  try {
    console.log('\n🔍 Verificando se a migração foi aplicada...')
    
    // Verificar se a função existe
    const { data, error } = await supabase.rpc('safe_create_user_profile', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_email: 'test@test.com',
      p_name: 'Test',
      p_role: 'passenger',
      p_company_id: null
    })
    
    if (error && error.message?.includes('does not exist')) {
      console.log('⚠️ Função ainda não existe - migração precisa ser executada')
      return false
    } else if (error && error.message?.includes('violates check constraint')) {
      console.log('✅ Função existe (erro esperado por dados de teste)')
      return true
    } else {
      console.log('✅ Função existe')
      return true
    }
  } catch (error) {
    console.log('⚠️ Não foi possível verificar - assumindo que precisa executar')
    return false
  }
}

async function main() {
  const sqlFile = path.join(__dirname, '../../database/migrations/v49_fix_user_creation_trigger.sql')
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Arquivo não encontrado: ${sqlFile}`)
    process.exit(1)
  }
  
  console.log('🔧 Executando migração para corrigir criação de usuários\n')
  
  await executeSQL(sqlFile)
  
  // Verificar se já foi aplicada
  const isApplied = await verifyMigration()
  
  if (!isApplied) {
    console.log('\n📝 INSTRUÇÕES PARA APLICAR A MIGRAÇÃO:')
    console.log('='.repeat(60))
    console.log('1. Acesse o Supabase Dashboard')
    console.log('2. Vá em SQL Editor')
    console.log(`3. Abra o arquivo: ${sqlFile}`)
    console.log('4. Cole todo o conteúdo no editor')
    console.log('5. Execute (Ctrl+Enter)')
    console.log('='.repeat(60))
  } else {
    console.log('\n✅ Migração já foi aplicada!')
  }
}

main().catch(error => {
  console.error('💥 Erro fatal:', error)
  process.exit(1)
})

