-- Migration: v43_operator_kpi_matviews
-- Materialized views para KPIs (evita NaN/0 e consulta pesada)

-- ============================================
-- MV_OPERATOR_KPIS
-- ============================================
create materialized view if not exists public.mv_operator_kpis as
select * from public.v_operator_dashboard_kpis_secure;

-- Índice único para performance e refresh concurrent
create unique index if not exists mv_operator_kpis_company_idx 
  on public.mv_operator_kpis(company_id);

-- ============================================
-- FUNÇÃO DE REFRESH
-- ============================================
create or replace function public.refresh_mv_operator_kpis()
returns void 
language sql 
security definer 
as $$
  refresh materialized view concurrently public.mv_operator_kpis;
$$;

-- Comentário
comment on function public.refresh_mv_operator_kpis() is 
  'Atualiza materialized view de KPIs. Deve ser chamada via cron (ex: Vercel Cron) a cada 5 minutos.';
