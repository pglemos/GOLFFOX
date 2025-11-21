-- ============================================
-- Aplicar Migrações de Transportadora
-- ============================================
-- Execute este arquivo no Supabase Dashboard > SQL Editor
-- Ordem de execução: v63 → v62 → v64
-- ============================================

-- ============================================
-- PASSO 1: v63_fix_gf_costs_transportadora_id
-- ============================================
-- Migra tabela gf_costs de carrier_id para transportadora_id

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
      
      RAISE NOTICE '✅ Migração v63: carrier_id → transportadora_id concluída na tabela gf_costs';
    ELSE
      RAISE NOTICE '✅ Migração v63: transportadora_id já existe na tabela gf_costs';
    END IF;
  ELSE
    RAISE NOTICE '✅ Migração v63: carrier_id não existe (já migrado ou não necessário)';
  END IF;
END $$;

-- ============================================
-- PASSO 2: v62_fix_v_costs_secure_transportadora
-- ============================================
-- Corrige view v_costs_secure para usar transportadora_id

DROP VIEW IF EXISTS public.v_costs_secure CASCADE;

CREATE OR REPLACE VIEW public.v_costs_secure AS
SELECT 
  c.*,
  comp.name AS company_name,
  car.name AS carrier_name,
  r.name AS route_name,
  v.plate AS vehicle_plate,
  v.model AS vehicle_model,
  u.email AS driver_email,
  cat.group_name,
  cat.category,
  cat.subcategory,
  cc.name AS cost_center_name,
  -- Adicionar campo date como alias para compatibilidade (a tabela já tem date)
  c.date AS date
FROM public.gf_costs c
JOIN public.companies comp ON comp.id = c.company_id
LEFT JOIN public.carriers car ON car.id = c.transportadora_id  -- Usa apenas transportadora_id (carrier_id já foi removido na v63)
LEFT JOIN public.routes r ON r.id = c.route_id
LEFT JOIN public.vehicles v ON v.id = c.vehicle_id
LEFT JOIN public.users u ON u.id = c.driver_id
JOIN public.gf_cost_categories cat ON cat.id = c.cost_category_id
LEFT JOIN public.gf_cost_centers cc ON cc.id = c.cost_center_id
WHERE cat.is_active = true;

COMMENT ON VIEW public.v_costs_secure IS 'View segura de custos com joins para nomes (RLS aplicado via tabela base). Usa transportadora_id (carrier_id foi removido na migração v63).';

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migração v62: View v_costs_secure criada/atualizada';
END $$;

-- ============================================
-- PASSO 3: v64_fix_drivers_transportadora_id
-- ============================================
-- Migra tabela drivers de carrier_id para transportadora_id (se existir)

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
        
        RAISE NOTICE '✅ Migração v64: carrier_id → transportadora_id concluída na tabela drivers';
      ELSE
        RAISE NOTICE '✅ Migração v64: transportadora_id já existe na tabela drivers';
      END IF;
    ELSE
      RAISE NOTICE '✅ Migração v64: carrier_id não existe na tabela drivers (já migrado)';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  Migração v64: Tabela drivers não existe (motoristas podem estar na tabela users)';
  END IF;
END $$;

-- ============================================
-- RESUMO
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRAÇÕES DE TRANSPORTADORA APLICADAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ v63: Tabela gf_costs migrada para transportadora_id';
  RAISE NOTICE '✅ v62: View v_costs_secure criada/atualizada';
  RAISE NOTICE '✅ v64: Tabela drivers migrada (se existir)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Execute: node apps/web/scripts/diagnose-supabase.js';
  RAISE NOTICE '2. Verifique se não há mais problemas';
  RAISE NOTICE '3. Teste os endpoints afetados';
  RAISE NOTICE '========================================';
END $$;

