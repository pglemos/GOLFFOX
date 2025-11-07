-- ============================================
-- GolfFox v44.0 - Materialized Views de Custos
-- ============================================

-- 1. MATERIALIZED VIEW: Agregados Mensais
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_costs_monthly AS
SELECT 
  c.company_id,
  c.carrier_id,
  c.route_id,
  c.vehicle_id,
  DATE_PART('month', c.date) AS period_month,
  EXTRACT(YEAR FROM c.date) AS period_year,
  -- Totais
  COUNT(*) AS cost_records_count,
  COALESCE(SUM(c.amount), 0) AS total_amount,
  COALESCE(SUM(c.qty), 0) AS total_qty,
  -- Por Grupo
  jsonb_object_agg(
    cat.group_name,
    COALESCE(SUM(c.amount) FILTER (WHERE cat.group_name = cat.group_name), 0)
  ) FILTER (WHERE cat.group_name IS NOT NULL) AS by_group,
  -- Por Categoria (JSONB agregado)
  jsonb_agg(
    DISTINCT jsonb_build_object(
      'category_id', cat.id,
      'group_name', cat.group_name,
      'category', cat.category,
      'amount', SUM(c.amount) FILTER (WHERE c.cost_category_id = cat.id)
    )
  ) AS by_category,
  -- KM e Viagens (se disponível)
  COALESCE(SUM(vc.km), 0) AS total_km,
  COUNT(DISTINCT t.id) AS total_trips,
  -- Timestamps
  MIN(c.date) AS first_cost_date,
  MAX(c.date) AS last_cost_date,
  NOW() AS refreshed_at
FROM public.gf_costs c
JOIN public.gf_cost_categories cat ON cat.id = c.cost_category_id
LEFT JOIN public.gf_vehicle_costs vc ON vc.vehicle_id = c.vehicle_id 
  AND vc.route_id = c.route_id
  AND DATE_TRUNC('month', vc.date) = DATE_TRUNC('month', c.date)
LEFT JOIN public.trips t ON t.route_id = c.route_id 
  AND t.vehicle_id = c.vehicle_id
  AND DATE_TRUNC('month', t.scheduled_at) = DATE_TRUNC('month', c.date)
WHERE cat.is_active = true
GROUP BY 
  c.company_id,
  c.carrier_id,
  c.route_id,
  c.vehicle_id,
  DATE_PART('month', c.date),
  EXTRACT(YEAR FROM c.date);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mv_costs_monthly_company_period 
  ON public.mv_costs_monthly(company_id, period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_mv_costs_monthly_route 
  ON public.mv_costs_monthly(route_id) WHERE route_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mv_costs_monthly_vehicle 
  ON public.mv_costs_monthly(vehicle_id) WHERE vehicle_id IS NOT NULL;

COMMENT ON MATERIALIZED VIEW public.mv_costs_monthly IS 'Agregados mensais de custos por dimensões (empresa, transportadora, rota, veículo) para performance';

-- 2. Função para Refresh da Materialized View
-- ============================================
CREATE OR REPLACE FUNCTION public.refresh_mv_costs_monthly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_costs_monthly;
END;
$$;

COMMENT ON FUNCTION public.refresh_mv_costs_monthly() IS 'Refresh da materialized view de custos mensais (chamada via cron)';

-- 3. RLS na Materialized View (herdado da tabela base via policies)
-- RLS não se aplica diretamente a matviews, mas os dados já estão filtrados na criação
-- Acesso será controlado via views que usam a matview

