-- ============================================================
-- Migration: Tabelas Faltantes Referenciadas no Código
-- Data: 2025-01-16
-- Descrição: Cria tabelas que são referenciadas no código mas podem não ter migrations
-- ============================================================

-- ============================================================
-- 1. gf_web_vitals - Métricas de Web Vitals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gf_web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_vitals_url ON public.gf_web_vitals(url);
CREATE INDEX IF NOT EXISTS idx_web_vitals_timestamp ON public.gf_web_vitals(timestamp);
CREATE INDEX IF NOT EXISTS idx_web_vitals_created ON public.gf_web_vitals(created_at DESC);

COMMENT ON TABLE public.gf_web_vitals IS 'Métricas de Core Web Vitals coletadas do frontend';

-- ============================================================
-- 2. gf_operational_alerts - Alertas Operacionais
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gf_operational_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('performance', 'security', 'error', 'metric', 'system')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  carrier_id UUID,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operational_alerts_type ON public.gf_operational_alerts(type);
CREATE INDEX IF NOT EXISTS idx_operational_alerts_severity ON public.gf_operational_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_operational_alerts_resolved ON public.gf_operational_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_operational_alerts_company ON public.gf_operational_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_operational_alerts_created ON public.gf_operational_alerts(created_at DESC);

COMMENT ON TABLE public.gf_operational_alerts IS 'Alertas operacionais do sistema (performance, segurança, erros)';

-- ============================================================
-- 3. gf_audit_log - Log de Auditoria (se não existir)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gf_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  carrier_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  route_path TEXT,
  http_method VARCHAR(10),
  status_code INTEGER,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.gf_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.gf_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_company ON public.gf_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.gf_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.gf_audit_log(created_at DESC);

COMMENT ON TABLE public.gf_audit_log IS 'Log de auditoria de todas as ações do sistema';

-- ============================================================
-- 4. driver_positions - Posições GPS (alias para driver_locations)
-- ============================================================
-- Se driver_locations já existe, criar view ou garantir compatibilidade
DO $$
BEGIN
  -- Verificar se driver_positions não existe mas driver_locations existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'driver_positions'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'driver_locations'
  ) THEN
    -- Criar view para compatibilidade
    CREATE OR REPLACE VIEW public.driver_positions AS
    SELECT 
      id,
      driver_id,
      trip_id,
      latitude,
      longitude,
      altitude,
      speed,
      heading,
      accuracy,
      recorded_at
    FROM public.driver_locations;
    
    COMMENT ON VIEW public.driver_positions IS 'View de compatibilidade para driver_locations';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'driver_positions'
  ) THEN
    -- Criar tabela se nem driver_locations nem driver_positions existem
    CREATE TABLE public.driver_positions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
      latitude NUMERIC NOT NULL,
      longitude NUMERIC NOT NULL,
      altitude NUMERIC,
      speed NUMERIC,
      heading NUMERIC,
      accuracy NUMERIC,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_driver_positions_driver ON public.driver_positions(driver_id);
    CREATE INDEX IF NOT EXISTS idx_driver_positions_trip ON public.driver_positions(trip_id);
    CREATE INDEX IF NOT EXISTS idx_driver_positions_recorded ON public.driver_positions(recorded_at DESC);
    
    COMMENT ON TABLE public.driver_positions IS 'Posições GPS dos motoristas em tempo real';
  END IF;
END $$;

-- ============================================================
-- 5. gf_vehicle_checklists - Checklists de Veículos (se não existir)
-- ============================================================
-- Verificar se vehicle_checklists existe, se sim criar alias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gf_vehicle_checklists'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicle_checklists'
  ) THEN
    -- Criar view para compatibilidade
    CREATE OR REPLACE VIEW public.gf_vehicle_checklists AS
    SELECT * FROM public.vehicle_checklists;
    
    COMMENT ON VIEW public.gf_vehicle_checklists IS 'View de compatibilidade para vehicle_checklists';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gf_vehicle_checklists'
  ) THEN
    -- Criar tabela se não existir
    CREATE TABLE public.gf_vehicle_checklists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
      driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
      vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
      items JSONB NOT NULL DEFAULT '[]',
      photos JSONB DEFAULT '[]',
      odometer_reading NUMERIC,
      notes TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'incomplete')),
      completed_at TIMESTAMPTZ,
      reviewed_by UUID REFERENCES public.users(id),
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_gf_vehicle_checklists_trip ON public.gf_vehicle_checklists(trip_id);
    CREATE INDEX IF NOT EXISTS idx_gf_vehicle_checklists_driver ON public.gf_vehicle_checklists(driver_id);
    CREATE INDEX IF NOT EXISTS idx_gf_vehicle_checklists_vehicle ON public.gf_vehicle_checklists(vehicle_id);
    
    COMMENT ON TABLE public.gf_vehicle_checklists IS 'Checklists de verificação pré-viagem do veículo';
  END IF;
END $$;

-- ============================================================
-- 6. RLS Policies
-- ============================================================

-- gf_web_vitals - apenas service role
ALTER TABLE public.gf_web_vitals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on web_vitals" ON public.gf_web_vitals;
CREATE POLICY "Service role full access on web_vitals" 
ON public.gf_web_vitals 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- gf_operational_alerts - service role + usuários autenticados podem ler
ALTER TABLE public.gf_operational_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on operational_alerts" ON public.gf_operational_alerts;
CREATE POLICY "Service role full access on operational_alerts" 
ON public.gf_operational_alerts 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- gf_audit_log - apenas service role
ALTER TABLE public.gf_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on audit_log" ON public.gf_audit_log;
CREATE POLICY "Service role full access on audit_log" 
ON public.gf_audit_log 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- ============================================================
-- 7. Triggers para updated_at
-- ============================================================

-- Função para updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gf_operational_alerts
DROP TRIGGER IF EXISTS update_operational_alerts_updated_at ON public.gf_operational_alerts;
CREATE TRIGGER update_operational_alerts_updated_at 
  BEFORE UPDATE ON public.gf_operational_alerts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para gf_vehicle_checklists (se tabela existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gf_vehicle_checklists'
  ) THEN
    DROP TRIGGER IF EXISTS update_gf_vehicle_checklists_updated_at ON public.gf_vehicle_checklists;
    CREATE TRIGGER update_gf_vehicle_checklists_updated_at 
      BEFORE UPDATE ON public.gf_vehicle_checklists
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
