-- Script para popular Materialized Views
-- Execute este script no Supabase SQL Editor

-- 1. Popular mv_operator_kpis
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_operator_kpis;

-- 2. Verificar se está populada
SELECT COUNT(*) as row_count FROM public.mv_operator_kpis;

-- 3. (Opcional) Popular mv_admin_kpis também (caso precise refresh)
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_admin_kpis;

-- 4. Verificar ambas
SELECT 
  'mv_admin_kpis' as view_name,
  COUNT(*) as row_count 
FROM public.mv_admin_kpis
UNION ALL
SELECT 
  'mv_operator_kpis' as view_name,
  COUNT(*) as row_count 
FROM public.mv_operator_kpis;

