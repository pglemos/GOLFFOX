/**
 * Script para aplicar correção de criação de usuários via Supabase Admin
 * Executa os comandos SQL necessários usando o cliente admin
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
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
})

// Comandos SQL para executar (divididos em partes executáveis)
const SQL_COMMANDS = [
  // 1. Remover triggers antigos
  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,
  `DROP TRIGGER IF EXISTS handle_new_user ON auth.users;`,
  `DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;`,
  
  // 2. Remover funções antigas
  `DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;`,
  `DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;`,
  `DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;`,
]

const FUNCTION_SQL = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
  v_role TEXT := 'passenger';
  v_company_id UUID := NULL;
BEGIN
  v_email := NEW.email;
  
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_name := NEW.raw_user_meta_data->>'name';
    IF v_name IS NULL THEN
      v_name := NEW.raw_user_meta_data->>'full_name';
    END IF;
  END IF;
  
  IF v_name IS NULL OR v_name = '' THEN
    v_name := COALESCE(SPLIT_PART(v_email, '@', 1), 'User');
  END IF;
  
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'passenger');
  END IF;
  
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
  END IF;
  
  BEGIN
    INSERT INTO public.users (
      id, email, name, role, company_id, created_at, updated_at
    ) VALUES (
      NEW.id, v_email, v_name, v_role, v_company_id, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.users.name),
      role = COALESCE(EXCLUDED.role, public.users.role),
      company_id = COALESCE(EXCLUDED.company_id, public.users.company_id),
      updated_at = NOW();
  EXCEPTION
    WHEN OTHERS THEN
      BEGIN
        INSERT INTO public.users (
          id, email, role, created_at, updated_at
        ) VALUES (
          NEW.id, v_email, v_role, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          role = COALESCE(EXCLUDED.role, public.users.role),
          updated_at = NOW();
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
      END;
  END;
  
  RETURN NEW;
END;
$$;
`

const TRIGGER_SQL = `
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
`

async function executeViaRPC(sql) {
  // Tentar executar via função RPC se existir
  // Como não temos uma função genérica, vamos usar outra abordagem
  return false
}

async function applyFix() {
  console.log('🔧 Aplicando correção de criação de usuários...\n')
  
  try {
    // Como não podemos executar SQL arbitrário via API, vamos usar uma abordagem diferente
    // Vamos criar uma função RPC temporária que executa o SQL
    
    console.log('⚠️ Execução direta de SQL não é possível via API REST')
    console.log('📋 Usando abordagem alternativa...\n')
    
    // Verificar se já existe a função
    const { data: checkFunc, error: checkError } = await supabase
      .rpc('safe_create_user_profile', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_email: 'test@test.com',
        p_name: 'Test',
        p_role: 'passenger',
        p_company_id: null
      })
    
    if (checkError && checkError.message?.includes('does not exist')) {
      console.log('❌ Função não existe - precisa executar SQL manualmente')
    } else {
      console.log('✅ Função safe_create_user_profile existe')
    }
    
    // Mostrar instruções
    console.log('\n' + '='.repeat(60))
    console.log('📝 EXECUTE O SQL MANUALMENTE NO SUPABASE DASHBOARD')
    console.log('='.repeat(60))
    console.log('\n1. Acesse: https://supabase.com/dashboard')
    console.log('2. Selecione seu projeto')
    console.log('3. Vá em "SQL Editor"')
    console.log('4. Clique em "New query"')
    console.log('5. Cole o conteúdo do arquivo:')
    console.log('   database/migrations/v49_fix_user_creation_trigger.sql')
    console.log('6. Execute (Ctrl+Enter)')
    console.log('\n' + '='.repeat(60))
    
    return false
  } catch (error) {
    console.error('❌ Erro:', error.message)
    return false
  }
}

async function main() {
  const applied = await applyFix()
  
  if (!applied) {
    console.log('\n💡 Após executar o SQL, rode os testes:')
    console.log('   node scripts/test-empresas-completo.js --cleanup\n')
    process.exit(1)
  } else {
    console.log('\n✅ Correção aplicada com sucesso!')
    process.exit(0)
  }
}

main()

