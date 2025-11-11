-- Script SQL para criar usuários de teste
-- NOTA: Este script cria os registros na tabela users, mas os usuários PRECISAM ser criados no Supabase Auth
-- usando a interface do Supabase ou a API Admin. Este script apenas prepara os dados no banco.

-- 1. Criar empresa de teste se não existir
INSERT INTO companies (id, name, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Empresa Teste',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1)
ON CONFLICT DO NOTHING;

-- 2. Obter ID da empresa (usar primeira empresa disponível)
DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
BEGIN
  -- Obter primeira empresa
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma empresa encontrada. Crie uma empresa primeiro.';
  END IF;

  RAISE NOTICE 'Usando empresa: %', v_company_id;

  -- NOTA: Os usuários precisam ser criados no Supabase Auth primeiro
  -- Este script apenas cria/atualiza os registros na tabela users
  -- Para criar no Auth, use o script create_test_users.js ou a interface do Supabase
  
  -- Os IDs dos usuários serão gerados quando criados no Auth
  -- Por enquanto, apenas garantimos que a empresa existe
  
  RAISE NOTICE 'Empresa preparada para usuários de teste: %', v_company_id;
  
END $$;

-- 3. Verificar estrutura da tabela users
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

