-- ====================================================
-- GolfFox Transport Management System
-- Consolidate Address Columns Migration
-- Date: 2025-01-XX
-- ====================================================
-- This migration consolidates duplicate migrations:
-- - supabase/migrations/20241203_add_address_columns.sql
-- - supabase/migrations/20241203_add_missing_columns.sql
--
-- Both migrations are identical and add the same columns.
-- This migration is idempotent and can be run multiple times safely.

-- ====================================================
-- PART 1: ADD ADDRESS COLUMNS TO USERS TABLE
-- ====================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cnh VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(5);

-- ====================================================
-- PART 2: ADD COLUMNS TO VEHICLES TABLE
-- ====================================================

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS chassis VARCHAR(50);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS renavam VARCHAR(20);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS carrier_id UUID;

-- ====================================================
-- PART 3: COMMENTS FOR DOCUMENTATION
-- ====================================================

COMMENT ON COLUMN public.users.address_zip_code IS 'CEP do endereço do usuário';
COMMENT ON COLUMN public.users.address_street IS 'Rua do endereço do usuário';
COMMENT ON COLUMN public.users.address_number IS 'Número do endereço do usuário';
COMMENT ON COLUMN public.users.address_neighborhood IS 'Bairro do endereço do usuário';
COMMENT ON COLUMN public.users.address_complement IS 'Complemento do endereço do usuário';
COMMENT ON COLUMN public.users.address_city IS 'Cidade do endereço do usuário';
COMMENT ON COLUMN public.users.address_state IS 'Estado do endereço do usuário (UF)';
COMMENT ON COLUMN public.users.cnh IS 'Número da CNH do motorista';
COMMENT ON COLUMN public.users.cnh_category IS 'Categoria da CNH (A, B, C, D, E)';

COMMENT ON COLUMN public.vehicles.chassis IS 'Número do chassi do veículo';
COMMENT ON COLUMN public.vehicles.renavam IS 'Número do RENAVAM do veículo';
COMMENT ON COLUMN public.vehicles.color IS 'Cor do veículo';
COMMENT ON COLUMN public.vehicles.fuel_type IS 'Tipo de combustível do veículo';
COMMENT ON COLUMN public.vehicles.vehicle_type IS 'Tipo de veículo (ônibus, van, etc.)';
COMMENT ON COLUMN public.vehicles.carrier_id IS 'ID da transportadora proprietária do veículo';

-- ====================================================
-- END OF MIGRATION
-- ====================================================

