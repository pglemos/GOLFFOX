-- ========================================
-- GolfFox - Tabelas Auxiliares (Prefixo gf_)
-- ========================================

-- Tabela: Funcionários cadastrados pelo operador (precisa existir antes de gf_route_plan)
CREATE TABLE IF NOT EXISTS public.gf_employee_company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  phone TEXT,
  email TEXT,
  login_cpf TEXT NOT NULL, -- mesmo que cpf, usado para login
  password_hash TEXT, -- senha gerada pelo operador
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- operador que criou
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_employee_company_company_id ON public.gf_employee_company(company_id);
CREATE INDEX IF NOT EXISTS idx_gf_employee_company_cpf ON public.gf_employee_company(cpf);
CREATE INDEX IF NOT EXISTS idx_gf_employee_company_login_cpf ON public.gf_employee_company(login_cpf);

-- Tabela: Plano de rota com pontos ordenados automaticamente
CREATE TABLE IF NOT EXISTS public.gf_route_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT,
  stop_name TEXT,
  passenger_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.gf_employee_company(id) ON DELETE SET NULL,
  estimated_arrival_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_id, stop_order)
);

CREATE INDEX IF NOT EXISTS idx_gf_route_plan_route_id ON public.gf_route_plan(route_id);
CREATE INDEX IF NOT EXISTS idx_gf_route_plan_passenger_id ON public.gf_route_plan(passenger_id);

-- Tabela: Custos por veículo/rota
CREATE TABLE IF NOT EXISTS public.gf_vehicle_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  km NUMERIC DEFAULT 0,
  fuel NUMERIC DEFAULT 0,
  maintenance NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_vehicle_costs_vehicle_id ON public.gf_vehicle_costs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gf_vehicle_costs_route_id ON public.gf_vehicle_costs(route_id);
CREATE INDEX IF NOT EXISTS idx_gf_vehicle_costs_date ON public.gf_vehicle_costs(date);

-- Tabela: Eventos de motorista (gamificação)
CREATE TABLE IF NOT EXISTS public.gf_driver_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_driver_events_driver_id ON public.gf_driver_events(driver_id);
CREATE INDEX IF NOT EXISTS idx_gf_driver_events_event_type ON public.gf_driver_events(event_type);
CREATE INDEX IF NOT EXISTS idx_gf_driver_events_created_at ON public.gf_driver_events(created_at);

-- Tabela: Documentos do motorista
CREATE TABLE IF NOT EXISTS public.gf_driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'cnh', 'certificado_transporte', 'toxico', 'outros'
  document_number TEXT,
  expiry_date DATE,
  file_url TEXT,
  file_name TEXT,
  is_valid BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_driver_documents_driver_id ON public.gf_driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_gf_driver_documents_expiry_date ON public.gf_driver_documents(expiry_date);

-- Tabela: Manutenção preventiva de veículos
CREATE TABLE IF NOT EXISTS public.gf_vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL, -- 'preventiva', 'corretiva', 'revisao'
  description TEXT,
  km_at_service INTEGER,
  cost NUMERIC DEFAULT 0,
  service_date DATE NOT NULL,
  next_service_date DATE,
  next_service_km INTEGER,
  service_provider TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_vehicle_maintenance_vehicle_id ON public.gf_vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gf_vehicle_maintenance_service_date ON public.gf_vehicle_maintenance(service_date);
CREATE INDEX IF NOT EXISTS idx_gf_vehicle_maintenance_next_service_date ON public.gf_vehicle_maintenance(next_service_date);



-- Tabela: Solicitações de socorro/emergência
CREATE TABLE IF NOT EXISTS public.gf_assistance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL, -- 'pane', 'acidente', 'passageiro', 'outros'
  description TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  address TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'dispatched', 'resolved', 'cancelled')),
  dispatched_driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  dispatched_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_assistance_requests_status ON public.gf_assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_gf_assistance_requests_trip_id ON public.gf_assistance_requests(trip_id);
CREATE INDEX IF NOT EXISTS idx_gf_assistance_requests_created_at ON public.gf_assistance_requests(created_at);

-- Tabela: Alertas do sistema
CREATE TABLE IF NOT EXISTS public.gf_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'bus_stopped', 'passenger_not_embarked', 'route_delayed', 'checklist_missing', etc.
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  passenger_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_alerts_alert_type ON public.gf_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_gf_alerts_severity ON public.gf_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_gf_alerts_is_read ON public.gf_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_gf_alerts_created_at ON public.gf_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_gf_alerts_trip_id ON public.gf_alerts(trip_id);

-- Tabela: Sistema de permissões expandido
CREATE TABLE IF NOT EXISTS public.gf_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gf_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.gf_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_gf_user_roles_user_id ON public.gf_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_gf_user_roles_role_id ON public.gf_user_roles(role_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gf_route_plan_updated_at BEFORE UPDATE ON public.gf_route_plan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gf_vehicle_costs_updated_at BEFORE UPDATE ON public.gf_vehicle_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gf_driver_documents_updated_at BEFORE UPDATE ON public.gf_driver_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gf_vehicle_maintenance_updated_at BEFORE UPDATE ON public.gf_vehicle_maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gf_employee_company_updated_at BEFORE UPDATE ON public.gf_employee_company
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gf_assistance_requests_updated_at BEFORE UPDATE ON public.gf_assistance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies básicas (admin pode tudo, outros apenas leitura) — idempotente e schema-safe
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_route_plan') THEN
    ALTER TABLE public.gf_route_plan ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_vehicle_costs') THEN
    ALTER TABLE public.gf_vehicle_costs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_driver_events') THEN
    ALTER TABLE public.gf_driver_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_driver_documents') THEN
    ALTER TABLE public.gf_driver_documents ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_vehicle_maintenance') THEN
    ALTER TABLE public.gf_vehicle_maintenance ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_employee_company') THEN
    ALTER TABLE public.gf_employee_company ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_assistance_requests') THEN
    ALTER TABLE public.gf_assistance_requests ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_alerts') THEN
    ALTER TABLE public.gf_alerts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_roles') THEN
    ALTER TABLE public.gf_roles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_user_roles') THEN
    ALTER TABLE public.gf_user_roles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policy: Admin pode tudo — idempotente e schema-safe
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_route_plan') THEN
    DROP POLICY IF EXISTS "Admin full access on gf_route_plan" ON public.gf_route_plan;
    CREATE POLICY "Admin full access on gf_route_plan" ON public.gf_route_plan
      FOR ALL USING (get_user_role() = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_vehicle_costs') THEN
    DROP POLICY IF EXISTS "Admin full access on gf_vehicle_costs" ON public.gf_vehicle_costs;
    CREATE POLICY "Admin full access on gf_vehicle_costs" ON public.gf_vehicle_costs
      FOR ALL USING (get_user_role() = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_driver_events') THEN
    DROP POLICY IF EXISTS "Admin full access on gf_driver_events" ON public.gf_driver_events;
    CREATE POLICY "Admin full access on gf_driver_events" ON public.gf_driver_events
      FOR ALL USING (get_user_role() = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_driver_documents') THEN
    DROP POLICY IF EXISTS "Admin full access on gf_driver_documents" ON public.gf_driver_documents;
    CREATE POLICY "Admin full access on gf_driver_documents" ON public.gf_driver_documents
      FOR ALL USING (get_user_role() = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_vehicle_maintenance') THEN
    DROP POLICY IF EXISTS "Admin full access on gf_vehicle_maintenance" ON public.gf_vehicle_maintenance;
    CREATE POLICY "Admin full access on gf_vehicle_maintenance" ON public.gf_vehicle_maintenance
      FOR ALL USING (get_user_role() = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_employee_company') THEN
    DROP POLICY IF EXISTS "Admin full access on gf_employee_company" ON public.gf_employee_company;
    CREATE POLICY "Admin full access on gf_employee_company" ON public.gf_employee_company
      FOR ALL USING (get_user_role() = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_assistance_requests') THEN
    DROP POLICY IF EXISTS "Admin full access on gf_assistance_requests" ON public.gf_assistance_requests;
    CREATE POLICY "Admin full access on gf_assistance_requests" ON public.gf_assistance_requests
      FOR ALL USING (get_user_role() = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_alerts') THEN
    DROP POLICY IF EXISTS "Admin full access on gf_alerts" ON public.gf_alerts;
    CREATE POLICY "Admin full access on gf_alerts" ON public.gf_alerts
      FOR ALL USING (get_user_role() = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_roles') THEN
    DROP POLICY IF EXISTS "Admin full access on gf_roles" ON public.gf_roles;
    CREATE POLICY "Admin full access on gf_roles" ON public.gf_roles
      FOR ALL USING (get_user_role() = 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_user_roles') THEN
    DROP POLICY IF EXISTS "Admin full access on gf_user_roles" ON public.gf_user_roles;
    CREATE POLICY "Admin full access on gf_user_roles" ON public.gf_user_roles
      FOR ALL USING (get_user_role() = 'admin');
  END IF;
END $$;

-- Policy: Operator pode ler e criar/editar funcionários da sua empresa — guardado por existência
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_employee_company') THEN
    CREATE POLICY "Operator access on gf_employee_company" ON public.gf_employee_company
      FOR ALL USING (
        get_user_role() = 'operator' 
        AND company_id = get_user_company_id()
      );
  END IF;
END $$;

-- Policy: Todos autenticados podem ler alertas e assistências — guardado por existência
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_alerts') THEN
    CREATE POLICY "Authenticated read access on gf_alerts" ON public.gf_alerts
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_assistance_requests') THEN
    CREATE POLICY "Authenticated read access on gf_assistance_requests" ON public.gf_assistance_requests
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

