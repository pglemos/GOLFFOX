/**
 * Script para executar migration do sistema financeiro no Supabase
 * Usa conexão direta ao PostgreSQL via módulo 'pg'
 */

const { Pool } = require('pg');

// Conexão direta ao Supabase PostgreSQL
const pool = new Pool({
    host: 'db.vmoxzesvjcfmrebagcwo.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Guigui1309@',
    ssl: { rejectUnauthorized: false }
});

async function execSQL(sql, description) {
    console.log(`\n📌 ${description}...`);
    try {
        await pool.query(sql);
        console.log(`✅ Sucesso!`);
        return true;
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        return false;
    }
}

async function runMigration() {
    console.log('🚀 Iniciando migration do Sistema Financeiro Golf Fox\n');
    console.log('====================================================\n');

    // 1. Limpar estrutura anterior
    await execSQL(`
    DROP VIEW IF EXISTS v_costs_vs_budget_monthly CASCADE;
    DROP VIEW IF EXISTS v_admin_financial_kpis CASCADE;
    DROP VIEW IF EXISTS v_vehicle_costs_summary CASCADE;
    DROP FUNCTION IF EXISTS generate_recurring_costs() CASCADE;
    DROP FUNCTION IF EXISTS check_budget_alerts() CASCADE;
    DROP TABLE IF EXISTS gf_financial_alerts CASCADE;
    DROP TABLE IF EXISTS gf_financial_forecasts CASCADE;
    DROP TABLE IF EXISTS gf_budgets CASCADE;
    DROP TABLE IF EXISTS gf_manual_revenues CASCADE;
    DROP TABLE IF EXISTS gf_manual_costs_v2 CASCADE;
    DROP TABLE IF EXISTS gf_cost_categories CASCADE;
  `, 'Limpando estrutura anterior');

    // 2. Criar tabela de categorias
    await execSQL(`
    CREATE TABLE gf_cost_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      profile_type VARCHAR(20) NOT NULL CHECK (profile_type IN ('admin', 'empresa', 'transportadora', 'all')),
      parent_id UUID REFERENCES gf_cost_categories(id) ON DELETE SET NULL,
      icon VARCHAR(50),
      color VARCHAR(7),
      keywords TEXT[] DEFAULT '{}',
      is_operational BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      display_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_cost_categories_profile ON gf_cost_categories(profile_type);
    CREATE INDEX idx_cost_categories_parent ON gf_cost_categories(parent_id);
  `, 'Criando tabela gf_cost_categories');

    // 3. Criar tabela de custos manuais v2
    await execSQL(`
    CREATE TABLE gf_manual_costs_v2 (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
      category_id UUID REFERENCES gf_cost_categories(id),
      description TEXT NOT NULL,
      amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
      cost_date DATE NOT NULL,
      is_recurring BOOLEAN DEFAULT false,
      recurring_interval VARCHAR(20) CHECK (recurring_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
      recurring_end_date DATE,
      parent_recurring_id UUID,
      vehicle_id UUID,
      route_id UUID,
      driver_id UUID,
      attachment_url TEXT,
      attachment_name VARCHAR(255),
      notes TEXT,
      status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
      created_by UUID,
      approved_by UUID,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_manual_costs_v2_company ON gf_manual_costs_v2(company_id);
    CREATE INDEX idx_manual_costs_v2_carrier ON gf_manual_costs_v2(carrier_id);
    CREATE INDEX idx_manual_costs_v2_date ON gf_manual_costs_v2(cost_date);
    CREATE INDEX idx_manual_costs_v2_category ON gf_manual_costs_v2(category_id);
  `, 'Criando tabela gf_manual_costs_v2');

    // 4. Criar tabela de receitas
    await execSQL(`
    CREATE TABLE gf_manual_revenues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
      category VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
      revenue_date DATE NOT NULL,
      contract_reference VARCHAR(100),
      invoice_number VARCHAR(50),
      is_recurring BOOLEAN DEFAULT false,
      recurring_interval VARCHAR(20) CHECK (recurring_interval IN ('monthly', 'yearly')),
      attachment_url TEXT,
      notes TEXT,
      status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_revenues_company ON gf_manual_revenues(company_id);
    CREATE INDEX idx_revenues_carrier ON gf_manual_revenues(carrier_id);
    CREATE INDEX idx_revenues_date ON gf_manual_revenues(revenue_date);
  `, 'Criando tabela gf_manual_revenues');

    // 5. Criar tabela de orçamentos
    await execSQL(`
    CREATE TABLE gf_budgets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
      category_id UUID REFERENCES gf_cost_categories(id),
      category_name VARCHAR(100),
      period_year INT NOT NULL CHECK (period_year >= 2020 AND period_year <= 2100),
      period_month INT NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
      budgeted_amount DECIMAL(15,2) NOT NULL CHECK (budgeted_amount >= 0),
      alert_threshold_percent INT DEFAULT 80,
      notes TEXT,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_budgets_company ON gf_budgets(company_id);
    CREATE INDEX idx_budgets_carrier ON gf_budgets(carrier_id);
    CREATE INDEX idx_budgets_period ON gf_budgets(period_year, period_month);
  `, 'Criando tabela gf_budgets');

    // 6. Criar tabela de projeções
    await execSQL(`
    CREATE TABLE gf_financial_forecasts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
      forecast_type VARCHAR(20) NOT NULL CHECK (forecast_type IN ('cost', 'revenue')),
      category_id UUID REFERENCES gf_cost_categories(id),
      period_year INT NOT NULL,
      period_month INT NOT NULL,
      projected_amount DECIMAL(15,2) NOT NULL,
      actual_amount DECIMAL(15,2),
      confidence_level DECIMAL(3,2) DEFAULT 0.80,
      calculation_method VARCHAR(50) DEFAULT 'moving_average',
      base_period_months INT DEFAULT 3,
      generated_at TIMESTAMPTZ DEFAULT NOW(),
      notes TEXT
    );
    CREATE INDEX idx_forecasts_company ON gf_financial_forecasts(company_id);
    CREATE INDEX idx_forecasts_carrier ON gf_financial_forecasts(carrier_id);
    CREATE INDEX idx_forecasts_period ON gf_financial_forecasts(period_year, period_month);
  `, 'Criando tabela gf_financial_forecasts');

    // 7. Criar tabela de alertas
    await execSQL(`
    CREATE TABLE gf_financial_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
      alert_type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      cost_id UUID REFERENCES gf_manual_costs_v2(id) ON DELETE SET NULL,
      budget_id UUID REFERENCES gf_budgets(id) ON DELETE SET NULL,
      category_id UUID REFERENCES gf_cost_categories(id),
      threshold_value DECIMAL(15,2),
      actual_value DECIMAL(15,2),
      variance_percent DECIMAL(5,2),
      is_read BOOLEAN DEFAULT false,
      is_dismissed BOOLEAN DEFAULT false,
      dismissed_by UUID,
      dismissed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_fin_alerts_company ON gf_financial_alerts(company_id);
    CREATE INDEX idx_fin_alerts_carrier ON gf_financial_alerts(carrier_id);
  `, 'Criando tabela gf_financial_alerts');

    // 8. Habilitar RLS
    await execSQL(`
    ALTER TABLE gf_cost_categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE gf_manual_costs_v2 ENABLE ROW LEVEL SECURITY;
    ALTER TABLE gf_manual_revenues ENABLE ROW LEVEL SECURITY;
    ALTER TABLE gf_budgets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE gf_financial_forecasts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE gf_financial_alerts ENABLE ROW LEVEL SECURITY;
  `, 'Habilitando Row Level Security');

    // 9. Criar políticas RLS
    await execSQL(`
    CREATE POLICY "categories_read_all" ON gf_cost_categories FOR SELECT USING (true);
    CREATE POLICY "categories_admin_write" ON gf_cost_categories FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
  `, 'Criando políticas RLS para categorias');

    await execSQL(`
    CREATE POLICY "costs_admin_full" ON gf_manual_costs_v2 FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "costs_empresa_access" ON gf_manual_costs_v2 FOR ALL USING (
      company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );
    CREATE POLICY "costs_transportadora_access" ON gf_manual_costs_v2 FOR ALL USING (
      carrier_id IN (SELECT carrier_id FROM profiles WHERE id = auth.uid())
    );
  `, 'Criando políticas RLS para custos');

    await execSQL(`
    CREATE POLICY "revenues_admin_full" ON gf_manual_revenues FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "revenues_empresa_access" ON gf_manual_revenues FOR ALL USING (
      company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );
    CREATE POLICY "revenues_transportadora_access" ON gf_manual_revenues FOR ALL USING (
      carrier_id IN (SELECT carrier_id FROM profiles WHERE id = auth.uid())
    );
  `, 'Criando políticas RLS para receitas');

    await execSQL(`
    CREATE POLICY "budgets_admin_full" ON gf_budgets FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "budgets_tenant_access" ON gf_budgets FOR ALL USING (
      company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
      OR carrier_id IN (SELECT carrier_id FROM profiles WHERE id = auth.uid())
    );
  `, 'Criando políticas RLS para orçamentos');

    await execSQL(`
    CREATE POLICY "forecasts_admin_full" ON gf_financial_forecasts FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "forecasts_tenant_access" ON gf_financial_forecasts FOR ALL USING (
      company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
      OR carrier_id IN (SELECT carrier_id FROM profiles WHERE id = auth.uid())
    );
  `, 'Criando políticas RLS para projeções');

    await execSQL(`
    CREATE POLICY "alerts_admin_full" ON gf_financial_alerts FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "alerts_tenant_access" ON gf_financial_alerts FOR ALL USING (
      company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
      OR carrier_id IN (SELECT carrier_id FROM profiles WHERE id = auth.uid())
    );
  `, 'Criando políticas RLS para alertas');

    // 10. Inserir categorias iniciais
    await execSQL(`
    INSERT INTO gf_cost_categories (name, profile_type, icon, color, keywords, is_operational, display_order) VALUES
      ('Folha de Pagamento', 'admin', 'users', '#2563EB', ARRAY['salário', 'funcionários', 'rh'], false, 1),
      ('Benefícios', 'admin', 'gift', '#7C3AED', ARRAY['vale', 'alimentação', 'transporte'], false, 2),
      ('Tecnologia', 'admin', 'monitor', '#0891B2', ARRAY['ti', 'software', 'sistema'], false, 3),
      ('Marketing', 'admin', 'megaphone', '#EA580C', ARRAY['propaganda', 'publicidade'], false, 4),
      ('Infraestrutura', 'admin', 'building', '#64748B', ARRAY['aluguel', 'escritório', 'luz'], false, 5),
      ('Faturamento Golf Fox', 'empresa', 'file-text', '#F97316', ARRAY['fatura', 'mensalidade', 'contrato'], false, 1),
      ('Gestão Interna', 'empresa', 'briefcase', '#2563EB', ARRAY['rh', 'administração'], false, 2),
      ('Combustível', 'transportadora', 'fuel', '#F97316', ARRAY['diesel', 'gasolina', 'abastecimento'], true, 1),
      ('Manutenção Preventiva', 'transportadora', 'wrench', '#2563EB', ARRAY['revisão', 'troca de óleo'], true, 2),
      ('Manutenção Corretiva', 'transportadora', 'tool', '#DC2626', ARRAY['reparo', 'conserto', 'peça'], true, 3),
      ('Pneus', 'transportadora', 'circle', '#1E293B', ARRAY['pneu', 'calibragem'], true, 4),
      ('Pedágios', 'transportadora', 'credit-card', '#64748B', ARRAY['pedágio', 'sem parar'], true, 5),
      ('Salários Motoristas', 'transportadora', 'users', '#059669', ARRAY['salário', 'motorista'], false, 6),
      ('Seguros Veículos', 'transportadora', 'shield', '#7C3AED', ARRAY['seguro', 'apólice'], true, 7),
      ('Licenciamento', 'transportadora', 'file-badge', '#0891B2', ARRAY['licenciamento', 'ipva'], true, 8),
      ('Multas', 'transportadora', 'alert-circle', '#DC2626', ARRAY['multa', 'infração'], true, 9),
      ('Outros', 'all', 'more-horizontal', '#94A3B8', ARRAY['outro', 'diversos'], false, 99);
  `, 'Inserindo categorias iniciais');

    // 11. Criar views
    await execSQL(`
    CREATE OR REPLACE VIEW v_admin_financial_kpis AS
    SELECT
      (SELECT COALESCE(SUM(amount), 0) FROM gf_manual_costs_v2 WHERE status = 'confirmed' AND cost_date >= CURRENT_DATE - INTERVAL '30 days') as total_costs_30d,
      (SELECT COALESCE(SUM(amount), 0) FROM gf_manual_revenues WHERE status = 'confirmed' AND revenue_date >= CURRENT_DATE - INTERVAL '30 days') as total_revenues_30d,
      (SELECT COUNT(*) FROM gf_manual_costs_v2 WHERE status = 'confirmed' AND cost_date >= CURRENT_DATE - INTERVAL '30 days') as cost_entries_30d,
      (SELECT COUNT(*) FROM gf_manual_revenues WHERE status = 'confirmed' AND revenue_date >= CURRENT_DATE - INTERVAL '30 days') as revenue_entries_30d,
      (SELECT COUNT(*) FROM gf_financial_alerts WHERE is_dismissed = false AND severity = 'critical') as critical_alerts,
      (SELECT COUNT(*) FROM gf_financial_alerts WHERE is_dismissed = false AND severity = 'warning') as warning_alerts,
      (SELECT COUNT(*) FROM gf_manual_costs_v2 WHERE is_recurring = true AND status = 'confirmed') as recurring_costs_count;
  `, 'Criando view v_admin_financial_kpis');

    // 12. Criar função de trigger para updated_at
    await execSQL(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_costs_updated_at BEFORE UPDATE ON gf_manual_costs_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE TRIGGER trg_revenues_updated_at BEFORE UPDATE ON gf_manual_revenues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON gf_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON gf_cost_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `, 'Criando triggers para updated_at');

    console.log('\n====================================================');
    console.log('✅ MIGRATION CONCLUÍDA COM SUCESSO!');
    console.log('====================================================');

    // Verificar tabelas criadas
    const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'gf_%'
    ORDER BY table_name;
  `);

    console.log('\n📊 Tabelas criadas:');
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));

    await pool.end();
}

runMigration().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
