-- ========================================
-- Migration v58: Fix RLS Policies para usar transportadora_id
-- ========================================
-- 
-- Esta migration atualiza todas as RLS policies das tabelas de documentos
-- e custos para usar transportadora_id ao invés de carrier_id
--

-- ========================================
-- 1. Driver Documents Policies
-- ========================================
DROP POLICY IF EXISTS "Carriers can view their drivers documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Carriers can insert their drivers documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Carriers can update their drivers documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Carriers can delete their drivers documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Transportadoras can view their drivers documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Transportadoras can insert their drivers documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Transportadoras can update their drivers documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Transportadoras can delete their drivers documents" ON public.driver_documents;

CREATE POLICY "Transportadoras can view their drivers documents"
  ON public.driver_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_documents.driver_id
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Transportadoras can insert their drivers documents"
  ON public.driver_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_documents.driver_id
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Transportadoras can update their drivers documents"
  ON public.driver_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_documents.driver_id
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Transportadoras can delete their drivers documents"
  ON public.driver_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_documents.driver_id
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

-- ========================================
-- 2. Driver Medical Exams Policies
-- ========================================
DROP POLICY IF EXISTS "Carriers can view their drivers exams" ON public.driver_medical_exams;
DROP POLICY IF EXISTS "Carriers can insert their drivers exams" ON public.driver_medical_exams;
DROP POLICY IF EXISTS "Carriers can update their drivers exams" ON public.driver_medical_exams;
DROP POLICY IF EXISTS "Carriers can delete their drivers exams" ON public.driver_medical_exams;
DROP POLICY IF EXISTS "Transportadoras can view their drivers exams" ON public.driver_medical_exams;
DROP POLICY IF EXISTS "Transportadoras can insert their drivers exams" ON public.driver_medical_exams;
DROP POLICY IF EXISTS "Transportadoras can update their drivers exams" ON public.driver_medical_exams;
DROP POLICY IF EXISTS "Transportadoras can delete their drivers exams" ON public.driver_medical_exams;

CREATE POLICY "Transportadoras can view their drivers exams"
  ON public.driver_medical_exams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_medical_exams.driver_id
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Transportadoras can insert their drivers exams"
  ON public.driver_medical_exams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_medical_exams.driver_id
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Transportadoras can update their drivers exams"
  ON public.driver_medical_exams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_medical_exams.driver_id
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Transportadoras can delete their drivers exams"
  ON public.driver_medical_exams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = driver_medical_exams.driver_id
      AND u.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

-- ========================================
-- 3. Vehicle Documents Policies
-- ========================================
DROP POLICY IF EXISTS "Carriers can manage their vehicle documents" ON public.vehicle_documents;
DROP POLICY IF EXISTS "Transportadoras can manage their vehicle documents" ON public.vehicle_documents;

CREATE POLICY "Transportadoras can manage their vehicle documents"
  ON public.vehicle_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_documents.vehicle_id
      AND v.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

-- ========================================
-- 4. Vehicle Maintenances Policies
-- ========================================
DROP POLICY IF EXISTS "Carriers can manage their vehicle maintenances" ON public.vehicle_maintenances;
DROP POLICY IF EXISTS "Transportadoras can manage their vehicle maintenances" ON public.vehicle_maintenances;

CREATE POLICY "Transportadoras can manage their vehicle maintenances"
  ON public.vehicle_maintenances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_maintenances.vehicle_id
      AND v.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

-- ========================================
-- 5. Vehicle Costs Policies
-- ========================================
DROP POLICY IF EXISTS "Carriers can manage their vehicle costs" ON public.vehicle_costs;
DROP POLICY IF EXISTS "Transportadoras can manage their vehicle costs" ON public.vehicle_costs;

CREATE POLICY "Transportadoras can manage their vehicle costs"
  ON public.vehicle_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_costs.vehicle_id
      AND v.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

-- ========================================
-- 6. Route Costs Policies
-- ========================================
DROP POLICY IF EXISTS "Carriers can manage their route costs" ON public.route_costs;
DROP POLICY IF EXISTS "Transportadoras can manage their route costs" ON public.route_costs;

CREATE POLICY "Transportadoras can manage their route costs"
  ON public.route_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.routes r
      WHERE r.id = route_costs.route_id
      AND r.transportadora_id = (SELECT transportadora_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Comentários para documentação
COMMENT ON POLICY "Transportadoras can view their drivers documents" ON public.driver_documents IS 'Transportadoras podem visualizar documentos de seus motoristas';
COMMENT ON POLICY "Transportadoras can view their drivers exams" ON public.driver_medical_exams IS 'Transportadoras podem visualizar exames médicos de seus motoristas';
COMMENT ON POLICY "Transportadoras can manage their vehicle documents" ON public.vehicle_documents IS 'Transportadoras podem gerenciar documentos de seus veículos';
COMMENT ON POLICY "Transportadoras can manage their vehicle maintenances" ON public.vehicle_maintenances IS 'Transportadoras podem gerenciar manutenções de seus veículos';
COMMENT ON POLICY "Transportadoras can manage their vehicle costs" ON public.vehicle_costs IS 'Transportadoras podem gerenciar custos de seus veículos';
COMMENT ON POLICY "Transportadoras can manage their route costs" ON public.route_costs IS 'Transportadoras podem gerenciar custos de suas rotas';

