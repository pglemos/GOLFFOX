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
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeMigration() {
  console.log('🔧 Executando Migration v48: Fix Auth User Creation\n')
  
  const migrationPath = path.join(__dirname, '..', '..', 'database', 'migrations', 'v48_fix_auth_user_creation.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Arquivo de migration não encontrado: ${migrationPath}`)
    process.exit(1)
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf-8')
  console.log('📄 Migration carregada\n')
  
  // Executar comandos SQL diretamente via Supabase REST API
  // Nota: Alguns comandos podem precisar ser executados manualmente no SQL Editor
  
  console.log('⚠️  IMPORTANTE: Esta migration contém comandos que precisam ser executados no Supabase SQL Editor')
  console.log('   O Supabase REST API não suporta todos os tipos de comandos SQL diretamente.\n')
  
  console.log('📋 INSTRUÇÕES:')
  console.log('1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql/new')
  console.log('2. Abra o arquivo: database/migrations/v48_fix_auth_user_creation.sql')
  console.log('3. Cole TODO o conteúdo no SQL Editor')
  console.log('4. Clique em "RUN" ou pressione Ctrl+Enter')
  console.log('5. Verifique se não há erros')
  console.log('6. Teste a criação de login de operador novamente\n')
  
  // Tentar executar comandos simples que são suportados
  console.log('🔍 Verificando estrutura atual do banco...\n')
  
  try {
    // Verificar se a função safe_create_user_profile já existe
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'safe_create_user_profile')
      .limit(1)
    
    if (!funcError) {
      console.log('✅ Verificação de funções concluída')
    }
    
    // Verificar tabelas
    const tables = ['companies', 'users', 'gf_incidents', 'gf_assistance_requests']
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (!error) {
        console.log(`✅ Tabela ${table} acessível`)
      } else {
        console.log(`⚠️  Tabela ${table}: ${error.message}`)
      }
    }
    
  } catch (error) {
    console.log('⚠️  Algumas verificações não puderam ser executadas via REST API')
  }
  
  console.log('\n✅ Verificação concluída')
  console.log('\n📝 PRÓXIMO PASSO: Execute a migration manualmente no Supabase SQL Editor')
}

executeMigration()

