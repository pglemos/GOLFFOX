-- ============================================================================
-- v50_carrier_driver_documents.sql
-- Tabelas de documentos e exames médicos dos motoristas
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON public.driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_expiry_date ON public.driver_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_driver_medical_exams_driver_id ON public.driver_medical_exams(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_medical_exams_expiry_date ON public.driver_medical_exams(expiry_date);

-- RLS Policies
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

-- Comentários para documentação
COMMENT ON TABLE public.driver_documents IS 'Documentos dos motoristas (CNH, CPF, RG, etc.)';
COMMENT ON TABLE public.driver_medical_exams IS 'Exames médicos dos motoristas (admissional, periódico, toxicológico)';

