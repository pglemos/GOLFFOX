-- ============================================================================
-- v51_carrier_vehicle_management.sql
-- Tabelas de documentos e manutenções dos veículos
-- ============================================================================

-- Documentos dos veículos
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  document_type text CHECK (document_type IN ('crlv', 'ipva', 'seguro', 'inspecao', 'alvara')) NOT NULL,
  document_number text,
  file_url text,
  file_name text,
  issue_date date,
  expiry_date date,
  value_brl numeric(12, 2),
  insurance_company text,
  policy_number text,
  status text CHECK (status IN ('valid', 'expired', 'pending', 'cancelled')) DEFAULT 'valid',
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Manutenções de veículos
CREATE TABLE IF NOT EXISTS public.vehicle_maintenances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  maintenance_type text CHECK (maintenance_type IN ('preventiva', 'corretiva', 'revisao', 'troca_oleo', 'pneus', 'freios', 'suspensao', 'eletrica', 'outra')) NOT NULL,
  scheduled_date date,
  completed_date date,
  next_maintenance_date date,
  odometer_km integer,
  description text NOT NULL,
  cost_parts_brl numeric(12, 2) DEFAULT 0,
  cost_labor_brl numeric(12, 2) DEFAULT 0,
  total_cost_brl numeric(12, 2) GENERATED ALWAYS AS (cost_parts_brl + cost_labor_brl) STORED,
  workshop_name text,
  mechanic_name text,
  status text CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON public.vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_expiry_date ON public.vehicle_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_document_type ON public.vehicle_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_vehicle_id ON public.vehicle_maintenances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_next_date ON public.vehicle_maintenances(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_status ON public.vehicle_maintenances(status);

-- RLS Policies
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenances ENABLE ROW LEVEL SECURITY;

-- Policies para documentos de veículos
DROP POLICY IF EXISTS "Carriers can manage their vehicle documents" ON public.vehicle_documents;
CREATE POLICY "Carriers can manage their vehicle documents"
  ON public.vehicle_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_documents.vehicle_id
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Policies para manutenções de veículos
DROP POLICY IF EXISTS "Carriers can manage their vehicle maintenances" ON public.vehicle_maintenances;
CREATE POLICY "Carriers can manage their vehicle maintenances"
  ON public.vehicle_maintenances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_maintenances.vehicle_id
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_vehicle_documents_updated_at ON public.vehicle_documents;
CREATE TRIGGER update_vehicle_documents_updated_at
  BEFORE UPDATE ON public.vehicle_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_maintenances_updated_at ON public.vehicle_maintenances;
CREATE TRIGGER update_vehicle_maintenances_updated_at
  BEFORE UPDATE ON public.vehicle_maintenances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.vehicle_documents IS 'Documentos dos veículos (CRLV, IPVA, Seguro, Inspeção)';
COMMENT ON TABLE public.vehicle_maintenances IS 'Manutenções preventivas e corretivas dos veículos';

