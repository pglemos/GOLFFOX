-- Script para adicionar colunas ausentes nas tabelas existentes
-- Baseado nos erros encontrados durante os testes

-- 1. Adicionar colunas ausentes na tabela companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Adicionar colunas ausentes na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 3. Adicionar colunas ausentes na tabela vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model VARCHAR(255);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 4. Adicionar colunas ausentes na tabela routes
ALTER TABLE routes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 5. Criar tabela drivers se não existir
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_category VARCHAR(10) NOT NULL,
    license_expiry DATE,
    company_id UUID REFERENCES companies(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabela bus_stops se não existir
CREATE TABLE IF NOT EXISTS bus_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    company_id UUID REFERENCES companies(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Adicionar colunas ausentes na tabela trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES routes(id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled';

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_license ON drivers(license_number);
CREATE INDEX IF NOT EXISTS idx_bus_stops_company_id ON bus_stops(company_id);
CREATE INDEX IF NOT EXISTS idx_bus_stops_location ON bus_stops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- 9. Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas que têm updated_at
DO $$
BEGIN
    -- drivers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_drivers_updated_at') THEN
        CREATE TRIGGER update_drivers_updated_at
            BEFORE UPDATE ON drivers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- bus_stops
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bus_stops_updated_at') THEN
        CREATE TRIGGER update_bus_stops_updated_at
            BEFORE UPDATE ON bus_stops
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 10. Habilitar RLS nas novas tabelas
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_stops ENABLE ROW LEVEL SECURITY;

-- 11. Criar políticas RLS básicas
-- Políticas para drivers
CREATE POLICY IF NOT EXISTS "drivers_company_isolation" ON drivers
    FOR ALL USING (company_id = current_setting('app.current_company_id', true)::UUID);

-- Políticas para bus_stops
CREATE POLICY IF NOT EXISTS "bus_stops_company_isolation" ON bus_stops
    FOR ALL USING (company_id = current_setting('app.current_company_id', true)::UUID);

-- 12. Comentários nas tabelas
COMMENT ON TABLE drivers IS 'Tabela de motoristas do sistema';
COMMENT ON TABLE bus_stops IS 'Tabela de pontos de ônibus/paradas';

COMMENT ON COLUMN drivers.license_number IS 'Número da carteira de habilitação';
COMMENT ON COLUMN drivers.license_category IS 'Categoria da CNH (A, B, C, D, E)';
COMMENT ON COLUMN drivers.license_expiry IS 'Data de vencimento da CNH';

COMMENT ON COLUMN bus_stops.latitude IS 'Latitude do ponto de parada';
COMMENT ON COLUMN bus_stops.longitude IS 'Longitude do ponto de parada';

-- Finalização
SELECT 'Colunas e tabelas ausentes adicionadas com sucesso!' as resultado;