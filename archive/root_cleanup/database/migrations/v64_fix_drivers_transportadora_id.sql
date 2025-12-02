-- ============================================
-- Migration v64: Fix drivers para usar transportadora_id
-- ============================================

-- Verificar se a tabela drivers existe e se tem carrier_id
DO $$ 
BEGIN
  -- Verificar se a tabela drivers existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'drivers'
  ) THEN
    -- Verificar se carrier_id existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'drivers' 
      AND column_name = 'carrier_id'
    ) THEN
      -- Verificar se transportadora_id já existe
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'drivers' 
        AND column_name = 'transportadora_id'
      ) THEN
        -- Adicionar coluna transportadora_id
        ALTER TABLE public.drivers 
          ADD COLUMN transportadora_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL;
        
        -- Copiar dados de carrier_id para transportadora_id
        UPDATE public.drivers 
          SET transportadora_id = carrier_id 
          WHERE carrier_id IS NOT NULL;
        
        -- Criar índice
        CREATE INDEX IF NOT EXISTS idx_drivers_transportadora 
          ON public.drivers(transportadora_id);
        
        -- Dropar índice antigo se existir
        DROP INDEX IF EXISTS public.idx_drivers_carrier;
        
        -- Dropar foreign key antiga se existir
        ALTER TABLE public.drivers 
          DROP CONSTRAINT IF EXISTS drivers_carrier_id_fkey;
        
        -- Dropar coluna carrier_id
        ALTER TABLE public.drivers 
          DROP COLUMN IF EXISTS carrier_id;
        
        RAISE NOTICE 'Migração de carrier_id para transportadora_id concluída na tabela drivers';
      ELSE
        RAISE NOTICE 'Coluna transportadora_id já existe na tabela drivers. Mantendo ambas durante período de transição.';
      END IF;
    ELSE
      RAISE NOTICE 'Coluna carrier_id não existe na tabela drivers. Migração já foi aplicada ou não é necessária.';
    END IF;
  ELSE
    RAISE NOTICE 'Tabela drivers não existe. Motoristas podem estar na tabela users.';
  END IF;
END $$;

-- Comentário
COMMENT ON COLUMN public.drivers.transportadora_id IS 'Transportadora associada ao motorista (renomeado de carrier_id)';

