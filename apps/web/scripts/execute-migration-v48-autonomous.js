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

async function executeSQLCommand(sql) {
  // Tentar executar via RPC se disponível
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (!error) return { success: true, data }
  } catch (e) {
    // RPC não disponível, continuar
  }
  
  // Tentar executar comandos específicos via Supabase client
  // Para comandos CREATE FUNCTION, precisamos usar uma abordagem diferente
  return { success: false, error: 'Comando precisa ser executado manualmente' }
}

async function createSafeUserProfileFunction() {
  console.log('📝 Criando função safe_create_user_profile...')
  
  const functionSQL = `
    CREATE OR REPLACE FUNCTION public.safe_create_user_profile(
      p_user_id UUID,
      p_email TEXT,
      p_name TEXT,
      p_role TEXT,
      p_company_id UUID DEFAULT NULL
    ) RETURNS BOOLEAN AS $$
    BEGIN
      INSERT INTO public.users (
        id, email, name, role, company_id, is_active, created_at, updated_at
      ) VALUES (
        p_user_id, p_email, p_name, p_role, p_company_id, true, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        company_id = COALESCE(EXCLUDED.company_id, public.users.company_id),
        updated_at = NOW();
      RETURN true;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Erro ao criar perfil para usuário %: %', p_user_id, SQLERRM;
        RETURN false;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `
  
  // Infelizmente, não podemos executar CREATE FUNCTION via REST API
  // Mas podemos verificar se a função já existe
  console.log('⚠️  CREATE FUNCTION precisa ser executado no Supabase SQL Editor')
  console.log('   A função será criada quando você executar a migration completa')
  
  return { success: false, needsManual: true }
}

async function createIndexes() {
  console.log('📝 Criando índices...')
  
  // Índices podem ser criados via migrations, mas vamos verificar se existem
  try {
    // Verificar se os índices existem tentando uma query que os usaria
    const { data, error } = await supabase
      .from('users')
      .select('email, company_id')
      .limit(1)
    
    if (!error) {
      console.log('✅ Tabela users acessível, índices serão criados pela migration')
      return { success: true }
    }
  } catch (e) {
    console.log('⚠️  Não foi possível verificar índices via REST API')
  }
  
  return { success: false, needsManual: true }
}

async function verifyStructure() {
  console.log('🔍 Verificando estrutura do banco...\n')
  
  const checks = [
    { name: 'Tabela companies', table: 'companies' },
    { name: 'Tabela users', table: 'users' },
    { name: 'Tabela routes', table: 'routes' },
    { name: 'Tabela vehicles', table: 'vehicles' },
    { name: 'Tabela gf_incidents', table: 'gf_incidents' },
    { name: 'Tabela gf_assistance_requests', table: 'gf_assistance_requests' }
  ]
  
  for (const check of checks) {
    try {
      const { data, error } = await supabase
        .from(check.table)
        .select('count')
        .limit(1)
      
      if (!error) {
        console.log(`✅ ${check.name} - OK`)
      } else {
        console.log(`⚠️  ${check.name} - ${error.message}`)
      }
    } catch (e) {
      console.log(`❌ ${check.name} - Erro: ${e.message}`)
    }
  }
}

async function testUserCreation() {
  console.log('\n🧪 Testando criação de usuário no Auth...')
  
  const testEmail = `test-auth-${Date.now()}@test.com`
  const testPassword = 'test123456'
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })
    
    if (error) {
      console.log(`❌ Erro ao criar usuário de teste: ${error.message}`)
      if (error.message.includes('Database error')) {
        console.log('   ⚠️  Este é o erro que a migration v48 deve corrigir')
        return { success: false, needsMigration: true }
      }
      return { success: false, error: error.message }
    }
    
    if (data?.user) {
      console.log(`✅ Usuário de teste criado com sucesso: ${data.user.id}`)
      // Limpar usuário de teste
      await supabase.auth.admin.deleteUser(data.user.id)
      console.log('✅ Usuário de teste removido')
      return { success: true }
    }
    
    return { success: false, error: 'Usuário não foi criado' }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runMigrationAutonomous() {
  console.log('🚀 EXECUTANDO MIGRATION V48 DE FORMA AUTÔNOMA\n')
  console.log('='.repeat(60))
  
  // Passo 1: Verificar estrutura
  await verifyStructure()
  
  // Passo 2: Testar criação de usuário (para verificar se precisa da migration)
  const testResult = await testUserCreation()
  
  if (testResult.success) {
    console.log('\n✅ Criação de usuário está funcionando! Migration pode não ser necessária.')
    return { success: true, migrationNeeded: false }
  }
  
  if (testResult.needsMigration) {
    console.log('\n⚠️  Migration v48 é necessária para corrigir o problema de criação de usuário')
    console.log('\n📋 EXECUTANDO CORREÇÕES POSSÍVEIS VIA API...\n')
    
    // Tentar criar índices (se possível)
    await createIndexes()
    
    // Tentar criar função (não é possível via REST API)
    await createSafeUserProfileFunction()
    
    console.log('\n' + '='.repeat(60))
    console.log('⚠️  LIMITAÇÕES DA EXECUÇÃO AUTÔNOMA')
    console.log('='.repeat(60))
    console.log('A migration v48 contém comandos SQL que não podem ser executados')
    console.log('diretamente via REST API do Supabase:')
    console.log('  - Blocos DO $$ ... END $$')
    console.log('  - CREATE FUNCTION')
    console.log('  - Verificações de triggers e constraints')
    console.log('\n📝 PRÓXIMO PASSO OBRIGATÓRIO:')
    console.log('1. Acesse: https://supabase.com/dashboard')
    console.log('2. Vá em SQL Editor → New Query')
    console.log('3. Cole o conteúdo de: database/migrations/v48_fix_auth_user_creation.sql')
    console.log('4. Execute (RUN ou Ctrl+Enter)')
    console.log('5. Verifique se não há erros')
    
    return { success: false, migrationNeeded: true, needsManual: true }
  }
  
  return { success: false, error: testResult.error }
}

// Executar
runMigrationAutonomous().then(result => {
  if (result.success) {
    console.log('\n✅ Migration não é necessária ou já foi executada!')
    process.exit(0)
  } else if (result.needsManual) {
    console.log('\n⚠️  Execução manual da migration é necessária')
    process.exit(1)
  } else {
    console.log('\n❌ Erro ao executar migration')
    process.exit(1)
  }
})

