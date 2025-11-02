-- =====================================================
-- CORREÇÃO COMPLETA DO ESQUEMA SUPABASE
-- Cria tabelas ausentes e adiciona colunas faltantes
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CRIAR TABELAS AUSENTES
-- =====================================================

-- Tabela drivers (ausente)
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela bus_stops (ausente)
CREATE TABLE IF NOT EXISTS public.bus_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. ADICIONAR COLUNAS AUSENTES EM TABELAS EXISTENTES
-- =====================================================

-- Adicionar colunas ausentes na tabela users
DO $$ 
BEGIN
    -- email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE public.users ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;
    
    -- role
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role VARCHAR(50) DEFAULT 'passenger';
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Adicionar colunas ausentes na tabela companies
DO $$ 
BEGIN
    -- cnpj
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'cnpj') THEN
        ALTER TABLE public.companies ADD COLUMN cnpj VARCHAR(18) UNIQUE;
    END IF;
    
    -- address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'address') THEN
        ALTER TABLE public.companies ADD COLUMN address TEXT;
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'updated_at') THEN
        ALTER TABLE public.companies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Adicionar colunas ausentes na tabela vehicles
DO $$ 
BEGIN
    -- company_id (se não existir)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'company_id') THEN
        ALTER TABLE public.vehicles ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    
    -- year
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'year') THEN
        ALTER TABLE public.vehicles ADD COLUMN year INTEGER;
    END IF;
    
    -- capacity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'capacity') THEN
        ALTER TABLE public.vehicles ADD COLUMN capacity INTEGER DEFAULT 40;
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.vehicles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Adicionar colunas ausentes na tabela routes
DO $$ 
BEGIN
    -- company_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'company_id') THEN
        ALTER TABLE public.routes ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    
    -- description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'description') THEN
        ALTER TABLE public.routes ADD COLUMN description TEXT;
    END IF;
    
    -- is_active
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'is_active') THEN
        ALTER TABLE public.routes ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'updated_at') THEN
        ALTER TABLE public.routes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Adicionar colunas ausentes na tabela trips
DO $$ 
BEGIN
    -- route_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'route_id') THEN
        ALTER TABLE public.trips ADD COLUMN route_id UUID REFERENCES public.routes(id);
    END IF;
    
    -- driver_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'driver_id') THEN
        ALTER TABLE public.trips ADD COLUMN driver_id UUID REFERENCES public.drivers(id);
    END IF;
    
    -- vehicle_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'vehicle_id') THEN
        ALTER TABLE public.trips ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id);
    END IF;
    
    -- started_at (se não existir)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'started_at') THEN
        ALTER TABLE public.trips ADD COLUMN started_at TIMESTAMPTZ;
    END IF;
    
    -- completed_at (se não existir)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'completed_at') THEN
        ALTER TABLE public.trips ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Adicionar colunas ausentes na tabela driver_positions
DO $$ 
BEGIN
    -- accuracy
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_positions' AND column_name = 'accuracy') THEN
        ALTER TABLE public.driver_positions ADD COLUMN accuracy DOUBLE PRECISION;
    END IF;
    
    -- heading
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_positions' AND column_name = 'heading') THEN
        ALTER TABLE public.driver_positions ADD COLUMN heading DOUBLE PRECISION;
    END IF;
END $$;

-- Adicionar colunas ausentes na tabela trip_passengers
DO $$ 
BEGIN
    -- passenger_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_passengers' AND column_name = 'passenger_id') THEN
        ALTER TABLE public.trip_passengers ADD COLUMN passenger_id UUID REFERENCES public.users(id);
    END IF;
    
    -- bus_stop_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_passengers' AND column_name = 'bus_stop_id') THEN
        ALTER TABLE public.trip_passengers ADD COLUMN bus_stop_id UUID REFERENCES public.bus_stops(id);
    END IF;
    
    -- boarded_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_passengers' AND column_name = 'boarded_at') THEN
        ALTER TABLE public.trip_passengers ADD COLUMN boarded_at TIMESTAMPTZ;
    END IF;
    
    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_passengers' AND column_name = 'status') THEN
        ALTER TABLE public.trip_passengers ADD COLUMN status VARCHAR(50) DEFAULT 'waiting';
    END IF;
END $$;

-- Adicionar colunas ausentes na tabela trip_events
DO $$ 
BEGIN
    -- event_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_events' AND column_name = 'event_type') THEN
        ALTER TABLE public.trip_events ADD COLUMN event_type VARCHAR(100) NOT NULL DEFAULT 'info';
    END IF;
    
    -- data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_events' AND column_name = 'data') THEN
        ALTER TABLE public.trip_events ADD COLUMN data JSONB;
    END IF;
END $$;

-- =====================================================
-- 3. ADICIONAR COLUNAS AUSENTES NAS TABELAS GF_*
-- =====================================================

-- gf_alerts
DO $$ 
BEGIN
    -- type (renomear alert_type se necessário)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_alerts' AND column_name = 'type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_alerts' AND column_name = 'alert_type') THEN
            ALTER TABLE public.gf_alerts RENAME COLUMN alert_type TO type;
        ELSE
            ALTER TABLE public.gf_alerts ADD COLUMN type VARCHAR(100) NOT NULL DEFAULT 'info';
        END IF;
    END IF;
END $$;

-- gf_assistance_requests
DO $$ 
BEGIN
    -- type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_assistance_requests' AND column_name = 'type') THEN
        ALTER TABLE public.gf_assistance_requests ADD COLUMN type VARCHAR(100) NOT NULL DEFAULT 'help';
    END IF;
    
    -- description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_assistance_requests' AND column_name = 'description') THEN
        ALTER TABLE public.gf_assistance_requests ADD COLUMN description TEXT;
    END IF;
END $$;

-- gf_driver_documents
DO $$ 
BEGIN
    -- document_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_driver_documents' AND column_name = 'document_type') THEN
        ALTER TABLE public.gf_driver_documents ADD COLUMN document_type VARCHAR(100) NOT NULL DEFAULT 'license';
    END IF;
    
    -- document_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_driver_documents' AND column_name = 'document_url') THEN
        ALTER TABLE public.gf_driver_documents ADD COLUMN document_url TEXT;
    END IF;
    
    -- expires_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_driver_documents' AND column_name = 'expires_at') THEN
        ALTER TABLE public.gf_driver_documents ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- gf_driver_events
DO $$ 
BEGIN
    -- event_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_driver_events' AND column_name = 'event_type') THEN
        ALTER TABLE public.gf_driver_events ADD COLUMN event_type VARCHAR(100) NOT NULL DEFAULT 'info';
    END IF;
    
    -- data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_driver_events' AND column_name = 'data') THEN
        ALTER TABLE public.gf_driver_events ADD COLUMN data JSONB;
    END IF;
END $$;

-- gf_roles
DO $$ 
BEGIN
    -- permissions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_roles' AND column_name = 'permissions') THEN
        ALTER TABLE public.gf_roles ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- gf_vehicle_costs
DO $$ 
BEGIN
    -- cost_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_vehicle_costs' AND column_name = 'cost_type') THEN
        ALTER TABLE public.gf_vehicle_costs ADD COLUMN cost_type VARCHAR(100) NOT NULL DEFAULT 'fuel';
    END IF;
    
    -- amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_vehicle_costs' AND column_name = 'amount') THEN
        ALTER TABLE public.gf_vehicle_costs ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
    END IF;
    
    -- date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_vehicle_costs' AND column_name = 'date') THEN
        ALTER TABLE public.gf_vehicle_costs ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_vehicle_costs' AND column_name = 'description') THEN
        ALTER TABLE public.gf_vehicle_costs ADD COLUMN description TEXT;
    END IF;
END $$;

-- gf_vehicle_maintenance
DO $$ 
BEGIN
    -- maintenance_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_vehicle_maintenance' AND column_name = 'maintenance_type') THEN
        ALTER TABLE public.gf_vehicle_maintenance ADD COLUMN maintenance_type VARCHAR(100) NOT NULL DEFAULT 'preventive';
    END IF;
    
    -- cost
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_vehicle_maintenance' AND column_name = 'cost') THEN
        ALTER TABLE public.gf_vehicle_maintenance ADD COLUMN cost DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_vehicle_maintenance' AND column_name = 'date') THEN
        ALTER TABLE public.gf_vehicle_maintenance ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gf_vehicle_maintenance' AND column_name = 'description') THEN
        ALTER TABLE public.gf_vehicle_maintenance ADD COLUMN description TEXT;
    END IF;
END $$;

-- =====================================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para a tabela drivers
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON public.drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_license ON public.drivers(license_number);
CREATE INDEX IF NOT EXISTS idx_drivers_active ON public.drivers(is_active);

-- Índices para a tabela bus_stops
CREATE INDEX IF NOT EXISTS idx_bus_stops_route_id ON public.bus_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_bus_stops_location ON public.bus_stops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_bus_stops_order ON public.bus_stops(route_id, order_index);

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_vehicles_company ON public.vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_company ON public.routes(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_route ON public.trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_driver_positions_driver ON public.driver_positions(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_positions_timestamp ON public.driver_positions(timestamp);

-- =====================================================
-- 5. CRIAR TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para tabelas com updated_at
DO $$ 
BEGIN
    -- users
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON public.users 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    -- companies
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
        CREATE TRIGGER update_companies_updated_at 
            BEFORE UPDATE ON public.companies 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    -- drivers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_drivers_updated_at') THEN
        CREATE TRIGGER update_drivers_updated_at 
            BEFORE UPDATE ON public.drivers 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    -- vehicles
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vehicles_updated_at') THEN
        CREATE TRIGGER update_vehicles_updated_at 
            BEFORE UPDATE ON public.vehicles 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    -- routes
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_routes_updated_at') THEN
        CREATE TRIGGER update_routes_updated_at 
            BEFORE UPDATE ON public.routes 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    -- bus_stops
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bus_stops_updated_at') THEN
        CREATE TRIGGER update_bus_stops_updated_at 
            BEFORE UPDATE ON public.bus_stops 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- 6. POLÍTICAS RLS BÁSICAS PARA NOVAS TABELAS
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_stops ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para drivers
CREATE POLICY IF NOT EXISTS "drivers_admin_all" ON public.drivers
    FOR ALL USING (public.is_admin());

CREATE POLICY IF NOT EXISTS "drivers_company_read" ON public.drivers
    FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY IF NOT EXISTS "drivers_self_read" ON public.drivers
    FOR SELECT USING (user_id = auth.uid());

-- Políticas básicas para bus_stops
CREATE POLICY IF NOT EXISTS "bus_stops_admin_all" ON public.bus_stops
    FOR ALL USING (public.is_admin());

CREATE POLICY IF NOT EXISTS "bus_stops_company_read" ON public.bus_stops
    FOR SELECT USING (
        route_id IN (
            SELECT id FROM public.routes 
            WHERE company_id = public.current_company_id()
        )
    );

CREATE POLICY IF NOT EXISTS "bus_stops_public_read" ON public.bus_stops
    FOR SELECT USING (true);

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

-- Atualizar estatísticas
ANALYZE;

-- Mensagem de sucesso
DO $$ 
BEGIN
    RAISE NOTICE 'Correção do esquema concluída com sucesso!';
    RAISE NOTICE 'Tabelas criadas: drivers, bus_stops';
    RAISE NOTICE 'Colunas adicionadas em múltiplas tabelas';
    RAISE NOTICE 'Índices e triggers criados';
    RAISE NOTICE 'Políticas RLS configuradas';
END $$;