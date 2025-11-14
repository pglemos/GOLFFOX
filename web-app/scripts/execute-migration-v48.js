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

// Criar cliente com acesso direto ao Postgres (via REST API com service role)
const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function executeMigration() {
  console.log('🔧 Executando Migration v48: Fix Auth User Creation\n')
  
  // Ler o arquivo SQL
  const migrationPath = path.join(__dirname, '..', '..', 'database', 'migrations', 'v48_fix_auth_user_creation.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Arquivo de migration não encontrado: ${migrationPath}`)
    process.exit(1)
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf-8')
  console.log('📄 Migration carregada com sucesso\n')
  
  // Dividir o SQL em comandos individuais (separados por ;)
  const commands = sql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
  
  console.log(`📝 Executando ${commands.length} comandos SQL...\n`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i]
    
    // Pular blocos DO $$ ... END $$ (precisam ser executados de forma diferente)
    if (command.includes('DO $$')) {
      console.log(`⚠️  Comando ${i + 1}: Bloco DO detectado - precisa ser executado manualmente no Supabase SQL Editor`)
      continue
    }
    
    try {
      // Tentar executar via RPC se possível, senão usar query direta
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: command })
      
      if (error) {
        // Se RPC não existir, tentar executar diretamente (pode não funcionar para todos os comandos)
        console.log(`⚠️  Comando ${i + 1}: RPC não disponível, pulando...`)
        console.log(`   SQL: ${command.substring(0, 100)}...`)
        continue
      }
      
      console.log(`✅ Comando ${i + 1} executado com sucesso`)
      successCount++
    } catch (err) {
      console.error(`❌ Erro no comando ${i + 1}:`, err.message)
      errorCount++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DA EXECUÇÃO')
  console.log('='.repeat(60))
  console.log(`✅ Comandos executados: ${successCount}`)
  console.log(`❌ Comandos com erro: ${errorCount}`)
  console.log(`⚠️  Comandos que precisam execução manual: ${commands.length - successCount - errorCount}`)
  
  console.log('\n📋 PRÓXIMOS PASSOS:')
  console.log('1. Acesse o Supabase SQL Editor: https://supabase.com/dashboard/project/[seu-projeto]/sql/new')
  console.log('2. Cole o conteúdo do arquivo: database/migrations/v48_fix_auth_user_creation.sql')
  console.log('3. Execute o SQL completo')
  console.log('4. Teste novamente a criação de login de operador')
  
  if (errorCount > 0) {
    process.exit(1)
  }
}

executeMigration()

