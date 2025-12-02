-- ========================================
-- Fix: Adicionar coluna capacity na tabela vehicles
-- GolfFox Transport System
-- ========================================

-- Verificar se a coluna capacity existe
DO $$ 
BEGIN
    -- Verificar se a coluna capacity existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vehicles' 
        AND column_name = 'capacity'
        AND table_schema = 'public'
    ) THEN
        -- Adicionar a coluna capacity
        ALTER TABLE public.vehicles ADD COLUMN capacity INTEGER DEFAULT 40;
        RAISE NOTICE 'Coluna capacity adicionada à tabela vehicles com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna capacity já existe na tabela vehicles.';
    END IF;
    
    -- Verificar se a coluna company_id existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vehicles' 
        AND column_name = 'company_id'
        AND table_schema = 'public'
    ) THEN
        -- Adicionar a coluna company_id
        ALTER TABLE public.vehicles ADD COLUMN company_id UUID REFERENCES public.companies(id);
        RAISE NOTICE 'Coluna company_id adicionada à tabela vehicles com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna company_id já existe na tabela vehicles.';
    END IF;
END $$;

-- Verificar estrutura atual da tabela vehicles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar resultado
SELECT 'Verificação da tabela vehicles concluída!' as resultado;