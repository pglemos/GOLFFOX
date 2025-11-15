-- =====================================================
-- Fix: Correções de problemas encontrados no Supabase
-- Data: 2025-11-13T04:20:48.730Z
-- =====================================================

-- add_is_active_to_routes
-- Adicionar coluna is_active em routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Atualizar registros existentes
UPDATE routes SET is_active = true WHERE is_active IS NULL;

-- add_is_active_to_users
-- Adicionar coluna is_active em users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Atualizar registros existentes
UPDATE users SET is_active = true WHERE is_active IS NULL;

