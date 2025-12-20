-- Migration: Renomear tabelas/views de operator para operador
-- GolfFox - Padronização de Nomenclatura PT-BR
-- Data: 2025-01-27

-- ============================================
-- 1. Renomear tabelas gf_operator_*
-- ============================================

-- gf_operator_settings → gf_operador_settings
ALTER TABLE IF EXISTS public.gf_operator_settings RENAME TO gf_operador_settings;

-- gf_operator_incidents → gf_operador_incidents
ALTER TABLE IF EXISTS public.gf_operator_incidents RENAME TO gf_operador_incidents;

-- gf_operator_documents → gf_operador_documents
ALTER TABLE IF EXISTS public.gf_operator_documents RENAME TO gf_operador_documents;

-- gf_operator_audits → gf_operador_audits
ALTER TABLE IF EXISTS public.gf_operator_audits RENAME TO gf_operador_audits;

-- ============================================
-- 2. Renomear views v_operator_*
-- ============================================

-- v_operator_dashboard_kpis → v_operador_dashboard_kpis
DROP VIEW IF EXISTS public.v_operador_dashboard_kpis;
CREATE OR REPLACE VIEW public.v_operador_dashboard_kpis AS
SELECT * FROM public.v_operator_dashboard_kpis;
DROP VIEW IF EXISTS public.v_operator_dashboard_kpis;

-- v_operator_dashboard_kpis_secure → v_operador_dashboard_kpis_secure
DROP VIEW IF EXISTS public.v_operador_dashboard_kpis_secure;
CREATE OR REPLACE VIEW public.v_operador_dashboard_kpis_secure AS
SELECT * FROM public.v_operator_dashboard_kpis_secure;
DROP VIEW IF EXISTS public.v_operator_dashboard_kpis_secure;

-- v_operator_routes → v_operador_routes
DROP VIEW IF EXISTS public.v_operador_routes;
CREATE OR REPLACE VIEW public.v_operador_routes AS
SELECT * FROM public.v_operator_routes;
DROP VIEW IF EXISTS public.v_operator_routes;

-- v_operator_routes_secure → v_operador_routes_secure
DROP VIEW IF EXISTS public.v_operador_routes_secure;
CREATE OR REPLACE VIEW public.v_operador_routes_secure AS
SELECT * FROM public.v_operator_routes_secure;
DROP VIEW IF EXISTS public.v_operator_routes_secure;

-- v_operator_alerts → v_operador_alerts
DROP VIEW IF EXISTS public.v_operador_alerts;
CREATE OR REPLACE VIEW public.v_operador_alerts AS
SELECT * FROM public.v_operator_alerts;
DROP VIEW IF EXISTS public.v_operator_alerts;

-- v_operator_alerts_secure → v_operador_alerts_secure
DROP VIEW IF EXISTS public.v_operador_alerts_secure;
CREATE OR REPLACE VIEW public.v_operador_alerts_secure AS
SELECT * FROM public.v_operator_alerts_secure;
DROP VIEW IF EXISTS public.v_operator_alerts_secure;

-- v_operator_costs → v_operador_costs
DROP VIEW IF EXISTS public.v_operador_costs;
CREATE OR REPLACE VIEW public.v_operador_costs AS
SELECT * FROM public.v_operator_costs;
DROP VIEW IF EXISTS public.v_operator_costs;

-- v_operator_costs_secure → v_operador_costs_secure
DROP VIEW IF EXISTS public.v_operador_costs_secure;
CREATE OR REPLACE VIEW public.v_operador_costs_secure AS
SELECT * FROM public.v_operator_costs_secure;
DROP VIEW IF EXISTS public.v_operator_costs_secure;

-- v_operator_assigned_carriers → v_operador_assigned_carriers
DROP VIEW IF EXISTS public.v_operador_assigned_carriers;
CREATE OR REPLACE VIEW public.v_operador_assigned_carriers AS
SELECT * FROM public.v_operator_assigned_carriers;
DROP VIEW IF EXISTS public.v_operator_assigned_carriers;

-- ============================================
-- 3. Renomear materialized views mv_operator_*
-- ============================================

-- mv_operator_kpis → mv_operador_kpis
DROP MATERIALIZED VIEW IF EXISTS public.mv_operador_kpis;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_operador_kpis AS
SELECT * FROM public.mv_operator_kpis;
DROP MATERIALIZED VIEW IF EXISTS public.mv_operator_kpis;

-- ============================================
-- 4. Renomear funções refresh_mv_operator_*
-- ============================================

-- refresh_mv_operator_kpis → refresh_mv_operador_kpis
CREATE OR REPLACE FUNCTION public.refresh_mv_operador_kpis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_operador_kpis;
END;
$$;

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- Esta migration renomeia as estruturas do banco de dados.
-- As views antigas serão removidas após criar as novas.
-- Certifique-se de atualizar o código que referencia essas views
-- antes de aplicar esta migration em produção.
--
-- Para aplicar:
-- 1. Atualizar todo o código que referencia essas tabelas/views
-- 2. Aplicar esta migration
-- 3. Testar completamente antes de fazer deploy

