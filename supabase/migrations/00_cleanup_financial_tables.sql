-- ============================================================
-- PASSO 1: Limpar estrutura antiga (EXECUTAR PRIMEIRO)
-- ============================================================
-- Este script remove as tabelas do sistema financeiro antigo
-- para permitir a criação da nova estrutura

-- Remover views
DROP VIEW IF EXISTS v_costs_vs_budget_monthly CASCADE;
DROP VIEW IF EXISTS v_admin_financial_kpis CASCADE;
DROP VIEW IF EXISTS v_vehicle_costs_summary CASCADE;

-- Remover funções
DROP FUNCTION IF EXISTS generate_recurring_costs() CASCADE;
DROP FUNCTION IF EXISTS check_budget_alerts() CASCADE;

-- Remover tabelas na ordem correta (respeitando FKs)
DROP TABLE IF EXISTS gf_financial_alerts CASCADE;
DROP TABLE IF EXISTS gf_financial_forecasts CASCADE;
DROP TABLE IF EXISTS gf_budgets CASCADE;
DROP TABLE IF EXISTS gf_manual_revenues CASCADE;
DROP TABLE IF EXISTS gf_manual_costs_v2 CASCADE;
DROP TABLE IF EXISTS gf_cost_categories CASCADE;

-- Confirmar limpeza
SELECT 'Limpeza concluída! Execute o arquivo 20241211_financial_system.sql agora.' as status;
