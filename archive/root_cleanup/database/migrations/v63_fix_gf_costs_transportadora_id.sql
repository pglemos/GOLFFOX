-- ============================================
-- Migration v63: Fix gf_costs para usar transportadora_id
-- ============================================

-- Verificar se a coluna carrier_id existe na tabela gf_costs
DO $$ 
BEGIN
  -- Verificar se carrier_id existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gf_costs' 
    AND column_name = 'carrier_id'
  ) THEN
    -- Verificar se transportadora_id já existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gf_costs' 
      AND column_name = 'transportadora_id'
    ) THEN
      -- Adicionar coluna transportadora_id
      ALTER TABLE public.gf_costs 
        ADD COLUMN transportadora_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL;
      
      -- Copiar dados de carrier_id para transportadora_id
      UPDATE public.gf_costs 
        SET transportadora_id = carrier_id 
        WHERE carrier_id IS NOT NULL;
      
      -- Criar índice
      CREATE INDEX IF NOT EXISTS idx_gf_costs_transportadora 
        ON public.gf_costs(transportadora_id);
      
      -- Dropar índice antigo se existir
      DROP INDEX IF EXISTS public.idx_gf_costs_carrier;
      
      -- Dropar foreign key antiga se existir
      ALTER TABLE public.gf_costs 
        DROP CONSTRAINT IF EXISTS gf_costs_carrier_id_fkey;
      
      -- Dropar coluna carrier_id
      ALTER TABLE public.gf_costs 
        DROP COLUMN IF EXISTS carrier_id;
      
      RAISE NOTICE 'Migração de carrier_id para transportadora_id concluída na tabela gf_costs';
    ELSE
      RAISE NOTICE 'Coluna transportadora_id já existe na tabela gf_costs. Mantendo ambas durante período de transição.';
    END IF;
  ELSE
    RAISE NOTICE 'Coluna carrier_id não existe na tabela gf_costs. Migração já foi aplicada ou não é necessária.';
  END IF;
END $$;

-- Comentário
COMMENT ON COLUMN public.gf_costs.transportadora_id IS 'Transportadora associada ao custo (renomeado de carrier_id)';

