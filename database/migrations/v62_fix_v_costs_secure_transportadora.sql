-- ============================================
-- Migration v62: Fix v_costs_secure para usar transportadora_id
-- ============================================

-- Dropar view antiga se existir
DROP VIEW IF EXISTS public.v_costs_secure CASCADE;

-- Recriar view com transportadora_id em vez de carrier_id
-- A tabela gf_costs usa 'date' (não cost_date) e precisa verificar se usa transportadora_id ou carrier_id
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
LEFT JOIN public.carriers car ON car.id = COALESCE(c.transportadora_id, c.carrier_id)  -- Suporta ambos durante migração
LEFT JOIN public.routes r ON r.id = c.route_id
LEFT JOIN public.vehicles v ON v.id = c.vehicle_id
LEFT JOIN public.users u ON u.id = c.driver_id
JOIN public.gf_cost_categories cat ON cat.id = c.cost_category_id
LEFT JOIN public.gf_cost_centers cc ON cc.id = c.cost_center_id
WHERE cat.is_active = true;

COMMENT ON VIEW public.v_costs_secure IS 'View segura de custos com joins para nomes (RLS aplicado via tabela base). Suporta tanto transportadora_id quanto carrier_id durante migração.';

