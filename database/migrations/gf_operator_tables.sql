-- Migrations for Operator Panel - GOLF FOX v42.6
-- Tables and structures for operator functionality

-- gf_operator_settings: Configurações do operador
CREATE TABLE IF NOT EXISTS gf_operator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) UNIQUE NOT NULL,
  turnos_padrao JSONB, -- {manha: {inicio, fim}, tarde: {...}, noite: {...}}
  tolerancias JSONB, -- {atraso_max: 10, espera_max: 15}
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_operator_settings_empresa ON gf_operator_settings(empresa_id);

-- gf_cost_centers: Centros de custo
CREATE TABLE IF NOT EXISTS gf_cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_gf_cost_centers_company ON gf_cost_centers(company_id);

-- gf_service_requests: Solicitações do operador para GOLF FOX
CREATE TABLE IF NOT EXISTS gf_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'nova_rota', 'alteracao', 'reforco', 'cancelamento', 'socorro', 'incluir_funcionario', 'incidente'
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'rascunho', -- 'rascunho', 'enviado', 'em_analise', 'aprovado', 'reprovado', 'em_operacao'
  sla_target TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id), -- Admin GOLF FOX que está analisando
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gf_service_requests_empresa ON gf_service_requests(empresa_id);
CREATE INDEX IF NOT EXISTS idx_gf_service_requests_status ON gf_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_gf_service_requests_tipo ON gf_service_requests(tipo);

-- gf_operator_incidents: Incidentes reportados pelo operador
CREATE TABLE IF NOT EXISTS gf_operator_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL,
  route_id UUID REFERENCES routes(id),
  tipo VARCHAR(50) NOT NULL, -- 'atraso', 'desvio', 'veículo_quebrado', 'motorista', 'outro'
  severidade VARCHAR(20) DEFAULT 'media', -- 'baixa', 'media', 'alta', 'critica'
  descricao TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'aberto', -- 'aberto', 'em_analise', 'resolvido', 'fechado'
  created_by UUID REFERENCES users(id),
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gf_operator_incidents_empresa ON gf_operator_incidents(empresa_id);
CREATE INDEX IF NOT EXISTS idx_gf_operator_incidents_route ON gf_operator_incidents(route_id);

-- gf_assigned_carriers: Transportadoras alocadas pela GOLF FOX (read-only para operador)
CREATE TABLE IF NOT EXISTS gf_assigned_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL, -- Operador
  carrier_id UUID REFERENCES companies(id) NOT NULL, -- Transportadora
  period_start DATE NOT NULL,
  period_end DATE,
  notes TEXT,
  assigned_by UUID REFERENCES users(id), -- Admin GOLF FOX
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, carrier_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_gf_assigned_carriers_empresa ON gf_assigned_carriers(empresa_id);
CREATE INDEX IF NOT EXISTS idx_gf_assigned_carriers_carrier ON gf_assigned_carriers(carrier_id);

-- gf_invoices: Faturas GOLF FOX → Operador
CREATE TABLE IF NOT EXISTS gf_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL, -- Operador
  invoice_number VARCHAR(50) UNIQUE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reconciled', 'approved', 'rejected', 'paid'
  reconciled_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gf_invoices_empresa ON gf_invoices(empresa_id);
CREATE INDEX IF NOT EXISTS idx_gf_invoices_status ON gf_invoices(status);

-- gf_invoice_lines: Linhas de fatura (detalhamento)
CREATE TABLE IF NOT EXISTS gf_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES gf_invoices(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id),
  description TEXT,
  measured_km NUMERIC,
  invoiced_km NUMERIC,
  measured_time INTEGER, -- minutes
  invoiced_time INTEGER,
  measured_trips INTEGER,
  invoiced_trips INTEGER,
  unit_price NUMERIC,
  amount NUMERIC NOT NULL,
  discrepancy NUMERIC, -- diferença
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_gf_invoice_lines_invoice ON gf_invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_gf_invoice_lines_route ON gf_invoice_lines(route_id);

-- gf_announcements: Broadcasts do operador
CREATE TABLE IF NOT EXISTS gf_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES users(id),
  empresa_id UUID REFERENCES companies(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_type VARCHAR(20), -- 'company', 'route', 'shift'
  target_ids UUID[],
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_announcements_empresa ON gf_announcements(empresa_id);

-- gf_announcement_templates: Templates de broadcasts
CREATE TABLE IF NOT EXISTS gf_announcement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50), -- 'manha', 'tarde', 'noite', 'contingencia'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_announcement_templates_empresa ON gf_announcement_templates(empresa_id);

-- gf_announcement_reads: Leitura de broadcasts (para taxa de leitura)
CREATE TABLE IF NOT EXISTS gf_announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES gf_announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gf_announcement_reads_announcement ON gf_announcement_reads(announcement_id);

-- gf_holidays: Feriados corporativos
CREATE TABLE IF NOT EXISTS gf_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, date)
);

CREATE INDEX IF NOT EXISTS idx_gf_holidays_company ON gf_holidays(company_id);

-- gf_operator_audits: Auditorias simples do operador
CREATE TABLE IF NOT EXISTS gf_operator_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL,
  audit_type VARCHAR(50) NOT NULL, -- 'checklist', 'vistoria', 'documentacao'
  checklist_data JSONB,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_operator_audits_empresa ON gf_operator_audits(empresa_id);

-- gf_operator_documents: Documentos da empresa (políticas internas)
CREATE TABLE IF NOT EXISTS gf_operator_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50), -- 'politica', 'manual', 'procedimento', 'outro'
  document_url TEXT NOT NULL,
  expires_at DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_operator_documents_empresa ON gf_operator_documents(empresa_id);
CREATE INDEX IF NOT EXISTS idx_gf_operator_documents_expires ON gf_operator_documents(expires_at);

-- gf_audit_log: Log de auditoria geral (reusar ou expandir se necessário)
CREATE TABLE IF NOT EXISTS gf_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_audit_log_operator ON gf_audit_log(operator_id);
CREATE INDEX IF NOT EXISTS idx_gf_audit_log_action ON gf_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_gf_audit_log_created ON gf_audit_log(created_at);

-- Trigger para updated_at em gf_operator_settings
CREATE OR REPLACE FUNCTION update_gf_operator_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gf_operator_settings_updated_at ON gf_operator_settings;
CREATE TRIGGER trigger_gf_operator_settings_updated_at
  BEFORE UPDATE ON gf_operator_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_gf_operator_settings_updated_at();

-- Trigger para updated_at em gf_service_requests
CREATE OR REPLACE FUNCTION update_gf_service_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gf_service_requests_updated_at ON gf_service_requests;
CREATE TRIGGER trigger_gf_service_requests_updated_at
  BEFORE UPDATE ON gf_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_gf_service_requests_updated_at();

