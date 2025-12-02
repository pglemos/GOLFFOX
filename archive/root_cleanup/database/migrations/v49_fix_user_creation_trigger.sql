-- ========================================
-- v49: Corrigir criação automática de perfis de usuário
-- Este script cria/atualiza o trigger que cria perfis automaticamente
-- quando um usuário é criado no auth.users
-- ========================================

-- 1. Remover triggers antigos que podem estar causando problemas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- 2. Remover funções antigas que podem estar causando problemas
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;

-- 3. Criar função segura para criar perfil de usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
  v_role TEXT := 'passenger'; -- role padrão
  v_company_id UUID := NULL;
BEGIN
  -- Obter email do novo usuário
  v_email := NEW.email;
  
  -- Tentar obter nome do metadata
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_name := NEW.raw_user_meta_data->>'name';
    IF v_name IS NULL THEN
      v_name := NEW.raw_user_meta_data->>'full_name';
    END IF;
  END IF;
  
  -- Se não tiver nome, usar email
  IF v_name IS NULL OR v_name = '' THEN
    v_name := COALESCE(SPLIT_PART(v_email, '@', 1), 'User');
  END IF;
  
  -- Tentar determinar role do metadata
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'passenger');
  END IF;
  
  -- Tentar obter company_id do metadata
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
  END IF;
  
  -- Inserir ou atualizar perfil na tabela public.users
  -- Usar apenas colunas que existem
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      company_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      v_email,
      v_name,
      v_role,
      v_company_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.users.name),
      role = COALESCE(EXCLUDED.role, public.users.role),
      company_id = COALESCE(EXCLUDED.company_id, public.users.company_id),
      updated_at = NOW();
  EXCEPTION
    WHEN OTHERS THEN
      -- Se falhar por coluna não existir, tentar sem colunas opcionais
      BEGIN
        INSERT INTO public.users (
          id,
          email,
          role,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          v_email,
          v_role,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          role = COALESCE(EXCLUDED.role, public.users.role),
          updated_at = NOW();
      EXCEPTION
        WHEN OTHERS THEN
          -- Se ainda falhar, apenas logar o erro mas não bloquear criação do usuário
          RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
      END;
  END;
  
  RETURN NEW;
END;
$$;

-- 4. Comentário na função
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Função que cria automaticamente o perfil em public.users quando um usuário é criado no auth.users';

-- 5. Criar trigger que chama a função após inserção em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Garantir que a função safe_create_user_profile existe e está atualizada
CREATE OR REPLACE FUNCTION public.safe_create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT,
  p_company_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Inserir ou atualizar perfil na tabela public.users
  BEGIN
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
      -- Se falhar por coluna não existir, tentar sem colunas opcionais
      BEGIN
        INSERT INTO public.users (
          id,
          email,
          name,
          role,
          company_id,
          created_at,
          updated_at
        ) VALUES (
          p_user_id,
          p_email,
          p_name,
          p_role,
          p_company_id,
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
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verificar se a estrutura da tabela users está correta
DO $$
DECLARE
  has_is_active BOOLEAN;
  has_phone BOOLEAN;
BEGIN
  -- Verificar is_active
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'is_active'
  ) INTO has_is_active;
  
  -- Verificar phone
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'phone'
  ) INTO has_phone;
  
  IF NOT has_is_active THEN
    RAISE NOTICE '⚠️ Coluna is_active não existe em public.users - trigger funcionará sem ela';
  END IF;
  
  IF NOT has_phone THEN
    RAISE NOTICE '⚠️ Coluna phone não existe em public.users - trigger funcionará sem ela';
  END IF;
END $$;

-- 8. Verificar se o trigger foi criado
SELECT 
  'Trigger criado com sucesso' as status,
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 9. Resumo final
SELECT 
  'Configuração concluída' as status,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_count;

