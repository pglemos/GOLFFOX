-- ============================================================
-- Migration: Sistema Financeiro Completo - Golf Fox
-- Data: 2024-12-11
-- Descrição: Estrutura para custos manuais, receitas, orçamentos
--            e projeções financeiras com suporte multi-tenant
-- ============================================================

-- ============================================================
-- 1. TABELA: Categorias de Custos por Perfil
-- ============================================================
CREATE TABLE IF NOT EXISTS gf_cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  profile_type VARCHAR(20) NOT NULL CHECK (profile_type IN ('admin', 'empresa', 'transportadora', 'all')),
  parent_id UUID REFERENCES gf_cost_categories(id) ON DELETE SET NULL,
  icon VARCHAR(50), -- Nome do ícone lucide-react
  color VARCHAR(7), -- Cor hex para UI
  keywords TEXT[] DEFAULT '{}', -- Palavras-chave para sugestões inteligentes
  is_operational BOOLEAN DEFAULT false, -- Se é custo operacional (veículo/rota)
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cost_categories_profile ON gf_cost_categories(profile_type);
CREATE INDEX IF NOT EXISTS idx_cost_categories_parent ON gf_cost_categories(parent_id);

-- ============================================================
-- 2. TABELA: Custos Manuais (Expandida)
-- ============================================================
CREATE TABLE IF NOT EXISTS gf_manual_costs_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Vínculo multi-tenant
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
  -- Dados do custo
  category_id UUID REFERENCES gf_cost_categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  cost_date DATE NOT NULL,
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurring_interval VARCHAR(20) CHECK (recurring_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurring_end_date DATE,
  parent_recurring_id UUID REFERENCES gf_manual_costs_v2(id), -- Gerado automaticamente
  -- Vínculos operacionais (opcional)
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Documentação
  attachment_url TEXT,
  attachment_name VARCHAR(255),
  notes TEXT,
  -- Metadata
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: pelo menos um tenant
  CONSTRAINT chk_tenant CHECK (company_id IS NOT NULL OR carrier_id IS NOT NULL)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_manual_costs_v2_company ON gf_manual_costs_v2(company_id);
CREATE INDEX IF NOT EXISTS idx_manual_costs_v2_carrier ON gf_manual_costs_v2(carrier_id);
CREATE INDEX IF NOT EXISTS idx_manual_costs_v2_date ON gf_manual_costs_v2(cost_date);
CREATE INDEX IF NOT EXISTS idx_manual_costs_v2_category ON gf_manual_costs_v2(category_id);
CREATE INDEX IF NOT EXISTS idx_manual_costs_v2_vehicle ON gf_manual_costs_v2(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_manual_costs_v2_recurring ON gf_manual_costs_v2(is_recurring) WHERE is_recurring = true;

-- ============================================================
-- 3. TABELA: Receitas Manuais
-- ============================================================
CREATE TABLE IF NOT EXISTS gf_manual_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Vínculo multi-tenant
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
  -- Dados da receita
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  revenue_date DATE NOT NULL,
  -- Vínculo a contrato (se aplicável)
  contract_reference VARCHAR(100),
  invoice_number VARCHAR(50),
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurring_interval VARCHAR(20) CHECK (recurring_interval IN ('monthly', 'yearly')),
  -- Documentação
  attachment_url TEXT,
  notes TEXT,
  -- Metadata
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: pelo menos um tenant
  CONSTRAINT chk_revenue_tenant CHECK (company_id IS NOT NULL OR carrier_id IS NOT NULL)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_revenues_company ON gf_manual_revenues(company_id);
CREATE INDEX IF NOT EXISTS idx_revenues_carrier ON gf_manual_revenues(carrier_id);
CREATE INDEX IF NOT EXISTS idx_revenues_date ON gf_manual_revenues(revenue_date);

-- ============================================================
-- 4. TABELA: Orçamentos por Categoria
-- ============================================================
CREATE TABLE IF NOT EXISTS gf_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Vínculo multi-tenant
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
  -- Dados do orçamento
  category_id UUID REFERENCES gf_cost_categories(id),
  category_name VARCHAR(100), -- Fallback se não usar categoria
  period_year INT NOT NULL CHECK (period_year >= 2020 AND period_year <= 2100),
  period_month INT NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  budgeted_amount DECIMAL(15,2) NOT NULL CHECK (budgeted_amount >= 0),
  -- Alertas
  alert_threshold_percent INT DEFAULT 80, -- Alerta quando atingir X%
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unicidade
  CONSTRAINT uq_budget UNIQUE NULLS NOT DISTINCT (company_id, carrier_id, category_id, period_year, period_month)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_budgets_company ON gf_budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_budgets_carrier ON gf_budgets(carrier_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON gf_budgets(period_year, period_month);

-- ============================================================
-- 5. TABELA: Projeções Financeiras
-- ============================================================
CREATE TABLE IF NOT EXISTS gf_financial_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Vínculo
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
  -- Dados da projeção
  forecast_type VARCHAR(20) NOT NULL CHECK (forecast_type IN ('cost', 'revenue')),
  category_id UUID REFERENCES gf_cost_categories(id),
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  projected_amount DECIMAL(15,2) NOT NULL,
  actual_amount DECIMAL(15,2), -- Preenchido quando período encerra
  confidence_level DECIMAL(3,2) DEFAULT 0.80, -- 0.00 a 1.00
  -- Método de cálculo
  calculation_method VARCHAR(50) DEFAULT 'moving_average', -- 'moving_average', 'linear_regression', 'seasonal'
  base_period_months INT DEFAULT 3, -- Meses usados para calcular
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_forecasts_company ON gf_financial_forecasts(company_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_carrier ON gf_financial_forecasts(carrier_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_period ON gf_financial_forecasts(period_year, period_month);

-- ============================================================
-- 6. TABELA: Alertas Financeiros
-- ============================================================
CREATE TABLE IF NOT EXISTS gf_financial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Vínculo
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
  -- Dados do alerta
  alert_type VARCHAR(50) NOT NULL, -- 'budget_exceeded', 'unusual_expense', 'recurring_due', 'forecast_deviation'
  severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  -- Referências
  cost_id UUID REFERENCES gf_manual_costs_v2(id) ON DELETE SET NULL,
  budget_id UUID REFERENCES gf_budgets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES gf_cost_categories(id),
  -- Valores
  threshold_value DECIMAL(15,2),
  actual_value DECIMAL(15,2),
  variance_percent DECIMAL(5,2),
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_by UUID REFERENCES profiles(id),
  dismissed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fin_alerts_company ON gf_financial_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_fin_alerts_carrier ON gf_financial_alerts(carrier_id);
CREATE INDEX IF NOT EXISTS idx_fin_alerts_unread ON gf_financial_alerts(is_read) WHERE is_read = false;

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE gf_cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_manual_costs_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_manual_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_financial_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_financial_alerts ENABLE ROW LEVEL SECURITY;

-- Categorias: Todos podem ler, apenas admin pode modificar
CREATE POLICY "categories_read_all" ON gf_cost_categories
  FOR SELECT USING (true);

CREATE POLICY "categories_admin_write" ON gf_cost_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Custos: Admin vê tudo, outros veem seu tenant
CREATE POLICY "costs_admin_full" ON gf_manual_costs_v2
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "costs_empresa_access" ON gf_manual_costs_v2
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "costs_transportadora_access" ON gf_manual_costs_v2
  FOR ALL USING (
    carrier_id IN (SELECT carrier_id FROM profiles WHERE id = auth.uid())
  );

-- Receitas: Mesma lógica dos custos
CREATE POLICY "revenues_admin_full" ON gf_manual_revenues
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "revenues_empresa_access" ON gf_manual_revenues
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "revenues_transportadora_access" ON gf_manual_revenues
  FOR ALL USING (
    carrier_id IN (SELECT carrier_id FROM profiles WHERE id = auth.uid())
  );

-- Orçamentos: Mesma lógica
CREATE POLICY "budgets_admin_full" ON gf_budgets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "budgets_tenant_access" ON gf_budgets
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    OR carrier_id IN (SELECT carrier_id FROM profiles WHERE id = auth.uid())
  );

-- Projeções: Mesma lógica
CREATE POLICY "forecasts_admin_full" ON gf_financial_forecasts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "forecasts_tenant_access" ON gf_financial_forecasts
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    OR carrier_id IN (SELECT carrier_id FROM profiles WHERE id = auth.uid())
  );

-- Alertas financeiros: Mesma lógica
CREATE POLICY "fin_alerts_admin_full" ON gf_financial_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "fin_alerts_tenant_access" ON gf_financial_alerts
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    OR carrier_id IN (SELECT carrier_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- 8. DADOS INICIAIS: Categorias por Perfil
-- ============================================================

-- Categorias para Admin (Golf Fox)
INSERT INTO gf_cost_categories (name, profile_type, icon, color, keywords, is_operational, display_order) VALUES
  ('Folha de Pagamento', 'admin', 'users', '#2563EB', ARRAY['salário', 'funcionários', 'rh', 'pagamento'], false, 1),
  ('Benefícios', 'admin', 'gift', '#7C3AED', ARRAY['vale', 'alimentação', 'transporte', 'saúde', 'plano'], false, 2),
  ('Tecnologia', 'admin', 'monitor', '#0891B2', ARRAY['ti', 'software', 'servidor', 'licença', 'sistema'], false, 3),
  ('Marketing', 'admin', 'megaphone', '#EA580C', ARRAY['propaganda', 'publicidade', 'mídia', 'campanha'], false, 4),
  ('Infraestrutura', 'admin', 'building', '#64748B', ARRAY['aluguel', 'escritório', 'luz', 'água', 'internet'], false, 5),
  ('Seguros', 'admin', 'shield', '#059669', ARRAY['seguro', 'apólice', 'cobertura', 'sinistro'], false, 6),
  ('Jurídico', 'admin', 'scale', '#DC2626', ARRAY['advogado', 'processo', 'contrato', 'legal'], false, 7),
  ('Auditoria', 'admin', 'search', '#6366F1', ARRAY['auditoria', 'compliance', 'fiscalização'], false, 8),
  ('Despesas Operacionais', 'admin', 'truck', '#F97316', ARRAY['operação', 'transportadora', 'serviço'], true, 9)
ON CONFLICT DO NOTHING;

-- Categorias para Empresa Contratante
INSERT INTO gf_cost_categories (name, profile_type, icon, color, keywords, is_operational, display_order) VALUES
  ('Faturamento Golf Fox', 'empresa', 'file-text', '#F97316', ARRAY['fatura', 'mensalidade', 'contrato', 'golffox'], false, 1),
  ('Gestão Interna', 'empresa', 'briefcase', '#2563EB', ARRAY['rh', 'administração', 'coordenação'], false, 2),
  ('Comunicação', 'empresa', 'mail', '#7C3AED', ARRAY['comunicado', 'email', 'notificação'], false, 3),
  ('Eventos', 'empresa', 'calendar', '#059669', ARRAY['evento', 'confraternização', 'integração'], false, 4)
ON CONFLICT DO NOTHING;

-- Categorias para Transportadora
INSERT INTO gf_cost_categories (name, profile_type, icon, color, keywords, is_operational, display_order) VALUES
  ('Combustível', 'transportadora', 'fuel', '#F97316', ARRAY['diesel', 'gasolina', 'abastecimento', 'posto'], true, 1),
  ('Manutenção Preventiva', 'transportadora', 'wrench', '#2563EB', ARRAY['revisão', 'troca de óleo', 'filtro', 'preventiva'], true, 2),
  ('Manutenção Corretiva', 'transportadora', 'tool', '#DC2626', ARRAY['reparo', 'conserto', 'peça', 'quebra'], true, 3),
  ('Pneus', 'transportadora', 'circle', '#1E293B', ARRAY['pneu', 'calibragem', 'rodízio', 'borracha'], true, 4),
  ('Pedágios', 'transportadora', 'credit-card', '#64748B', ARRAY['pedágio', 'sem parar', 'veloe', 'conectcar'], true, 5),
  ('Salários Motoristas', 'transportadora', 'users', '#059669', ARRAY['salário', 'motorista', 'condutor', 'pagamento'], false, 6),
  ('Seguros Veículos', 'transportadora', 'shield', '#7C3AED', ARRAY['seguro', 'apólice', 'sinistro', 'veículo'], true, 7),
  ('Licenciamento', 'transportadora', 'file-badge', '#0891B2', ARRAY['licenciamento', 'ipva', 'dpvat', 'documento'], true, 8),
  ('Multas', 'transportadora', 'alert-circle', '#DC2626', ARRAY['multa', 'infração', 'radar', 'autuação'], true, 9),
  ('Limpeza', 'transportadora', 'sparkles', '#6366F1', ARRAY['limpeza', 'lavagem', 'higienização'], true, 10),
  ('Depreciação', 'transportadora', 'trending-down', '#64748B', ARRAY['depreciação', 'desgaste', 'valor'], false, 11)
ON CONFLICT DO NOTHING;

-- Categorias compartilhadas (todos os perfis)
INSERT INTO gf_cost_categories (name, profile_type, icon, color, keywords, is_operational, display_order) VALUES
  ('Outros', 'all', 'more-horizontal', '#94A3B8', ARRAY['outro', 'diversos', 'geral'], false, 99)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. VIEWS PARA DASHBOARDS
-- ============================================================

-- View: Custos vs Orçamento por mês
CREATE OR REPLACE VIEW v_costs_vs_budget_monthly AS
SELECT 
  COALESCE(c.company_id, c.carrier_id) as tenant_id,
  CASE WHEN c.company_id IS NOT NULL THEN 'empresa' ELSE 'transportadora' END as tenant_type,
  EXTRACT(YEAR FROM c.cost_date)::INT as period_year,
  EXTRACT(MONTH FROM c.cost_date)::INT as period_month,
  cat.name as category_name,
  c.category_id,
  SUM(c.amount) as total_cost,
  MAX(b.budgeted_amount) as budgeted_amount,
  CASE 
    WHEN MAX(b.budgeted_amount) > 0 
    THEN ROUND(((SUM(c.amount) - MAX(b.budgeted_amount)) / MAX(b.budgeted_amount) * 100)::numeric, 2)
    ELSE NULL 
  END as variance_percent
FROM gf_manual_costs_v2 c
LEFT JOIN gf_cost_categories cat ON c.category_id = cat.id
LEFT JOIN gf_budgets b ON 
  b.category_id = c.category_id 
  AND b.period_year = EXTRACT(YEAR FROM c.cost_date)
  AND b.period_month = EXTRACT(MONTH FROM c.cost_date)
  AND (b.company_id = c.company_id OR b.carrier_id = c.carrier_id)
WHERE c.status = 'confirmed'
GROUP BY 
  COALESCE(c.company_id, c.carrier_id),
  CASE WHEN c.company_id IS NOT NULL THEN 'empresa' ELSE 'transportadora' END,
  EXTRACT(YEAR FROM c.cost_date),
  EXTRACT(MONTH FROM c.cost_date),
  cat.name,
  c.category_id;

-- View: KPIs Financeiros Admin (consolidado)
CREATE OR REPLACE VIEW v_admin_financial_kpis AS
SELECT
  -- Totais globais
  (SELECT COALESCE(SUM(amount), 0) FROM gf_manual_costs_v2 WHERE status = 'confirmed' AND cost_date >= CURRENT_DATE - INTERVAL '30 days') as total_costs_30d,
  (SELECT COALESCE(SUM(amount), 0) FROM gf_manual_revenues WHERE status = 'confirmed' AND revenue_date >= CURRENT_DATE - INTERVAL '30 days') as total_revenues_30d,
  (SELECT COALESCE(SUM(amount), 0) FROM gf_manual_revenues WHERE status = 'confirmed' AND revenue_date >= CURRENT_DATE - INTERVAL '30 days') -
  (SELECT COALESCE(SUM(amount), 0) FROM gf_manual_costs_v2 WHERE status = 'confirmed' AND cost_date >= CURRENT_DATE - INTERVAL '30 days') as margin_30d,
  -- Contagens
  (SELECT COUNT(*) FROM gf_manual_costs_v2 WHERE status = 'confirmed' AND cost_date >= CURRENT_DATE - INTERVAL '30 days') as cost_entries_30d,
  (SELECT COUNT(*) FROM gf_manual_revenues WHERE status = 'confirmed' AND revenue_date >= CURRENT_DATE - INTERVAL '30 days') as revenue_entries_30d,
  -- Alertas pendentes
  (SELECT COUNT(*) FROM gf_financial_alerts WHERE is_dismissed = false AND severity = 'critical') as critical_alerts,
  (SELECT COUNT(*) FROM gf_financial_alerts WHERE is_dismissed = false AND severity = 'warning') as warning_alerts,
  -- Custos recorrentes próximos
  (SELECT COUNT(*) FROM gf_manual_costs_v2 WHERE is_recurring = true AND status = 'confirmed') as recurring_costs_count;

-- View: Custos por Veículo (Transportadora)
CREATE OR REPLACE VIEW v_vehicle_costs_summary AS
SELECT
  c.carrier_id,
  c.vehicle_id,
  v.plate as vehicle_plate,
  v.model as vehicle_model,
  EXTRACT(YEAR FROM c.cost_date)::INT as period_year,
  EXTRACT(MONTH FROM c.cost_date)::INT as period_month,
  SUM(c.amount) as total_cost,
  COUNT(*) as entries_count,
  ARRAY_AGG(DISTINCT cat.name) as categories
FROM gf_manual_costs_v2 c
JOIN vehicles v ON c.vehicle_id = v.id
LEFT JOIN gf_cost_categories cat ON c.category_id = cat.id
WHERE c.status = 'confirmed' AND c.vehicle_id IS NOT NULL
GROUP BY c.carrier_id, c.vehicle_id, v.plate, v.model, EXTRACT(YEAR FROM c.cost_date), EXTRACT(MONTH FROM c.cost_date);

-- ============================================================
-- 10. FUNÇÕES PARA AUTOMAÇÕES
-- ============================================================

-- Função: Gerar custos recorrentes
CREATE OR REPLACE FUNCTION generate_recurring_costs()
RETURNS INT AS $$
DECLARE
  generated_count INT := 0;
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT * FROM gf_manual_costs_v2 
    WHERE is_recurring = true 
    AND status = 'confirmed'
    AND (recurring_end_date IS NULL OR recurring_end_date >= CURRENT_DATE)
    AND parent_recurring_id IS NULL -- Apenas originais
  LOOP
    -- Verificar se já existe para o próximo período
    IF NOT EXISTS (
      SELECT 1 FROM gf_manual_costs_v2 
      WHERE parent_recurring_id = rec.id 
      AND cost_date = (
        CASE rec.recurring_interval
          WHEN 'daily' THEN rec.cost_date + INTERVAL '1 day'
          WHEN 'weekly' THEN rec.cost_date + INTERVAL '1 week'
          WHEN 'monthly' THEN rec.cost_date + INTERVAL '1 month'
          WHEN 'yearly' THEN rec.cost_date + INTERVAL '1 year'
        END
      )::DATE
    ) THEN
      -- Criar novo custo recorrente
      INSERT INTO gf_manual_costs_v2 (
        company_id, carrier_id, category_id, description, amount, cost_date,
        is_recurring, recurring_interval, recurring_end_date, parent_recurring_id,
        vehicle_id, route_id, status, created_by
      ) VALUES (
        rec.company_id, rec.carrier_id, rec.category_id, rec.description, rec.amount,
        (CASE rec.recurring_interval
          WHEN 'daily' THEN rec.cost_date + INTERVAL '1 day'
          WHEN 'weekly' THEN rec.cost_date + INTERVAL '1 week'
          WHEN 'monthly' THEN rec.cost_date + INTERVAL '1 month'
          WHEN 'yearly' THEN rec.cost_date + INTERVAL '1 year'
        END)::DATE,
        false, -- Gerado não é recorrente
        NULL, NULL, rec.id,
        rec.vehicle_id, rec.route_id, 'pending', rec.created_by
      );
      generated_count := generated_count + 1;
    END IF;
  END LOOP;
  
  RETURN generated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Verificar orçamentos excedidos
CREATE OR REPLACE FUNCTION check_budget_alerts()
RETURNS INT AS $$
DECLARE
  alerts_created INT := 0;
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT 
      b.*,
      COALESCE(SUM(c.amount), 0) as actual_spent,
      cat.name as category_name
    FROM gf_budgets b
    LEFT JOIN gf_manual_costs_v2 c ON 
      c.category_id = b.category_id 
      AND EXTRACT(YEAR FROM c.cost_date) = b.period_year
      AND EXTRACT(MONTH FROM c.cost_date) = b.period_month
      AND (c.company_id = b.company_id OR c.carrier_id = b.carrier_id)
      AND c.status = 'confirmed'
    LEFT JOIN gf_cost_categories cat ON b.category_id = cat.id
    WHERE b.period_year = EXTRACT(YEAR FROM CURRENT_DATE)
      AND b.period_month = EXTRACT(MONTH FROM CURRENT_DATE)
    GROUP BY b.id, cat.name
  LOOP
    -- Verificar se ultrapassou threshold
    IF rec.budgeted_amount > 0 AND (rec.actual_spent / rec.budgeted_amount * 100) >= rec.alert_threshold_percent THEN
      -- Verificar se já existe alerta similar não resolvido
      IF NOT EXISTS (
        SELECT 1 FROM gf_financial_alerts 
        WHERE budget_id = rec.id 
        AND is_dismissed = false
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      ) THEN
        INSERT INTO gf_financial_alerts (
          company_id, carrier_id, alert_type, severity, title, message,
          budget_id, category_id, threshold_value, actual_value, variance_percent
        ) VALUES (
          rec.company_id, rec.carrier_id, 'budget_exceeded',
          CASE WHEN (rec.actual_spent / rec.budgeted_amount * 100) >= 100 THEN 'critical' ELSE 'warning' END,
          'Orçamento ' || rec.category_name || ' atingido',
          'O orçamento de ' || rec.category_name || ' atingiu ' || 
          ROUND((rec.actual_spent / rec.budgeted_amount * 100)::numeric, 1) || '% do valor previsto.',
          rec.id, rec.category_id, rec.budgeted_amount, rec.actual_spent,
          ROUND(((rec.actual_spent - rec.budgeted_amount) / rec.budgeted_amount * 100)::numeric, 2)
        );
        alerts_created := alerts_created + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN alerts_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 11. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================

-- Trigger: Atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_costs_updated_at
  BEFORE UPDATE ON gf_manual_costs_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_revenues_updated_at
  BEFORE UPDATE ON gf_manual_revenues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON gf_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON gf_cost_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 12. MIGRAÇÃO DE DADOS EXISTENTES (se houver)
-- ============================================================

-- Comentado: Executar manualmente se necessário
-- INSERT INTO gf_manual_costs_v2 (company_id, description, amount, cost_date, created_by, created_at)
-- SELECT company_id, description, amount, cost_date, created_by, created_at
-- FROM costs WHERE ... ;

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
