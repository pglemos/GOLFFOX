-- ========================================
-- v48: Corrigir criação de usuários no Auth
-- Este script verifica e corrige problemas com triggers/funções
-- que podem estar impedindo a criação de usuários
-- ========================================

-- 1. Verificar se há triggers problemáticos em auth.users
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth' 
    AND c.relname = 'users'
    AND t.tgenabled = 'O';
  
  RAISE NOTICE 'Triggers encontrados em auth.users: %', trigger_count;
END $$;

-- 2. Verificar se há funções que podem estar falhando
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'auth'
    AND p.proname LIKE '%user%';
  
  RAISE NOTICE 'Funções relacionadas a usuários em auth: %', func_count;
END $$;

-- 3. Verificar se a tabela public.users tem constraints que podem estar causando problemas
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND constraint_type = 'FOREIGN KEY';
  
  RAISE NOTICE 'Foreign keys em public.users: %', constraint_count;
END $$;

-- 4. Criar função auxiliar para criar usuário de forma segura
CREATE OR REPLACE FUNCTION public.safe_create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT,
  p_company_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Inserir ou atualizar perfil na tabela public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    company_id,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_name,
    p_role,
    p_company_id,
    true,
    NOW(),
    NOW()
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

-- 5. Comentário na função
COMMENT ON FUNCTION public.safe_create_user_profile IS 
  'Função auxiliar para criar perfil de usuário de forma segura, tratando erros';

-- 6. Verificar se há algum problema com a estrutura da tabela users
DO $$
DECLARE
  has_is_active BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'is_active'
  ) INTO has_is_active;
  
  IF NOT has_is_active THEN
    RAISE NOTICE '⚠️ Coluna is_active não existe em public.users';
  ELSE
    RAISE NOTICE '✅ Coluna is_active existe em public.users';
  END IF;
END $$;

-- 7. Verificar se há algum problema com RLS que pode estar bloqueando
DO $$
BEGIN
  -- Verificar se RLS está habilitado
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND rowsecurity = true
  ) THEN
    RAISE NOTICE '⚠️ RLS está habilitado em public.users - isso pode causar problemas na criação';
  ELSE
    RAISE NOTICE '✅ RLS não está habilitado em public.users';
  END IF;
END $$;

-- 8. Criar índice para melhorar performance (se não existir)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id) WHERE company_id IS NOT NULL;

-- Resumo final
SELECT 
  'Verificação concluída' as status,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users;

