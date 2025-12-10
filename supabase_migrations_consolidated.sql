-- ============================================
-- GOLFFOX - MIGRATIONS CONSOLIDADAS
-- Execute este script no SQL Editor do Supabase
-- https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/sql
-- ============================================

-- ============================================
-- PARTE 1: CAMPOS BANCÁRIOS E REPRESENTANTE LEGAL (CARRIERS)
-- ============================================

-- Campos Bancários
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_agency TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_account_type TEXT DEFAULT 'corrente';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cnpj';

-- Campos do Representante Legal
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_name TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_cpf TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_rg TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_email TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_phone TEXT;

-- ============================================
-- PARTE 2: TABELA TRIP_PASSENGERS (FALTANDO)
-- ============================================

CREATE TABLE IF NOT EXISTS public.trip_passengers (
    trip_id UUID NOT NULL,
    passenger_id UUID NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarded', 'no_show', 'cancelled')),
    boarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (trip_id, passenger_id)
);

-- Habilitar RLS
ALTER TABLE public.trip_passengers ENABLE ROW LEVEL SECURITY;

-- Policy para service role
CREATE POLICY "Service role full access on trip_passengers" 
ON public.trip_passengers FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- ============================================
-- PARTE 3: COLUNAS EXTRAS EM VEHICLES
-- ============================================

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chassis VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS renavam VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS carrier_id UUID;

-- ============================================
-- PARTE 4: COLUNAS DE ENDEREÇO EM USERS
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnh VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(5);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar colunas carriers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'carriers' 
  AND column_name LIKE 'bank_%' OR column_name LIKE 'legal_rep_%'
ORDER BY column_name;
