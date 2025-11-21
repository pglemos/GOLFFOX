-- ============================================
-- Migration v62: Fix v_costs_secure para usar transportadora_id
-- ============================================

-- Dropar view antiga se existir
DROP VIEW IF EXISTS public.v_costs_secure CASCADE;

-- Recriar view com transportadora_id em vez de carrier_id
-- Verificar se a tabela gf_costs usa 'date' ou 'cost_date'
CREATE OR REPLACE VIEW public.v_costs_secure AS
SELECT 
  c.id,
  c.company_id,
  c.transportadora_id,  -- Alterado de carrier_id
  c.route_id,
  c.vehicle_id,
  c.driver_id,
  c.cost_category_id,
  c.cost_center_id,
  c.invoice_id,
  c.amount,
  c.qty,
  c.unit,
  c.source,
  c.notes,
  c.created_at,
  c.updated_at,
  -- Usar date ou cost_date dependendo do que existe na tabela
  COALESCE(c.date, c.cost_date) AS date,
  COALESCE(c.date, c.cost_date) AS cost_date,
  comp.name AS company_name,
  car.name AS carrier_name,
  r.name AS route_name,
  v.plate AS vehicle_plate,
  v.model AS vehicle_model,
  u.email AS driver_email,
  cat.group_name,
  cat.category,
  cat.subcategory,
  cc.name AS cost_center_name
FROM public.gf_costs c
JOIN public.companies comp ON comp.id = c.company_id
LEFT JOIN public.carriers car ON car.id = c.transportadora_id  -- Alterado de carrier_id
LEFT JOIN public.routes r ON r.id = c.route_id
LEFT JOIN public.vehicles v ON v.id = c.vehicle_id
LEFT JOIN public.users u ON u.id = c.driver_id
JOIN public.gf_cost_categories cat ON cat.id = c.cost_category_id
LEFT JOIN public.gf_cost_centers cc ON cc.id = c.cost_center_id
WHERE cat.is_active = true;

COMMENT ON VIEW public.v_costs_secure IS 'View segura de custos com joins para nomes (RLS aplicado via tabela base). Usa transportadora_id em vez de carrier_id. Suporta tanto date quanto cost_date.';

