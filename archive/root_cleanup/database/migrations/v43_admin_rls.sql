-- Migration: v43_admin_rls
-- RLS policies para tabelas admin com admin bypass
-- Admin pode tudo (SELECT/INSERT/UPDATE/DELETE), demais papéis por company_id

-- Função helper para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(
      get_user_role() = 'admin',
      auth.role() = 'admin',
      (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin',
      false
    );
$$;

COMMENT ON FUNCTION public.is_admin() IS 
  'Verifica se o usuário autenticado é admin através de múltiplas verificações (get_user_role, auth.role, JWT claim).';

-- ============================================
-- GF_COST_CENTERS
-- ============================================
ALTER TABLE IF EXISTS public.gf_cost_centers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_gf_cost_centers ON public.gf_cost_centers;
CREATE POLICY admin_full_access_gf_cost_centers ON public.gf_cost_centers
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS operator_manage_cost_centers ON public.gf_cost_centers;
CREATE POLICY operator_manage_cost_centers ON public.gf_cost_centers
  FOR ALL USING (company_ownership(company_id))
  WITH CHECK (company_ownership(company_id));

-- ============================================
-- GF_INVOICES
-- ============================================
ALTER TABLE IF EXISTS public.gf_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_gf_invoices ON public.gf_invoices;
CREATE POLICY admin_full_access_gf_invoices ON public.gf_invoices
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- Operator vê suas próprias faturas
DROP POLICY IF EXISTS operator_view_own_invoices ON public.gf_invoices;
CREATE POLICY operator_view_own_invoices ON public.gf_invoices
  FOR SELECT USING (
    company_ownership(empresa_id) OR company_ownership(COALESCE(carrier_id, empresa_id))
  );

-- Carrier vê faturas onde é a transportadora
DROP POLICY IF EXISTS carrier_view_invoices ON public.gf_invoices;
CREATE POLICY carrier_view_invoices ON public.gf_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gf_user_company_map ucm
      WHERE ucm.user_id = auth.uid() 
      AND ucm.company_id = carrier_id
    )
  );

-- ============================================
-- GF_INVOICE_LINES
-- ============================================
ALTER TABLE IF EXISTS public.gf_invoice_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_gf_invoice_lines ON public.gf_invoice_lines;
CREATE POLICY admin_full_access_gf_invoice_lines ON public.gf_invoice_lines
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- Operator vê linhas de suas faturas
DROP POLICY IF EXISTS operator_view_invoice_lines ON public.gf_invoice_lines;
CREATE POLICY operator_view_invoice_lines ON public.gf_invoice_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gf_invoices i
      WHERE i.id = invoice_id
      AND (company_ownership(i.empresa_id) OR company_ownership(COALESCE(i.carrier_id, i.empresa_id)))
    )
  );

-- Carrier vê linhas de faturas onde é transportadora
DROP POLICY IF EXISTS carrier_view_invoice_lines ON public.gf_invoice_lines;
CREATE POLICY carrier_view_invoice_lines ON public.gf_invoice_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gf_invoices i
      JOIN public.gf_user_company_map ucm ON ucm.company_id = i.carrier_id
      WHERE i.id = invoice_id
      AND ucm.user_id = auth.uid()
    )
  );

-- ============================================
-- GF_VEHICLE_MAINTENANCE
-- ============================================
ALTER TABLE IF EXISTS public.gf_vehicle_maintenance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_gf_vehicle_maintenance ON public.gf_vehicle_maintenance;
CREATE POLICY admin_full_access_gf_vehicle_maintenance ON public.gf_vehicle_maintenance
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS company_manage_vehicle_maintenance ON public.gf_vehicle_maintenance;
CREATE POLICY company_manage_vehicle_maintenance ON public.gf_vehicle_maintenance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_id
      AND company_ownership(v.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_id
      AND company_ownership(v.company_id)
    )
  );

-- ============================================
-- GF_VEHICLE_CHECKLISTS
-- ============================================
ALTER TABLE IF EXISTS public.gf_vehicle_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_gf_vehicle_checklists ON public.gf_vehicle_checklists;
CREATE POLICY admin_full_access_gf_vehicle_checklists ON public.gf_vehicle_checklists
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS company_manage_vehicle_checklists ON public.gf_vehicle_checklists;
CREATE POLICY company_manage_vehicle_checklists ON public.gf_vehicle_checklists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_id
      AND company_ownership(v.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_id
      AND company_ownership(v.company_id)
    )
  );

-- Driver pode ver seus próprios checklists
DROP POLICY IF EXISTS driver_view_own_checklists ON public.gf_vehicle_checklists;
CREATE POLICY driver_view_own_checklists ON public.gf_vehicle_checklists
  FOR SELECT USING (driver_id = auth.uid());

-- ============================================
-- GF_DRIVER_DOCUMENTS
-- ============================================
ALTER TABLE IF EXISTS public.gf_driver_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_gf_driver_documents ON public.gf_driver_documents;
CREATE POLICY admin_full_access_gf_driver_documents ON public.gf_driver_documents
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS company_manage_driver_documents ON public.gf_driver_documents;
CREATE POLICY company_manage_driver_documents ON public.gf_driver_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.gf_user_company_map ucm ON ucm.user_id = u.id
      WHERE u.id = driver_id
      AND company_ownership(ucm.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.gf_user_company_map ucm ON ucm.user_id = u.id
      WHERE u.id = driver_id
      AND company_ownership(ucm.company_id)
    )
  );

-- Driver pode ver seus próprios documentos
DROP POLICY IF EXISTS driver_view_own_documents ON public.gf_driver_documents;
CREATE POLICY driver_view_own_documents ON public.gf_driver_documents
  FOR SELECT USING (driver_id = auth.uid());

-- ============================================
-- GF_INCIDENTS
-- ============================================
ALTER TABLE IF EXISTS public.gf_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_gf_incidents ON public.gf_incidents;
CREATE POLICY admin_full_access_gf_incidents ON public.gf_incidents
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS company_manage_incidents ON public.gf_incidents;
CREATE POLICY company_manage_incidents ON public.gf_incidents
  FOR ALL USING (company_ownership(company_id))
  WITH CHECK (company_ownership(company_id));

-- Driver pode ver incidentes relacionados a ele
DROP POLICY IF EXISTS driver_view_related_incidents ON public.gf_incidents;
CREATE POLICY driver_view_related_incidents ON public.gf_incidents
  FOR SELECT USING (driver_id = auth.uid());

-- ============================================
-- GF_AUDIT_LOG
-- ============================================
ALTER TABLE IF EXISTS public.gf_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_gf_audit_log ON public.gf_audit_log;
CREATE POLICY admin_full_access_gf_audit_log ON public.gf_audit_log
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- Usuários podem ver seus próprios logs
DROP POLICY IF EXISTS user_view_own_audit_log ON public.gf_audit_log;
CREATE POLICY user_view_own_audit_log ON public.gf_audit_log
  FOR SELECT USING (actor_id = auth.uid());

-- Operator pode ver logs de sua empresa
DROP POLICY IF EXISTS operator_view_company_audit_log ON public.gf_audit_log;
CREATE POLICY operator_view_company_audit_log ON public.gf_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gf_user_company_map ucm
      WHERE ucm.user_id = auth.uid()
      AND ucm.company_id = (details->>'companyId')::uuid
    )
  );

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_gf_cost_centers_company_active 
  ON public.gf_cost_centers(company_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_gf_invoices_period_status 
  ON public.gf_invoices(period_start, period_end, status);

CREATE INDEX IF NOT EXISTS idx_gf_invoice_lines_invoice_route 
  ON public.gf_invoice_lines(invoice_id, route_id);

CREATE INDEX IF NOT EXISTS idx_gf_vehicle_maintenance_vehicle_due 
  ON public.gf_vehicle_maintenance(vehicle_id, due_at) 
  WHERE due_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gf_vehicle_checklists_vehicle_filled 
  ON public.gf_vehicle_checklists(vehicle_id, filled_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_driver_documents_driver_expires 
  ON public.gf_driver_documents(driver_id, expires_at) 
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gf_incidents_company_severity 
  ON public.gf_incidents(company_id, severity, status);

CREATE INDEX IF NOT EXISTS idx_gf_incidents_created_at 
  ON public.gf_incidents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_audit_log_actor_created 
  ON public.gf_audit_log(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_audit_log_resource 
  ON public.gf_audit_log(resource_type, resource_id) 
  WHERE resource_type IS NOT NULL AND resource_id IS NOT NULL;

-- Comentários
COMMENT ON POLICY admin_full_access_gf_cost_centers ON public.gf_cost_centers IS 
  'Admin tem acesso completo a todos os centros de custo.';
COMMENT ON POLICY admin_full_access_gf_invoices ON public.gf_invoices IS 
  'Admin tem acesso completo a todas as faturas.';
COMMENT ON POLICY admin_full_access_gf_vehicle_maintenance ON public.gf_vehicle_maintenance IS 
  'Admin tem acesso completo a todas as manutenções.';
COMMENT ON POLICY admin_full_access_gf_vehicle_checklists ON public.gf_vehicle_checklists IS 
  'Admin tem acesso completo a todos os checklists.';
COMMENT ON POLICY admin_full_access_gf_driver_documents ON public.gf_driver_documents IS 
  'Admin tem acesso completo a todos os documentos de motoristas.';
COMMENT ON POLICY admin_full_access_gf_incidents ON public.gf_incidents IS 
  'Admin tem acesso completo a todos os incidentes.';
COMMENT ON POLICY admin_full_access_gf_audit_log ON public.gf_audit_log IS 
  'Admin tem acesso completo a todos os logs de auditoria.';

