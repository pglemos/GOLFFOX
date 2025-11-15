-- ====================================================
-- GolfFox Transport Management System
-- Initial Schema Migration
-- Date: 2025-11-11
-- ====================================================
-- This migration creates all essential tables with RLS policies
-- Execute this before running any seed scripts or API endpoints

-- ====================================================
-- PART 1: EXTENSIONS
-- ====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================
-- PART 2: CORE TABLES
-- ====================================================

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas ausentes na tabela companies (se a tabela já existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'cnpj'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN cnpj VARCHAR(18);
    CREATE UNIQUE INDEX IF NOT EXISTS companies_cnpj_key ON public.companies(cnpj) WHERE cnpj IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'address'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN phone VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN email VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Users table (links to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'carrier', 'driver', 'passenger')),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  carrier_id TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes table
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  carrier_id TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance NUMERIC,
  estimated_duration INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate TEXT NOT NULL UNIQUE,
  model TEXT,
  manufacturer TEXT,
  year INTEGER,
  capacity INTEGER DEFAULT 0,
  carrier_id TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas ausentes na tabela vehicles (se a tabela já existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'manufacturer'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN manufacturer TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'capacity'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN capacity INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'inProgress', 'completed', 'cancelled')),
  scheduled_date DATE,
  scheduled_start_time TIMESTAMPTZ,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  distance_km NUMERIC,
  start_latitude NUMERIC,
  start_longitude NUMERIC,
  end_latitude NUMERIC,
  end_longitude NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas ausentes na tabela trips (se a tabela já existir)
DO $$ 
BEGIN
  -- Adicionar scheduled_date se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trips' 
    AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE public.trips ADD COLUMN scheduled_date DATE;
  END IF;

  -- Adicionar start_time se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trips' 
    AND column_name = 'start_time'
  ) THEN
    ALTER TABLE public.trips ADD COLUMN start_time TIMESTAMPTZ;
  END IF;

  -- Adicionar end_time se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trips' 
    AND column_name = 'end_time'
  ) THEN
    ALTER TABLE public.trips ADD COLUMN end_time TIMESTAMPTZ;
  END IF;

  -- Adicionar distance_km se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trips' 
    AND column_name = 'distance_km'
  ) THEN
    ALTER TABLE public.trips ADD COLUMN distance_km NUMERIC;
  END IF;
END $$;

-- ====================================================
-- PART 3: COST MANAGEMENT TABLES
-- ====================================================

-- Cost Categories table
CREATE TABLE IF NOT EXISTS public.gf_cost_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Costs table
CREATE TABLE IF NOT EXISTS public.gf_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  carrier_id UUID,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  cost_category_id UUID NOT NULL REFERENCES public.gf_cost_categories(id) ON DELETE RESTRICT,
  cost_center_id UUID,
  cost_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  qty NUMERIC,
  unit TEXT,
  currency VARCHAR(3) DEFAULT 'BRL',
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'invoice', 'calc')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON public.trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_scheduled_date ON public.trips(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON public.vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_routes_company_id ON public.routes(company_id);
CREATE INDEX IF NOT EXISTS idx_costs_company_id ON public.gf_costs(company_id);
CREATE INDEX IF NOT EXISTS idx_costs_vehicle_id ON public.gf_costs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_costs_route_id ON public.gf_costs(route_id);
CREATE INDEX IF NOT EXISTS idx_costs_cost_category_id ON public.gf_costs(cost_category_id);
CREATE INDEX IF NOT EXISTS idx_costs_cost_date ON public.gf_costs(cost_date);

-- ====================================================
-- PART 5: TRIGGERS FOR UPDATED_AT
-- ====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_routes_updated_at ON public.routes;
CREATE TRIGGER update_routes_updated_at 
  BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at 
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips;
CREATE TRIGGER update_trips_updated_at 
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cost_categories_updated_at ON public.gf_cost_categories;
CREATE TRIGGER update_cost_categories_updated_at 
  BEFORE UPDATE ON public.gf_cost_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_costs_updated_at ON public.gf_costs;
CREATE TRIGGER update_costs_updated_at 
  BEFORE UPDATE ON public.gf_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- PART 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_costs ENABLE ROW LEVEL SECURITY;

-- Companies: Service role can do everything, users can read their company
CREATE POLICY "Service role full access on companies"
  ON public.companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read their company"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Users: Service role can do everything, users can read their own profile
CREATE POLICY "Service role full access on users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read their own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Routes: Service role full access, users can read routes from their company
CREATE POLICY "Service role full access on routes"
  ON public.routes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read routes from their company"
  ON public.routes
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Vehicles: Service role full access, users can read vehicles from their company
CREATE POLICY "Service role full access on vehicles"
  ON public.vehicles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read vehicles from their company"
  ON public.vehicles
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
    OR company_id IS NULL
  );

-- Trips: Service role full access, users can read trips from their company
CREATE POLICY "Service role full access on trips"
  ON public.trips
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read trips from their company"
  ON public.trips
  FOR SELECT
  TO authenticated
  USING (
    route_id IN (
      SELECT r.id FROM public.routes r
      INNER JOIN public.users u ON r.company_id = u.company_id
      WHERE u.id = auth.uid()
    )
  );

-- Cost Categories: Service role full access, authenticated users can read active categories
CREATE POLICY "Service role full access on cost categories"
  ON public.gf_cost_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read active cost categories"
  ON public.gf_cost_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Costs: Service role full access, users can read costs from their company
CREATE POLICY "Service role full access on costs"
  ON public.gf_costs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read costs from their company"
  ON public.gf_costs
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  );

-- ====================================================
-- PART 7: COMMENTS FOR DOCUMENTATION
-- ====================================================

COMMENT ON TABLE public.companies IS 'Empresas/clientes do sistema';
COMMENT ON TABLE public.users IS 'Usuários do sistema (vinculados a auth.users)';
COMMENT ON TABLE public.routes IS 'Rotas de transporte';
COMMENT ON TABLE public.vehicles IS 'Veículos da frota';
COMMENT ON TABLE public.trips IS 'Viagens realizadas';
COMMENT ON TABLE public.gf_cost_categories IS 'Categorias de custos';
COMMENT ON TABLE public.gf_costs IS 'Custos registrados no sistema';

-- ====================================================
-- END OF MIGRATION
-- ====================================================

