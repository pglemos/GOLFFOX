-- ============================================================================
-- Migration: Renomear TODAS as tabelas para nomenclatura PT-BR
-- GolfFox - Padronização Completa de Nomenclatura
-- Data: 2025-01-27
-- ============================================================================
-- 
-- Esta migration renomeia TODAS as tabelas principais do sistema para
-- nomenclatura PT-BR padronizada:
-- - carriers → transportadoras
-- - drivers → motoristas  
-- - vehicles → veiculos
-- - passengers → passageiros
-- - operators → operadores (se existir)
--
-- IMPORTANTE: Esta migration deve ser aplicada APÓS atualizar todo o código
-- que referencia essas tabelas, ou aplicar junto com atualização do código.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. RENOMEAR TABELAS PRINCIPAIS
-- ============================================================================

-- carriers → transportadoras
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'carriers') THEN
    ALTER TABLE IF EXISTS public.carriers RENAME TO transportadoras;
    RAISE NOTICE 'Tabela carriers renomeada para transportadoras';
  END IF;
END $$;

-- drivers → motoristas (se existir como tabela separada)
-- Nota: motoristas geralmente estão na tabela users com role='motorista'
-- Mas se houver tabela drivers separada, renomear
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drivers') THEN
    ALTER TABLE IF EXISTS public.drivers RENAME TO motoristas;
    RAISE NOTICE 'Tabela drivers renomeada para motoristas';
  END IF;
END $$;

-- vehicles → veiculos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
    ALTER TABLE IF EXISTS public.vehicles RENAME TO veiculos;
    RAISE NOTICE 'Tabela vehicles renomeada para veiculos';
  END IF;
END $$;

-- passengers → passageiros
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'passengers') THEN
    ALTER TABLE IF EXISTS public.passengers RENAME TO passageiros;
    RAISE NOTICE 'Tabela passengers renomeada para passageiros';
  END IF;
END $$;

-- operators → operadores (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'operators') THEN
    ALTER TABLE IF EXISTS public.operators RENAME TO operadores;
    RAISE NOTICE 'Tabela operators renomeada para operadores';
  END IF;
END $$;

-- ============================================================================
-- 2. RENOMEAR TABELAS gf_* (se necessário)
-- ============================================================================

-- gf_carriers → gf_transportadoras (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_carriers') THEN
    ALTER TABLE IF EXISTS public.gf_carriers RENAME TO gf_transportadoras;
    RAISE NOTICE 'Tabela gf_carriers renomeada para gf_transportadoras';
  END IF;
END $$;

-- gf_drivers → gf_motoristas (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_drivers') THEN
    ALTER TABLE IF EXISTS public.gf_drivers RENAME TO gf_motoristas;
    RAISE NOTICE 'Tabela gf_drivers renomeada para gf_motoristas';
  END IF;
END $$;

-- gf_vehicles → gf_veiculos (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gf_vehicles') THEN
    ALTER TABLE IF EXISTS public.gf_vehicles RENAME TO gf_veiculos;
    RAISE NOTICE 'Tabela gf_vehicles renomeada para gf_veiculos';
  END IF;
END $$;

-- ============================================================================
-- 3. ATUALIZAR RLS POLICIES (se necessário)
-- ============================================================================

-- As políticas RLS serão atualizadas automaticamente quando as tabelas forem renomeadas
-- Mas podemos verificar e recriar se necessário

-- ============================================================================
-- 4. ATUALIZAR FOREIGN KEYS E CONSTRAINTS
-- ============================================================================

-- As foreign keys serão mantidas automaticamente pelo PostgreSQL
-- Mas podemos verificar se há constraints nomeadas que precisam ser atualizadas

-- ============================================================================
-- 5. ATUALIZAR ÍNDICES (se necessário)
-- ============================================================================

-- Os índices serão mantidos automaticamente pelo PostgreSQL
-- Mas podemos verificar se há índices nomeados que precisam ser atualizados

COMMIT;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Esta migration usa DO blocks para verificar existência antes de renomear
-- 2. Todas as foreign keys, constraints e índices são mantidos automaticamente
-- 3. As views e funções que referenciam essas tabelas precisam ser atualizadas
-- 4. O código da aplicação deve ser atualizado ANTES ou JUNTO com esta migration
-- 5. Testar completamente após aplicar esta migration
-- ============================================================================

