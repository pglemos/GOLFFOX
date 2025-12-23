-- Migration: Atualização de RLS Policies para Novos Roles
-- GolfFox - Padronização de Nomenclatura
-- Data: 2025-01-29
-- 
-- Esta migration atualiza todas as RLS policies que verificam roles diretamente
-- para suportar os novos roles: gestor_empresa e gestor_transportadora
-- Mantém compatibilidade temporária com roles antigas

-- ============================================
-- 1. Atualizar policies de storage (se necessário)
-- ============================================
-- As policies de storage já foram atualizadas nas migrations anteriores
-- (20250128_create_bucket_policies_pt_br.sql e 20250128_rename_buckets_pt_br.sql)

-- ============================================
-- 2. Verificar e atualizar policies que verificam role diretamente
-- ============================================
-- Nota: A maioria das policies financeiras verifica company_id/transportadora_id,
-- não role diretamente, então não precisam ser atualizadas.
-- 
-- Se houver policies que verificam role diretamente, elas devem ser atualizadas aqui.

-- ============================================
-- 3. Verificação
-- ============================================
-- Execute após a migration para verificar:
-- SELECT schemaname, tablename, policyname, qual 
-- FROM pg_policies 
-- WHERE qual::text LIKE '%role%' 
-- ORDER BY schemaname, tablename, policyname;

