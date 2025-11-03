-- RLS (Row Level Security) Policies for Operator Panel - GOLF FOX v42.6
-- Policies ensuring operators only access their company data

-- Enable RLS on all operator tables
ALTER TABLE IF EXISTS gf_operator_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_operator_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_assigned_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_announcement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_operator_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_operator_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gf_audit_log ENABLE ROW LEVEL SECURITY;

-- gf_operator_settings: Operador pode ler/atualizar apenas suas próprias configurações
DROP POLICY IF EXISTS operator_select_settings ON gf_operator_settings;
CREATE POLICY operator_select_settings ON gf_operator_settings
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

DROP POLICY IF EXISTS operator_update_settings ON gf_operator_settings;
CREATE POLICY operator_update_settings ON gf_operator_settings
  FOR UPDATE
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

DROP POLICY IF EXISTS operator_insert_settings ON gf_operator_settings;
CREATE POLICY operator_insert_settings ON gf_operator_settings
  FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- gf_cost_centers: Operador pode CRUD apenas centros de custo da sua empresa
DROP POLICY IF EXISTS operator_select_cost_centers ON gf_cost_centers;
CREATE POLICY operator_select_cost_centers ON gf_cost_centers
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

DROP POLICY IF EXISTS operator_modify_cost_centers ON gf_cost_centers;
CREATE POLICY operator_modify_cost_centers ON gf_cost_centers
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- gf_service_requests: Operador pode criar e ler suas solicitações
DROP POLICY IF EXISTS operator_select_service_requests ON gf_service_requests;
CREATE POLICY operator_select_service_requests ON gf_service_requests
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

DROP POLICY IF EXISTS operator_insert_service_requests ON gf_service_requests;
CREATE POLICY operator_insert_service_requests ON gf_service_requests
  FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
    AND created_by = auth.uid()
  );

-- gf_operator_incidents: Operador pode criar e ler seus incidentes
DROP POLICY IF EXISTS operator_select_incidents ON gf_operator_incidents;
CREATE POLICY operator_select_incidents ON gf_operator_incidents
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

DROP POLICY IF EXISTS operator_insert_incidents ON gf_operator_incidents;
CREATE POLICY operator_insert_incidents ON gf_operator_incidents
  FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
    AND created_by = auth.uid()
  );

-- gf_assigned_carriers: READ-ONLY para operador (apenas visualizar prestadores alocados)
DROP POLICY IF EXISTS operator_select_assigned_carriers ON gf_assigned_carriers;
CREATE POLICY operator_select_assigned_carriers ON gf_assigned_carriers
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Operador NÃO pode INSERT/UPDATE/DELETE em assigned_carriers (admin apenas)
-- Não criar policies de modificação aqui

-- gf_invoices: Operador pode ler e atualizar suas faturas
DROP POLICY IF EXISTS operator_select_invoices ON gf_invoices;
CREATE POLICY operator_select_invoices ON gf_invoices
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

DROP POLICY IF EXISTS operator_update_invoices ON gf_invoices;
CREATE POLICY operator_update_invoices ON gf_invoices
  FOR UPDATE
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- gf_invoice_lines: Operador pode ler linhas de suas faturas
DROP POLICY IF EXISTS operator_select_invoice_lines ON gf_invoice_lines;
CREATE POLICY operator_select_invoice_lines ON gf_invoice_lines
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM gf_invoices WHERE empresa_id IN (
        SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
      )
    )
  );

-- gf_announcements: Operador pode CRUD broadcasts da sua empresa
DROP POLICY IF EXISTS operator_select_announcements ON gf_announcements;
CREATE POLICY operator_select_announcements ON gf_announcements
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

DROP POLICY IF EXISTS operator_modify_announcements ON gf_announcements;
CREATE POLICY operator_modify_announcements ON gf_announcements
  FOR ALL
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- gf_announcement_templates: Operador pode CRUD templates da sua empresa
DROP POLICY IF EXISTS operator_modify_templates ON gf_announcement_templates;
CREATE POLICY operator_modify_templates ON gf_announcement_templates
  FOR ALL
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- gf_announcement_reads: Operador pode criar leituras
DROP POLICY IF EXISTS operator_modify_reads ON gf_announcement_reads;
CREATE POLICY operator_modify_reads ON gf_announcement_reads
  FOR ALL
  USING (
    announcement_id IN (
      SELECT id FROM gf_announcements WHERE empresa_id IN (
        SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
      )
    )
    OR user_id = auth.uid()
  );

-- gf_holidays: Operador pode CRUD feriados da sua empresa
DROP POLICY IF EXISTS operator_modify_holidays ON gf_holidays;
CREATE POLICY operator_modify_holidays ON gf_holidays
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- gf_operator_audits: Operador pode criar e ler auditorias da sua empresa
DROP POLICY IF EXISTS operator_modify_audits ON gf_operator_audits;
CREATE POLICY operator_modify_audits ON gf_operator_audits
  FOR ALL
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- gf_operator_documents: Operador pode CRUD documentos da sua empresa
DROP POLICY IF EXISTS operator_modify_documents ON gf_operator_documents;
CREATE POLICY operator_modify_documents ON gf_operator_documents
  FOR ALL
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- gf_audit_log: Operador pode ler seus próprios logs
DROP POLICY IF EXISTS operator_select_audit_log ON gf_audit_log;
CREATE POLICY operator_select_audit_log ON gf_audit_log
  FOR SELECT
  USING (
    operator_id = auth.uid()
    OR operator_id IN (
      SELECT id FROM users WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
      )
    )
  );

-- Routes: Operador pode ler apenas suas rotas
-- (Assumindo que já existe RLS em routes, adicionar política específica para operator)
DROP POLICY IF EXISTS operator_select_routes ON routes;
CREATE POLICY operator_select_routes ON routes
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Trips: Operador pode ler apenas viagens de suas rotas
-- (Assumindo que já existe RLS em trips)
DROP POLICY IF EXISTS operator_select_trips ON trips;
CREATE POLICY operator_select_trips ON trips
  FOR SELECT
  USING (
    route_id IN (
      SELECT id FROM routes WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
      )
    )
  );

-- gf_employee_company: Operador pode CRUD seus funcionários
DROP POLICY IF EXISTS operator_modify_employees ON gf_employee_company;
CREATE POLICY operator_modify_employees ON gf_employee_company
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Companies (carriers): Operador NÃO pode modificar transportadoras (read-only via view)
-- Não criar policies de modificação aqui, apenas garantir que SELECT é via view v_operator_assigned_carriers

-- Vehicles: Operador NÃO pode modificar veículos (read-only)
-- Não criar policies de modificação aqui

-- Users (drivers): Operador NÃO pode modificar motoristas (read-only)
-- Não criar policies de modificação aqui

