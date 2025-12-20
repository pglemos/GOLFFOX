-- Migration: Add address columns to users and vehicles tables
-- Date: 2024-12-03

-- Add address columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnh VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(5);

-- Add columns to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chassis VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS renavam VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS veiculo_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transportadora_id UUID;

