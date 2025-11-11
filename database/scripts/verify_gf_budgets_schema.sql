-- Script de verificação e criação da tabela gf_budgets e gf_cost_categories
-- Executa apenas se as tabelas não existirem

-- Verificar e criar gf_cost_categories
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_cost_categories'
  ) THEN
    CREATE TABLE public.gf_cost_categories (
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
      unit TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(group_name, category, subcategory)
    );

    CREATE INDEX IF NOT EXISTS idx_gf_cost_categories_group ON public.gf_cost_categories(group_name);
    CREATE INDEX IF NOT EXISTS idx_gf_cost_categories_active ON public.gf_cost_categories(is_active);

    COMMENT ON TABLE public.gf_cost_categories IS 'Categorização completa de custos em 7 grupos principais';
  END IF;
END $$;

-- Verificar e criar gf_budgets
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_budgets'
  ) THEN
    CREATE TABLE public.gf_budgets (
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
  END IF;
END $$;

-- Verificar se função update_updated_at_column existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Criar triggers se não existirem
DROP TRIGGER IF EXISTS update_gf_cost_categories_updated_at ON public.gf_cost_categories;
CREATE TRIGGER update_gf_cost_categories_updated_at
  BEFORE UPDATE ON public.gf_cost_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gf_budgets_updated_at ON public.gf_budgets;
CREATE TRIGGER update_gf_budgets_updated_at
  BEFORE UPDATE ON public.gf_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verificar se tabelas foram criadas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_cost_categories'
  ) THEN
    RAISE EXCEPTION 'Tabela gf_cost_categories não foi criada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_budgets'
  ) THEN
    RAISE EXCEPTION 'Tabela gf_budgets não foi criada';
  END IF;
END $$;

-- Forçar reload do schema cache do Supabase (PostgREST)
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Analisar tabelas para atualizar estatísticas
ANALYZE public.gf_cost_categories;
ANALYZE public.gf_budgets;

SELECT 'Tabelas gf_cost_categories e gf_budgets verificadas/criadas com sucesso' AS status;

