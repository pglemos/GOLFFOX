-- Migration: Renomear tabelas/views de operator para operador
-- GolfFox - Padronização de Nomenclatura PT-BR
-- Data: 2025-01-27
--
-- IMPORTANTE: Esta migration deve ser aplicada após atualizar todo o código
-- que referencia essas estruturas para usar os novos nomes em português.

-- ============================================
-- 1. Renomear tabelas gf_operator_*
-- ============================================

-- gf_operator_settings → gf_operador_settings
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_operator_settings') THEN
    ALTER TABLE public.gf_operator_settings RENAME TO gf_operador_settings;
    RAISE NOTICE 'Tabela gf_operator_settings renomeada para gf_operador_settings';
  END IF;
END $$;

-- gf_operator_incidents → gf_operador_incidents
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_operator_incidents') THEN
    ALTER TABLE public.gf_operator_incidents RENAME TO gf_operador_incidents;
    RAISE NOTICE 'Tabela gf_operator_incidents renomeada para gf_operador_incidents';
  END IF;
END $$;

-- gf_operator_documents → gf_operador_documents
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_operator_documents') THEN
    ALTER TABLE public.gf_operator_documents RENAME TO gf_operador_documents;
    RAISE NOTICE 'Tabela gf_operator_documents renomeada para gf_operador_documents';
  END IF;
END $$;

-- gf_operator_audits → gf_operador_audits
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_operator_audits') THEN
    ALTER TABLE public.gf_operator_audits RENAME TO gf_operador_audits;
    RAISE NOTICE 'Tabela gf_operator_audits renomeada para gf_operador_audits';
  END IF;
END $$;

-- ============================================
-- 2. Renomear views v_operator_*
-- ============================================
-- Para views, precisamos recriar com novo nome e depois dropar a antiga
-- Usamos pg_get_viewdef para obter a definição original

-- v_operator_dashboard_kpis → v_operador_dashboard_kpis
DO $$ 
DECLARE
  view_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_operator_dashboard_kpis') THEN
    -- Obter definição da view
    SELECT pg_get_viewdef('public.v_operator_dashboard_kpis', true) INTO view_def;
    -- Criar nova view
    EXECUTE format('CREATE OR REPLACE VIEW public.v_operador_dashboard_kpis AS %s', view_def);
    -- Dropar view antiga
    DROP VIEW IF EXISTS public.v_operator_dashboard_kpis;
    RAISE NOTICE 'View v_operator_dashboard_kpis renomeada para v_operador_dashboard_kpis';
  END IF;
END $$;

-- v_operator_dashboard_kpis_secure → v_operador_dashboard_kpis_secure
DO $$ 
DECLARE
  view_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_operator_dashboard_kpis_secure') THEN
    SELECT pg_get_viewdef('public.v_operator_dashboard_kpis_secure', true) INTO view_def;
    EXECUTE format('CREATE OR REPLACE VIEW public.v_operador_dashboard_kpis_secure AS %s', view_def);
    DROP VIEW IF EXISTS public.v_operator_dashboard_kpis_secure;
    RAISE NOTICE 'View v_operator_dashboard_kpis_secure renomeada para v_operador_dashboard_kpis_secure';
  END IF;
END $$;

-- v_operator_routes → v_operador_routes
DO $$ 
DECLARE
  view_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_operator_routes') THEN
    SELECT pg_get_viewdef('public.v_operator_routes', true) INTO view_def;
    EXECUTE format('CREATE OR REPLACE VIEW public.v_operador_routes AS %s', view_def);
    DROP VIEW IF EXISTS public.v_operator_routes;
    RAISE NOTICE 'View v_operator_routes renomeada para v_operador_routes';
  END IF;
END $$;

-- v_operator_routes_secure → v_operador_routes_secure
DO $$ 
DECLARE
  view_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_operator_routes_secure') THEN
    SELECT pg_get_viewdef('public.v_operator_routes_secure', true) INTO view_def;
    EXECUTE format('CREATE OR REPLACE VIEW public.v_operador_routes_secure AS %s', view_def);
    DROP VIEW IF EXISTS public.v_operator_routes_secure;
    RAISE NOTICE 'View v_operator_routes_secure renomeada para v_operador_routes_secure';
  END IF;
END $$;

-- v_operator_alerts → v_operador_alerts
DO $$ 
DECLARE
  view_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_operator_alerts') THEN
    SELECT pg_get_viewdef('public.v_operator_alerts', true) INTO view_def;
    EXECUTE format('CREATE OR REPLACE VIEW public.v_operador_alerts AS %s', view_def);
    DROP VIEW IF EXISTS public.v_operator_alerts;
    RAISE NOTICE 'View v_operator_alerts renomeada para v_operador_alerts';
  END IF;
END $$;

-- v_operator_alerts_secure → v_operador_alerts_secure
DO $$ 
DECLARE
  view_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_operator_alerts_secure') THEN
    SELECT pg_get_viewdef('public.v_operator_alerts_secure', true) INTO view_def;
    EXECUTE format('CREATE OR REPLACE VIEW public.v_operador_alerts_secure AS %s', view_def);
    DROP VIEW IF EXISTS public.v_operator_alerts_secure;
    RAISE NOTICE 'View v_operator_alerts_secure renomeada para v_operador_alerts_secure';
  END IF;
END $$;

-- v_operator_costs → v_operador_costs
DO $$ 
DECLARE
  view_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_operator_costs') THEN
    SELECT pg_get_viewdef('public.v_operator_costs', true) INTO view_def;
    EXECUTE format('CREATE OR REPLACE VIEW public.v_operador_costs AS %s', view_def);
    DROP VIEW IF EXISTS public.v_operator_costs;
    RAISE NOTICE 'View v_operator_costs renomeada para v_operador_costs';
  END IF;
END $$;

-- v_operator_costs_secure → v_operador_costs_secure
DO $$ 
DECLARE
  view_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_operator_costs_secure') THEN
    SELECT pg_get_viewdef('public.v_operator_costs_secure', true) INTO view_def;
    EXECUTE format('CREATE OR REPLACE VIEW public.v_operador_costs_secure AS %s', view_def);
    DROP VIEW IF EXISTS public.v_operator_costs_secure;
    RAISE NOTICE 'View v_operator_costs_secure renomeada para v_operador_costs_secure';
  END IF;
END $$;

-- v_operator_assigned_carriers → v_operador_assigned_carriers
DO $$ 
DECLARE
  view_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_operator_assigned_carriers') THEN
    SELECT pg_get_viewdef('public.v_operator_assigned_carriers', true) INTO view_def;
    EXECUTE format('CREATE OR REPLACE VIEW public.v_operador_assigned_carriers AS %s', view_def);
    DROP VIEW IF EXISTS public.v_operator_assigned_carriers;
    RAISE NOTICE 'View v_operator_assigned_carriers renomeada para v_operador_assigned_carriers';
  END IF;
END $$;

-- v_operator_kpis → v_operador_kpis (se existir)
DO $$ 
DECLARE
  view_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_operator_kpis') THEN
    SELECT pg_get_viewdef('public.v_operator_kpis', true) INTO view_def;
    EXECUTE format('CREATE OR REPLACE VIEW public.v_operador_kpis AS %s', view_def);
    DROP VIEW IF EXISTS public.v_operator_kpis;
    RAISE NOTICE 'View v_operator_kpis renomeada para v_operador_kpis';
  END IF;
END $$;

-- ============================================
-- 3. Renomear materialized views mv_operator_*
-- ============================================

-- mv_operator_kpis → mv_operador_kpis
DO $$ 
DECLARE
  matview_def TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_operator_kpis') THEN
    -- Obter definição da materialized view
    SELECT pg_get_viewdef('public.mv_operator_kpis', true) INTO matview_def;
    -- Criar nova materialized view
    EXECUTE format('CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_operador_kpis AS %s', matview_def);
    -- Dropar materialized view antiga
    DROP MATERIALIZED VIEW IF EXISTS public.mv_operator_kpis;
    RAISE NOTICE 'Materialized view mv_operator_kpis renomeada para mv_operador_kpis';
  END IF;
END $$;

-- ============================================
-- 4. Renomear funções refresh_mv_operator_*
-- ============================================

-- refresh_mv_operator_kpis → refresh_mv_operador_kpis
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'refresh_mv_operator_kpis') THEN
    -- Dropar função antiga
    DROP FUNCTION IF EXISTS public.refresh_mv_operator_kpis();
    -- Criar nova função
    CREATE OR REPLACE FUNCTION public.refresh_mv_operador_kpis()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_operador_kpis;
    END;
    $$;
    RAISE NOTICE 'Função refresh_mv_operator_kpis renomeada para refresh_mv_operador_kpis';
  END IF;
END $$;

-- ============================================
-- 5. Atualizar RLS Policies (se necessário)
-- ============================================
-- As policies que referenciam as tabelas renomeadas serão atualizadas automaticamente
-- pelo PostgreSQL, mas podemos verificar se há policies específicas que precisam ser atualizadas

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration concluída!';
  RAISE NOTICE 'Verifique se todas as estruturas foram renomeadas corretamente:';
  RAISE NOTICE '========================================';
END $$;
