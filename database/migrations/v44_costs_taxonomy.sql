-- ============================================
-- GolfFox v44.0 - Sistema Completo de Custos
-- Taxonomia e Tabelas Base
-- ============================================

-- 1. Categorias de Custos
-- ============================================
CREATE TABLE IF NOT EXISTS public.gf_cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL CHECK (group_name IN (
    'operacionais',
    'pessoal_operacional',
    'contratuais',
    'administrativos',
    'tributarios',
    'financeiros',
    'eventos'
  )),
  category TEXT NOT NULL,
  subcategory TEXT,
  unit TEXT, -- 'litro', 'km', 'hora', 'mes', 'unidade', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_name, category, subcategory)
);

CREATE INDEX IF NOT EXISTS idx_gf_cost_categories_group ON public.gf_cost_categories(group_name);
CREATE INDEX IF NOT EXISTS idx_gf_cost_categories_active ON public.gf_cost_categories(is_active);

COMMENT ON TABLE public.gf_cost_categories IS 'Categorização completa de custos em 7 grupos principais';
COMMENT ON COLUMN public.gf_cost_categories.group_name IS 'Grupo principal: operacionais, pessoal_operacional, contratuais, administrativos, tributarios, financeiros, eventos';

-- 2. Tabela Fato de Custos
-- ============================================
CREATE TABLE IF NOT EXISTS public.gf_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  cost_category_id UUID NOT NULL REFERENCES public.gf_cost_categories(id) ON DELETE RESTRICT,
  cost_center_id UUID REFERENCES public.gf_cost_centers(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  qty NUMERIC(10, 3), -- Quantidade (litros, km, horas, etc.)
  unit TEXT, -- Unidade de medida
  currency TEXT DEFAULT 'BRL',
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'invoice', 'calc')),
  invoice_id UUID REFERENCES public.gf_invoices(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_costs_company_date ON public.gf_costs(company_id, date);
CREATE INDEX IF NOT EXISTS idx_gf_costs_category ON public.gf_costs(cost_category_id);
CREATE INDEX IF NOT EXISTS idx_gf_costs_route ON public.gf_costs(route_id);
CREATE INDEX IF NOT EXISTS idx_gf_costs_vehicle ON public.gf_costs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gf_costs_driver ON public.gf_costs(driver_id);
CREATE INDEX IF NOT EXISTS idx_gf_costs_carrier ON public.gf_costs(carrier_id);
CREATE INDEX IF NOT EXISTS idx_gf_costs_cost_center ON public.gf_costs(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_gf_costs_source ON public.gf_costs(source);
CREATE INDEX IF NOT EXISTS idx_gf_costs_invoice ON public.gf_costs(invoice_id);

COMMENT ON TABLE public.gf_costs IS 'Tabela fato de custos com todas as dimensões (empresa, transportadora, rota, veículo, motorista, categoria)';
COMMENT ON COLUMN public.gf_costs.source IS 'Origem do custo: manual (digitado), import (CSV/Excel), invoice (da fatura), calc (calculado)';

-- 3. Orçamentos
-- ============================================
CREATE TABLE IF NOT EXISTS public.gf_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  period_year INTEGER NOT NULL CHECK (period_year >= 2020),
  category_id UUID REFERENCES public.gf_cost_categories(id) ON DELETE SET NULL,
  amount_budgeted NUMERIC(12, 2) NOT NULL CHECK (amount_budgeted >= 0),
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, period_month, period_year, category_id)
);

CREATE INDEX IF NOT EXISTS idx_gf_budgets_company_period ON public.gf_budgets(company_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_gf_budgets_category ON public.gf_budgets(category_id);

COMMENT ON TABLE public.gf_budgets IS 'Orçamentos por empresa, período (mês/ano) e categoria opcional';

-- 4. Triggers para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gf_cost_categories_updated_at
  BEFORE UPDATE ON public.gf_cost_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gf_costs_updated_at
  BEFORE UPDATE ON public.gf_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gf_budgets_updated_at
  BEFORE UPDATE ON public.gf_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

