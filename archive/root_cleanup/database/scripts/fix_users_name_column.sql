-- Script para adicionar coluna name à tabela users (se não existir)

-- Adicionar coluna name à tabela users (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN name TEXT;
    
    -- Tentar popular name a partir de email se name estiver vazio
    UPDATE public.users 
    SET name = SPLIT_PART(email, '@', 1) 
    WHERE name IS NULL OR name = '';
    
    -- Tornar name NOT NULL após popular (mas só se não houver NULLs)
    -- Por enquanto deixamos como nullable para não quebrar dados existentes
    
    COMMENT ON COLUMN public.users.name IS 'Nome do usuário';
  END IF;
END $$;

-- Verificar se coluna phone existe (pode ser necessária)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN phone TEXT;
    
    COMMENT ON COLUMN public.users.phone IS 'Telefone do usuário (opcional)';
  END IF;
END $$;

-- Verificar estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
ORDER BY ordinal_position;

