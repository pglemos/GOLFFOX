-- =====================================================
-- SCRIPT DE CORREÇÃO DO SCHEMA DO BANCO DE DADOS
-- Execute este script no Supabase Dashboard → SQL Editor
-- =====================================================

-- =====================================================
-- 1. TABELA USERS - Adicionar colunas de endereço
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS transportadora_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =====================================================
-- 2. TABELA VEHICLES - Adicionar colunas faltantes
-- =====================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS plate VARCHAR(10);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chassis VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS renavam VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transportadora_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS carrier_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =====================================================
-- 3. TABELA DRIVERS - Criar se não existir e adicionar colunas
-- =====================================================
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    cpf VARCHAR(14),
    cnh VARCHAR(20),
    cnh_category VARCHAR(5),
    cnh_expiry DATE,
    transportadora_id UUID,
    carrier_id UUID,
    company_id UUID,
    role VARCHAR(50) DEFAULT 'driver',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existir
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cnh VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(5);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cnh_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS transportadora_id UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS carrier_id UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'driver';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);

-- =====================================================
-- 4. TABELA CARRIERS (TRANSPORTADORAS) - Adicionar colunas
-- =====================================================
CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE carriers ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);

-- =====================================================
-- 5. TABELA COMPANIES (EMPRESAS) - Adicionar colunas
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =====================================================
-- 6. ÍNDICES ÚTEIS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_transportadora_id ON drivers(transportadora_id);
CREATE INDEX IF NOT EXISTS idx_carriers_cnpj ON carriers(cnpj);

-- =====================================================
-- 7. MENSAGEM DE SUCESSO
-- =====================================================
SELECT 'Schema atualizado com sucesso!' as status;

