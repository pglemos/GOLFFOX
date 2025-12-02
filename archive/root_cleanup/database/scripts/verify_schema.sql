-- Script de verificação de schema completo
-- Verifica se todas as tabelas e views necessárias existem
-- Execute este script para diagnosticar problemas de schema

-- ============================================
-- VERIFICAÇÃO DE TABELAS
-- ============================================

-- Tabelas de custos
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_cost_categories')
    THEN '✅ gf_cost_categories existe'
    ELSE '❌ gf_cost_categories NÃO existe'
  END AS status_gf_cost_categories;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_budgets')
    THEN '✅ gf_budgets existe'
    ELSE '❌ gf_budgets NÃO existe'
  END AS status_gf_budgets;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_costs')
    THEN '✅ gf_costs existe'
    ELSE '❌ gf_costs NÃO existe'
  END AS status_gf_costs;

-- Tabelas de mapeamento
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_user_company_map')
    THEN '✅ gf_user_company_map existe'
    ELSE '❌ gf_user_company_map NÃO existe'
  END AS status_gf_user_company_map;

-- Tabelas de agendamento
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_report_schedules')
    THEN '✅ gf_report_schedules existe'
    ELSE '❌ gf_report_schedules NÃO existe'
  END AS status_gf_report_schedules;

-- ============================================
-- VERIFICAÇÃO DE VIEWS
-- ============================================

-- Views de custos
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_costs_kpis')
    THEN '✅ v_costs_kpis existe'
    ELSE '❌ v_costs_kpis NÃO existe'
  END AS status_v_costs_kpis;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_costs_vs_budget')
    THEN '✅ v_costs_vs_budget existe'
    ELSE '❌ v_costs_vs_budget NÃO existe'
  END AS status_v_costs_vs_budget;

-- Views de relatórios
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_reports_delays')
    THEN '✅ v_reports_delays existe'
    ELSE '❌ v_reports_delays NÃO existe'
  END AS status_v_reports_delays;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_reports_occupancy')
    THEN '✅ v_reports_occupancy existe'
    ELSE '❌ v_reports_occupancy NÃO existe'
  END AS status_v_reports_occupancy;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_reports_not_boarded')
    THEN '✅ v_reports_not_boarded existe'
    ELSE '❌ v_reports_not_boarded NÃO existe'
  END AS status_v_reports_not_boarded;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_reports_efficiency')
    THEN '✅ v_reports_efficiency existe'
    ELSE '❌ v_reports_efficiency NÃO existe'
  END AS status_v_reports_efficiency;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_reports_driver_ranking')
    THEN '✅ v_reports_driver_ranking existe'
    ELSE '❌ v_reports_driver_ranking NÃO existe'
  END AS status_v_reports_driver_ranking;

-- ============================================
-- RESUMO GERAL
-- ============================================

-- Contar tabelas existentes
SELECT 
  COUNT(*) AS total_tabelas_custos,
  COUNT(*) FILTER (WHERE table_name = 'gf_cost_categories') AS gf_cost_categories,
  COUNT(*) FILTER (WHERE table_name = 'gf_budgets') AS gf_budgets,
  COUNT(*) FILTER (WHERE table_name = 'gf_costs') AS gf_costs,
  COUNT(*) FILTER (WHERE table_name = 'gf_user_company_map') AS gf_user_company_map,
  COUNT(*) FILTER (WHERE table_name = 'gf_report_schedules') AS gf_report_schedules
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('gf_cost_categories', 'gf_budgets', 'gf_costs', 'gf_user_company_map', 'gf_report_schedules');

-- Contar views existentes
SELECT 
  COUNT(*) AS total_views_custos,
  COUNT(*) FILTER (WHERE table_name = 'v_costs_kpis') AS v_costs_kpis,
  COUNT(*) FILTER (WHERE table_name = 'v_costs_vs_budget') AS v_costs_vs_budget
FROM information_schema.views
WHERE table_schema = 'public' 
  AND table_name IN ('v_costs_kpis', 'v_costs_vs_budget');

SELECT 
  COUNT(*) AS total_views_relatorios,
  COUNT(*) FILTER (WHERE table_name = 'v_reports_delays') AS v_reports_delays,
  COUNT(*) FILTER (WHERE table_name = 'v_reports_occupancy') AS v_reports_occupancy,
  COUNT(*) FILTER (WHERE table_name = 'v_reports_not_boarded') AS v_reports_not_boarded,
  COUNT(*) FILTER (WHERE table_name = 'v_reports_efficiency') AS v_reports_efficiency,
  COUNT(*) FILTER (WHERE table_name = 'v_reports_driver_ranking') AS v_reports_driver_ranking
FROM information_schema.views
WHERE table_schema = 'public' 
  AND table_name IN ('v_reports_delays', 'v_reports_occupancy', 'v_reports_not_boarded', 'v_reports_efficiency', 'v_reports_driver_ranking');

-- ============================================
-- RECOMENDAÇÕES
-- ============================================

-- Se alguma tabela ou view não existir, execute as migrações correspondentes:
-- 1. gf_cost_categories e gf_budgets: database/migrations/v44_costs_taxonomy.sql
-- 2. gf_costs: database/migrations/v44_costs_taxonomy.sql
-- 3. gf_user_company_map: database/migrations/v43_gf_user_company_map.sql
-- 4. gf_report_schedules: database/migrations/v43_report_scheduling.sql
-- 5. v_costs_kpis e v_costs_vs_budget: database/migrations/v44_costs_views.sql
-- 6. v_reports_*: database/migrations/v43_admin_views.sql ou v41_views_kpis.sql

-- Forçar reload do schema cache do Supabase (PostgREST)
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Analisar tabelas para atualizar estatísticas
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_cost_categories') THEN
    ANALYZE public.gf_cost_categories;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_budgets') THEN
    ANALYZE public.gf_budgets;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_costs') THEN
    ANALYZE public.gf_costs;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_user_company_map') THEN
    ANALYZE public.gf_user_company_map;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_report_schedules') THEN
    ANALYZE public.gf_report_schedules;
  END IF;
END $$;

SELECT 'Verificação de schema concluída. Verifique os resultados acima.' AS status;

