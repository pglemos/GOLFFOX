-- ====================================================
-- GolfFox Transport Management System
-- Attachments & Documents Schema Migration
-- Date: 2025-12-09
-- ====================================================
-- This migration adds document management tables for:
-- - Vehicles (gf_vehicle_documents)
-- - Drivers compensation (gf_driver_compensation)
-- - Carriers (gf_carrier_documents)
-- Plus expands existing tables with banking and legal rep info

-- ====================================================
-- PART 1: veiculo DOCUMENTS TABLE
-- ====================================================
CREATE TABLE IF NOT EXISTS public.gf_vehicle_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  -- Types: crlv, antt_license, inmetro_certificate, cadastur_certificate,
  --        art, maintenance_report, insurance, inspection_certificate,
  --        licensing, tachograph_certificate, vehicle_photo_side, vehicle_photo_rear
  document_number VARCHAR(100),
  expiry_date DATE,
  issue_date DATE,
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  file_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'pending', 'rejected')),
  notes TEXT,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_vehicle_docs_vehicle_id ON public.gf_vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gf_vehicle_docs_type ON public.gf_vehicle_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_gf_vehicle_docs_expiry ON public.gf_vehicle_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_gf_vehicle_docs_status ON public.gf_vehicle_documents(status);

COMMENT ON TABLE public.gf_vehicle_documents IS 'Documentos de veículos (CRLV, ANTT, seguros, etc.)';

-- ====================================================
-- PART 2: EXPAND GF_DRIVER_DOCUMENTS TABLE
-- ====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'issue_date'
  ) THEN
    ALTER TABLE public.gf_driver_documents ADD COLUMN issue_date DATE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE public.gf_driver_documents ADD COLUMN file_size INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE public.gf_driver_documents ADD COLUMN file_type VARCHAR(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE public.gf_driver_documents ADD COLUMN uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.gf_driver_documents ADD COLUMN status VARCHAR(20) DEFAULT 'valid';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'gf_driver_documents' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.gf_driver_documents ADD COLUMN notes TEXT;
  END IF;
END $$;

-- ====================================================
-- PART 3: motorista COMPENSATION TABLE (Salary & Benefits)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.gf_driver_compensation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Salary Info
  base_salary DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'BRL',
  payment_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  contract_type VARCHAR(20) DEFAULT 'clt' CHECK (contract_type IN ('clt', 'pj', 'autonomo', 'temporario')),
  -- Benefits
  has_meal_allowance BOOLEAN DEFAULT false,
  meal_allowance_value DECIMAL(10,2),
  has_transport_allowance BOOLEAN DEFAULT false,
  transport_allowance_value DECIMAL(10,2),
  has_health_insurance BOOLEAN DEFAULT false,
  health_insurance_value DECIMAL(10,2),
  has_dental_insurance BOOLEAN DEFAULT false,
  dental_insurance_value DECIMAL(10,2),
  has_life_insurance BOOLEAN DEFAULT false,
  life_insurance_value DECIMAL(10,2),
  has_fuel_card BOOLEAN DEFAULT false,
  fuel_card_limit DECIMAL(10,2),
  other_benefits TEXT,
  -- Contract Dates
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_driver_compensation_driver ON public.gf_driver_compensation(driver_id);
CREATE INDEX IF NOT EXISTS idx_gf_driver_compensation_active ON public.gf_driver_compensation(driver_id) WHERE is_active = true;

COMMENT ON TABLE public.gf_driver_compensation IS 'Salários e benefícios dos motoristas';

-- ====================================================
-- PART 4: transportadora DOCUMENTS TABLE
-- ====================================================
CREATE TABLE IF NOT EXISTS public.gf_carrier_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  -- Types: service_contract, cnpj_card, social_contract, art_certificate,
  --        insurance_certificate, operating_license, cnd, fgts_certificate,
  --        cndt, environmental_license, legal_rep_cnh, antt_registration
  document_number VARCHAR(100),
  expiry_date DATE,
  issue_date DATE,
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  file_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'pending', 'rejected')),
  notes TEXT,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_carrier_docs_carrier_id ON public.gf_carrier_documents(carrier_id);
CREATE INDEX IF NOT EXISTS idx_gf_carrier_docs_type ON public.gf_carrier_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_gf_carrier_docs_expiry ON public.gf_carrier_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_gf_carrier_docs_status ON public.gf_carrier_documents(status);

COMMENT ON TABLE public.gf_carrier_documents IS 'Documentos de transportadoras (contratos, certidões, etc.)';

-- ====================================================
-- PART 5: EXPAND CARRIERS TABLE (Banking & Legal Rep)
-- ====================================================
DO $$ 
BEGIN
  -- Banking Information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'bank_name') THEN
    ALTER TABLE public.carriers ADD COLUMN bank_name VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'bank_code') THEN
    ALTER TABLE public.carriers ADD COLUMN bank_code VARCHAR(10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'bank_agency') THEN
    ALTER TABLE public.carriers ADD COLUMN bank_agency VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'bank_account') THEN
    ALTER TABLE public.carriers ADD COLUMN bank_account VARCHAR(30);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'bank_account_type') THEN
    ALTER TABLE public.carriers ADD COLUMN bank_account_type VARCHAR(20) DEFAULT 'corrente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'pix_key') THEN
    ALTER TABLE public.carriers ADD COLUMN pix_key VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'pix_key_type') THEN
    ALTER TABLE public.carriers ADD COLUMN pix_key_type VARCHAR(20);
  END IF;

  -- Legal Representative Information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'legal_rep_name') THEN
    ALTER TABLE public.carriers ADD COLUMN legal_rep_name VARCHAR(200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'legal_rep_cpf') THEN
    ALTER TABLE public.carriers ADD COLUMN legal_rep_cpf VARCHAR(14);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'legal_rep_rg') THEN
    ALTER TABLE public.carriers ADD COLUMN legal_rep_rg VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'legal_rep_email') THEN
    ALTER TABLE public.carriers ADD COLUMN legal_rep_email VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'carriers' AND column_name = 'legal_rep_phone') THEN
    ALTER TABLE public.carriers ADD COLUMN legal_rep_phone VARCHAR(20);
  END IF;
END $$;

-- ====================================================
-- PART 6: RLS POLICIES
-- ====================================================
ALTER TABLE public.gf_vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_driver_compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_carrier_documents ENABLE ROW LEVEL SECURITY;

-- veiculo Documents Policies
DROP POLICY IF EXISTS "Service role full access on gf_vehicle_documents" ON public.gf_vehicle_documents;
CREATE POLICY "Service role full access on gf_vehicle_documents" 
  ON public.gf_vehicle_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read vehicle_documents for their company" ON public.gf_vehicle_documents;
CREATE POLICY "Users can read vehicle_documents for their company" 
  ON public.gf_vehicle_documents FOR SELECT TO authenticated 
  USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE 
        company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
        OR transportadora_id IN (SELECT transportadora_id FROM users WHERE id = auth.uid())
    )
  );

-- motorista Compensation Policies
DROP POLICY IF EXISTS "Service role full access on gf_driver_compensation" ON public.gf_driver_compensation;
CREATE POLICY "Service role full access on gf_driver_compensation" 
  ON public.gf_driver_compensation FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Drivers can read their own compensation" ON public.gf_driver_compensation;
CREATE POLICY "Drivers can read their own compensation" 
  ON public.gf_driver_compensation FOR SELECT TO authenticated USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage motorista compensation" ON public.gf_driver_compensation;
CREATE POLICY "Admins can manage motorista compensation"
  ON public.gf_driver_compensation FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'operador')));

-- transportadora Documents Policies
DROP POLICY IF EXISTS "Service role full access on gf_carrier_documents" ON public.gf_carrier_documents;
CREATE POLICY "Service role full access on gf_carrier_documents" 
  ON public.gf_carrier_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read carrier_documents for their transportadora" ON public.gf_carrier_documents;
CREATE POLICY "Users can read carrier_documents for their transportadora" 
  ON public.gf_carrier_documents FOR SELECT TO authenticated 
  USING (carrier_id IN (SELECT transportadora_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage transportadora documents" ON public.gf_carrier_documents;
CREATE POLICY "Admins can manage transportadora documents"
  ON public.gf_carrier_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'operador')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'operador')));

-- ====================================================
-- PART 7: TRIGGERS FOR UPDATED_AT
-- ====================================================
DROP TRIGGER IF EXISTS update_gf_vehicle_docs_updated_at ON public.gf_vehicle_documents;
CREATE TRIGGER update_gf_vehicle_docs_updated_at 
  BEFORE UPDATE ON public.gf_vehicle_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gf_driver_compensation_updated_at ON public.gf_driver_compensation;
CREATE TRIGGER update_gf_driver_compensation_updated_at 
  BEFORE UPDATE ON public.gf_driver_compensation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gf_carrier_docs_updated_at ON public.gf_carrier_documents;
CREATE TRIGGER update_gf_carrier_docs_updated_at 
  BEFORE UPDATE ON public.gf_carrier_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- PART 8: VIEW FOR EXPIRING DOCUMENTS
-- ====================================================
CREATE OR REPLACE VIEW public.v_all_expiring_documents AS
-- veiculo Documents
SELECT 
  'veiculo' as entity_type,
  vd.vehicle_id as entity_id,
  v.plate as entity_name,
  vd.document_type,
  vd.expiry_date,
  vd.file_url,
  vd.status,
  CASE 
    WHEN vd.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN vd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'critical'
    WHEN vd.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'warning'
    ELSE 'ok'
  END as alert_level,
  v.company_id,
  v.transportadora_id
FROM public.gf_vehicle_documents vd
JOIN public.vehicles v ON vd.vehicle_id = v.id
WHERE vd.expiry_date IS NOT NULL

UNION ALL

-- motorista Documents
SELECT 
  'motorista' as entity_type,
  dd.driver_id as entity_id,
  u.name as entity_name,
  dd.document_type,
  dd.expires_at as expiry_date,
  dd.file_url,
  COALESCE(dd.status, CASE WHEN dd.is_valid THEN 'valid' ELSE 'expired' END) as status,
  CASE 
    WHEN dd.expires_at < CURRENT_DATE THEN 'expired'
    WHEN dd.expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'critical'
    WHEN dd.expires_at <= CURRENT_DATE + INTERVAL '60 days' THEN 'warning'
    ELSE 'ok'
  END as alert_level,
  u.company_id,
  u.transportadora_id
FROM public.gf_driver_documents dd
JOIN public.users u ON dd.driver_id = u.id
WHERE dd.expires_at IS NOT NULL

UNION ALL

-- transportadora Documents
SELECT 
  'transportadora' as entity_type,
  cd.carrier_id as entity_id,
  c.name as entity_name,
  cd.document_type,
  cd.expiry_date,
  cd.file_url,
  cd.status,
  CASE 
    WHEN cd.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN cd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'critical'
    WHEN cd.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'warning'
    ELSE 'ok'
  END as alert_level,
  NULL as company_id,
  cd.carrier_id as transportadora_id
FROM public.gf_carrier_documents cd
JOIN public.carriers c ON cd.carrier_id = c.id
WHERE cd.expiry_date IS NOT NULL;

COMMENT ON VIEW public.v_all_expiring_documents IS 'View unificada de documentos com vencimento próximo ou expirados';

-- ====================================================
-- END OF MIGRATION
-- ====================================================
SELECT 'Migration 003_attachments_schema completed successfully!' as status;
