-- ============================================================================
-- v50_to_v54_carrier_complete.sql
-- CONSOLIDAÇÃO DE TODAS AS MIGRATIONS DO PAINEL DA TRANSPORTADORA
-- Execute este arquivo NO SUPABASE SQL EDITOR
-- ============================================================================

-- IMPORTANTE: Execute na ordem das migrations (v50 → v54)
-- Este arquivo consolida todas as migrations para facilitar a execução

-- ============================================================================
-- v50: DOCUMENTOS E EXAMES MÉDICOS DOS MOTORISTAS
-- ============================================================================

-- Documentos dos motoristas
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  document_type text CHECK (document_type IN ('cnh', 'cpf', 'rg', 'comprovante_residencia', 'foto_3x4', 'certidao_criminal', 'certidao_civil')) NOT NULL,
  document_number text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint,
  issue_date date,
  expiry_date date,
  status text CHECK (status IN ('valid', 'expired', 'pending_review', 'rejected')) DEFAULT 'valid',
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Exames médicos dos motoristas
CREATE TABLE IF NOT EXISTS public.driver_medical_exams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  exam_type text CHECK (exam_type IN ('admissional', 'periodico', 'toxicologico', 'demissional', 'retorno_trabalho')) NOT NULL,
  exam_date date NOT NULL,
  expiry_date date NOT NULL,
  result text CHECK (result IN ('apto', 'inapto', 'apto_com_restricoes')) DEFAULT 'apto',
  file_url text,
  file_name text,
  clinic_name text,
  doctor_name text,
  doctor_crm text,
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Índices para documentos e exames
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON public.driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_expiry_date ON public.driver_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_driver_medical_exams_driver_id ON public.driver_medical_exams(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_medical_exams_expiry_date ON public.driver_medical_exams(expiry_date);

-- RLS Policies para documentos
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_medical_exams ENABLE ROW LEVEL SECURITY;

-- Policies para documentos
DROP POLICY IF EXISTS "Carriers can view their drivers documents" ON public.driver_documents;
CREATE POLICY "Carriers can view their drivers documents"
  ON public.driver_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_documents.driver_id
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Carriers can insert their drivers documents" ON public.driver_documents;
CREATE POLICY "Carriers can insert their drivers documents"
  ON public.driver_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_documents.driver_id
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Carriers can update their drivers documents" ON public.driver_documents;
CREATE POLICY "Carriers can update their drivers documents"
  ON public.driver_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_documents.driver_id
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Carriers can delete their drivers documents" ON public.driver_documents;
CREATE POLICY "Carriers can delete their drivers documents"
  ON public.driver_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_documents.driver_id
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Policies para exames médicos
DROP POLICY IF EXISTS "Carriers can view their drivers exams" ON public.driver_medical_exams;
CREATE POLICY "Carriers can view their drivers exams"
  ON public.driver_medical_exams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_medical_exams.driver_id
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Carriers can insert their drivers exams" ON public.driver_medical_exams;
CREATE POLICY "Carriers can insert their drivers exams"
  ON public.driver_medical_exams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_medical_exams.driver_id
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Carriers can update their drivers exams" ON public.driver_medical_exams;
CREATE POLICY "Carriers can update their drivers exams"
  ON public.driver_medical_exams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_medical_exams.driver_id
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Carriers can delete their drivers exams" ON public.driver_medical_exams;
CREATE POLICY "Carriers can delete their drivers exams"
  ON public.driver_medical_exams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_medical_exams.driver_id
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_driver_documents_updated_at ON public.driver_documents;
CREATE TRIGGER update_driver_documents_updated_at
  BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_medical_exams_updated_at ON public.driver_medical_exams;
CREATE TRIGGER update_driver_medical_exams_updated_at
  BEFORE UPDATE ON public.driver_medical_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- v51: DOCUMENTOS E MANUTENÇÕES DOS VEÍCULOS
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

-- Índices para veículos
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON public.vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_expiry_date ON public.vehicle_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_document_type ON public.vehicle_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_vehicle_id ON public.vehicle_maintenances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_next_date ON public.vehicle_maintenances(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_status ON public.vehicle_maintenances(status);

-- RLS Policies para veículos
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

-- ============================================================================
-- v52: CUSTOS DETALHADOS POR VEÍCULO E POR ROTA
-- ============================================================================

-- Custos por veículo
CREATE TABLE IF NOT EXISTS public.vehicle_costs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  cost_category text CHECK (cost_category IN ('combustivel', 'manutencao', 'seguro', 'ipva', 'depreciacao', 'pneus', 'lavagem', 'pedagio', 'multas', 'outros')) NOT NULL,
  cost_date date NOT NULL,
  amount_brl numeric(12, 2) NOT NULL,
  quantity numeric(10, 2),
  unit_measure text,
  odometer_km integer,
  description text,
  invoice_number text,
  supplier text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Custos por rota
CREATE TABLE IF NOT EXISTS public.route_costs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id uuid REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  cost_date date NOT NULL,
  fuel_cost_brl numeric(12, 2) DEFAULT 0,
  labor_cost_brl numeric(12, 2) DEFAULT 0,
  maintenance_cost_brl numeric(12, 2) DEFAULT 0,
  toll_cost_brl numeric(12, 2) DEFAULT 0,
  fixed_cost_brl numeric(12, 2) DEFAULT 0,
  total_cost_brl numeric(12, 2) GENERATED ALWAYS AS (fuel_cost_brl + labor_cost_brl + maintenance_cost_brl + toll_cost_brl + fixed_cost_brl) STORED,
  passengers_transported integer DEFAULT 0,
  cost_per_passenger_brl numeric(12, 2) GENERATED ALWAYS AS (
    CASE WHEN passengers_transported > 0 
      THEN (fuel_cost_brl + labor_cost_brl + maintenance_cost_brl + toll_cost_brl + fixed_cost_brl) / passengers_transported 
      ELSE 0 
    END
  ) STORED,
  distance_km numeric(10, 2),
  notes text,
  created_at timestamptz DEFAULT NOW()
);

-- Índices para custos
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_vehicle_id ON public.vehicle_costs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_date ON public.vehicle_costs(cost_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_category ON public.vehicle_costs(cost_category);
CREATE INDEX IF NOT EXISTS idx_route_costs_route_id ON public.route_costs(route_id);
CREATE INDEX IF NOT EXISTS idx_route_costs_trip_id ON public.route_costs(trip_id);
CREATE INDEX IF NOT EXISTS idx_route_costs_date ON public.route_costs(cost_date);

-- RLS Policies para custos
ALTER TABLE public.vehicle_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_costs ENABLE ROW LEVEL SECURITY;

-- Policies para custos de veículos
DROP POLICY IF EXISTS "Carriers can manage their vehicle costs" ON public.vehicle_costs;
CREATE POLICY "Carriers can manage their vehicle costs"
  ON public.vehicle_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_costs.vehicle_id
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Policies para custos de rotas
DROP POLICY IF EXISTS "Carriers can manage their route costs" ON public.route_costs;
CREATE POLICY "Carriers can manage their route costs"
  ON public.route_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.routes r
      WHERE r.id = route_costs.route_id
      AND r.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_vehicle_costs_updated_at ON public.vehicle_costs;
CREATE TRIGGER update_vehicle_costs_updated_at
  BEFORE UPDATE ON public.vehicle_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- v53: VIEWS DO DASHBOARD
-- ============================================================================

-- View: Vencimentos próximos (documentos e exames)
CREATE OR REPLACE VIEW public.v_carrier_expiring_documents AS
SELECT 
  'driver_document' as item_type,
  dd.id,
  dd.driver_id as entity_id,
  u.name as entity_name,
  dd.document_type,
  dd.expiry_date,
  dd.status,
  CASE 
    WHEN dd.expiry_date < NOW()::date THEN 'expired'
    WHEN dd.expiry_date <= (NOW()::date + INTERVAL '7 days') THEN 'critical'
    WHEN dd.expiry_date <= (NOW()::date + INTERVAL '30 days') THEN 'warning'
    ELSE 'ok'
  END as alert_level,
  (dd.expiry_date - NOW()::date)::integer as days_to_expiry,
  u.carrier_id
FROM public.driver_documents dd
JOIN public.users u ON u.id = dd.driver_id
WHERE dd.expiry_date IS NOT NULL

UNION ALL

SELECT 
  'driver_exam' as item_type,
  dme.id,
  dme.driver_id as entity_id,
  u.name as entity_name,
  dme.exam_type as document_type,
  dme.expiry_date,
  dme.result as status,
  CASE 
    WHEN dme.expiry_date < NOW()::date THEN 'expired'
    WHEN dme.expiry_date <= (NOW()::date + INTERVAL '7 days') THEN 'critical'
    WHEN dme.expiry_date <= (NOW()::date + INTERVAL '30 days') THEN 'warning'
    ELSE 'ok'
  END as alert_level,
  (dme.expiry_date - NOW()::date)::integer as days_to_expiry,
  u.carrier_id
FROM public.driver_medical_exams dme
JOIN public.users u ON u.id = dme.driver_id
WHERE dme.expiry_date IS NOT NULL

UNION ALL

SELECT 
  'vehicle_document' as item_type,
  vd.id,
  vd.vehicle_id as entity_id,
  v.plate as entity_name,
  vd.document_type,
  vd.expiry_date,
  vd.status,
  CASE 
    WHEN vd.expiry_date < NOW()::date THEN 'expired'
    WHEN vd.expiry_date <= (NOW()::date + INTERVAL '7 days') THEN 'critical'
    WHEN vd.expiry_date <= (NOW()::date + INTERVAL '30 days') THEN 'warning'
    ELSE 'ok'
  END as alert_level,
  (vd.expiry_date - NOW()::date)::integer as days_to_expiry,
  v.carrier_id
FROM public.vehicle_documents vd
JOIN public.vehicles v ON v.id = vd.vehicle_id
WHERE vd.expiry_date IS NOT NULL;

-- View: Custos consolidados por veículo
CREATE OR REPLACE VIEW public.v_carrier_vehicle_costs_summary AS
SELECT 
  v.id as vehicle_id,
  v.plate,
  v.model,
  v.carrier_id,
  DATE_TRUNC('month', vc.cost_date) as month,
  SUM(vc.amount_brl) as total_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'combustivel' THEN vc.amount_brl ELSE 0 END) as fuel_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'manutencao' THEN vc.amount_brl ELSE 0 END) as maintenance_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'seguro' THEN vc.amount_brl ELSE 0 END) as insurance_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'ipva' THEN vc.amount_brl ELSE 0 END) as ipva_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'pedagio' THEN vc.amount_brl ELSE 0 END) as toll_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'multas' THEN vc.amount_brl ELSE 0 END) as fines_cost_brl,
  SUM(CASE WHEN vc.cost_category NOT IN ('combustivel', 'manutencao', 'seguro', 'ipva', 'pedagio', 'multas') THEN vc.amount_brl ELSE 0 END) as other_cost_brl,
  COUNT(*) as cost_entries
FROM public.vehicles v
LEFT JOIN public.vehicle_costs vc ON vc.vehicle_id = v.id
GROUP BY v.id, v.plate, v.model, v.carrier_id, DATE_TRUNC('month', vc.cost_date);

-- View: Custos consolidados por rota
CREATE OR REPLACE VIEW public.v_carrier_route_costs_summary AS
SELECT 
  r.id as route_id,
  r.name as route_name,
  r.carrier_id,
  r.company_id,
  DATE_TRUNC('month', rc.cost_date) as month,
  COUNT(DISTINCT rc.trip_id) as trips_count,
  SUM(rc.total_cost_brl) as total_cost_brl,
  SUM(rc.fuel_cost_brl) as fuel_cost_brl,
  SUM(rc.labor_cost_brl) as labor_cost_brl,
  SUM(rc.maintenance_cost_brl) as maintenance_cost_brl,
  SUM(rc.toll_cost_brl) as toll_cost_brl,
  SUM(rc.fixed_cost_brl) as fixed_cost_brl,
  SUM(rc.passengers_transported) as total_passengers,
  AVG(rc.cost_per_passenger_brl) as avg_cost_per_passenger_brl,
  SUM(rc.distance_km) as total_distance_km
FROM public.routes r
LEFT JOIN public.route_costs rc ON rc.route_id = r.id
GROUP BY r.id, r.name, r.carrier_id, r.company_id, DATE_TRUNC('month', rc.cost_date);

-- Função auxiliar para contar passageiros de uma viagem
CREATE OR REPLACE FUNCTION get_trip_passenger_count(p_trip_id uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer FROM public.trip_passengers WHERE trip_id = p_trip_id
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- v54: CONFIGURAÇÃO DO SUPABASE STORAGE (Políticas RLS)
-- ============================================================================

-- Nota: O bucket 'carrier-documents' deve ser criado manualmente no Supabase Dashboard
-- Estas políticas assumem que o bucket já existe

-- Policy: Carriers podem fazer upload de arquivos em suas pastas
DROP POLICY IF EXISTS "Carriers can upload to their folders" ON storage.objects;
CREATE POLICY "Carriers can upload to their folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'carrier-documents'
  AND (
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Carriers podem ler seus próprios arquivos
DROP POLICY IF EXISTS "Carriers can read their files" ON storage.objects;
CREATE POLICY "Carriers can read their files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'carrier-documents'
  AND (
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Carriers podem atualizar seus arquivos
DROP POLICY IF EXISTS "Carriers can update their files" ON storage.objects;
CREATE POLICY "Carriers can update their files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'carrier-documents'
  AND (
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Carriers podem deletar seus arquivos
DROP POLICY IF EXISTS "Carriers can delete their files" ON storage.objects;
CREATE POLICY "Carriers can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'carrier-documents'
  AND (
    (storage.foldername(name))[1] = 'driver-documents' 
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'vehicle-documents'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = (storage.foldername(name))[2]
      AND v.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
  OR (
    (storage.foldername(name))[1] = 'medical-exams'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = (storage.foldername(name))[2]
      AND u.carrier_id = (SELECT carrier_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- ============================================================================
-- FIM DAS MIGRATIONS
-- ============================================================================

-- Para verificar se tudo foi criado corretamente, execute:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%driver%' OR table_name LIKE '%vehicle%' OR table_name LIKE '%route_cost%';
-- SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'v_carrier%';

