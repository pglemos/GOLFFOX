/**
 * Script para corrigir criação de usuários executando SQL diretamente no Supabase
 * Execute: node scripts/fix-user-creation-trigger.js
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Obter DATABASE_URL das variáveis de ambiente ou usar padrão
const databaseUrl = process.env.DATABASE_URL || 
  process.env.SUPABASE_DB_URL ||
  `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || 'Guigui1309@'}@db.${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '') || 'vmoxzesvjcfmrebagcwo'}.supabase.co:5432/postgres`

if (!databaseUrl) {
  console.error('❌ Erro: DATABASE_URL não configurada')
  console.error('   Configure DATABASE_URL ou SUPABASE_DB_URL no .env.local')
  process.exit(1)
}

async function applyFix() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Supabase requer SSL
    }
  })

  // Ler arquivo SQL
  const sqlPath = path.join(__dirname, '../../database/migrations/v49_fix_user_creation_trigger.sql')
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Arquivo não encontrado: ${sqlPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8')

  console.log('🔧 Corrigindo criação de usuários no banco de dados\n')
  console.log('='.repeat(60))
  console.log('📄 Arquivo SQL:', sqlPath)
  console.log('🔗 Conectando ao Supabase...\n')

  try {
    await client.connect()
    console.log('✅ Conectado ao banco de dados\n')

    // Executar SQL completo
    console.log('🚀 Executando correção...\n')
    const result = await client.query(sql)
    
    console.log('✅ Correção aplicada com sucesso!\n')

    // Verificar se o trigger foi criado
    console.log('🔍 Verificando se o trigger foi criado...\n')
    const triggerCheck = await client.query(`
      SELECT 
        tgname as trigger_name,
        tgrelid::regclass as table_name,
        tgenabled as enabled
      FROM pg_trigger
      WHERE tgname = 'on_auth_user_created'
        AND tgrelid = 'auth.users'::regclass;
    `)

    if (triggerCheck.rows.length > 0) {
      console.log('✅ Trigger criado com sucesso:')
      console.log(`   Nome: ${triggerCheck.rows[0].trigger_name}`)
      console.log(`   Tabela: ${triggerCheck.rows[0].table_name}`)
      console.log(`   Habilitado: ${triggerCheck.rows[0].enabled === 'O' ? 'SIM' : 'NÃO'}\n`)
    } else {
      console.log('⚠️  Trigger não encontrado (pode precisar verificar manualmente)\n')
    }

    // Verificar se a função foi criada
    const functionCheck = await client.query(`
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'handle_new_user';
    `)

    if (functionCheck.rows.length > 0) {
      console.log('✅ Função criada com sucesso:')
      console.log(`   Nome: ${functionCheck.rows[0].routine_name}`)
      console.log(`   Tipo: ${functionCheck.rows[0].routine_type}\n`)
    } else {
      console.log('⚠️  Função não encontrada (pode precisar verificar manualmente)\n')
    }

    // Verificar função safe_create_user_profile
    const safeFunctionCheck = await client.query(`
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'safe_create_user_profile';
    `)

    if (safeFunctionCheck.rows.length > 0) {
      console.log('✅ Função safe_create_user_profile existe\n')
    } else {
      console.log('⚠️  Função safe_create_user_profile não encontrada\n')
    }

    console.log('='.repeat(60))
    console.log('✅ Correção aplicada com sucesso!')
    console.log('='.repeat(60))
    console.log('\n💡 Agora rode os testes:')
    console.log('   node scripts/test-empresas-completo.js --cleanup\n')

  } catch (error) {
    console.error('\n❌ Erro ao aplicar correção:', error.message)
    console.error('\nDetalhes:', error)
    
    // Se o erro for de permissão, dar instruções
    if (error.message?.includes('permission') || error.message?.includes('access')) {
      console.error('\n⚠️  Erro de permissão detectado')
      console.error('   Verifique se a DATABASE_URL tem permissões de administrador')
      console.error('   Ou execute o SQL manualmente no Supabase Dashboard\n')
    }
    
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Conexão fechada')
  }
}

// Executar
applyFix().catch(error => {
  console.error('\n💥 Erro fatal:', error)
  process.exit(1)
})

