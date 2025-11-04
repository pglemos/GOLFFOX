-- Migration: v43_admin_matviews
-- Materialized views para KPIs admin (evita consultas pesadas, cache de dados)
-- Deve ser refreshada via cron (ex: Vercel Cron) a cada 5 minutos

-- ============================================
-- MV_ADMIN_KPIS
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_admin_kpis AS
SELECT 
  company_id,
  CURRENT_DATE AS snapshot_date,
  trips_today,
  vehicles_active,
  employees_in_transit,
  critical_alerts,
  routes_today
FROM public.v_admin_dashboard_kpis;

-- Índice único para performance e refresh concurrent
CREATE UNIQUE INDEX IF NOT EXISTS mv_admin_kpis_company_snapshot_idx 
  ON public.mv_admin_kpis(company_id, snapshot_date);

-- Índice para busca por snapshot_date
CREATE INDEX IF NOT EXISTS mv_admin_kpis_snapshot_idx 
  ON public.mv_admin_kpis(snapshot_date DESC);

-- ============================================
-- FUNÇÃO DE REFRESH
-- ============================================
CREATE OR REPLACE FUNCTION public.refresh_mv_admin_kpis()
RETURNS void 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_admin_kpis;
$$;

-- Comentários
COMMENT ON MATERIALIZED VIEW public.mv_admin_kpis IS 
  'Materialized view de KPIs admin. Cache de dados para performance. Deve ser refreshada via cron a cada 5 minutos.';

COMMENT ON FUNCTION public.refresh_mv_admin_kpis() IS 
  'Atualiza materialized view de KPIs admin. Deve ser chamada via cron (ex: Vercel Cron) a cada 5 minutos.';

-- ============================================
-- FUNÇÃO DE REFRESH COM CLEANUP
-- ============================================
-- Opcional: limpar snapshots antigos (manter apenas últimos 7 dias)
CREATE OR REPLACE FUNCTION public.refresh_mv_admin_kpis_with_cleanup()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Refresh da materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_admin_kpis;
  
  -- Limpar snapshots antigos (opcional, comentado por padrão)
  -- DELETE FROM public.mv_admin_kpis 
  -- WHERE snapshot_date < CURRENT_DATE - INTERVAL '7 days';
END;
$$;

COMMENT ON FUNCTION public.refresh_mv_admin_kpis_with_cleanup() IS 
  'Atualiza materialized view e opcionalmente limpa snapshots antigos.';

