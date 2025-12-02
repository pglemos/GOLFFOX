-- ============================================
-- GolfFox v44.0 - RLS Policies para Custos
-- ============================================

-- 1. GF_COST_CATEGORIES
-- ============================================
ALTER TABLE IF EXISTS public.gf_cost_categories ENABLE ROW LEVEL SECURITY;

-- Todos podem ler categorias ativas
DROP POLICY IF EXISTS public_select_cost_categories ON public.gf_cost_categories;
CREATE POLICY public_select_cost_categories ON public.gf_cost_categories
  FOR SELECT
  USING (is_active = true);

-- Apenas admins podem modificar categorias
DROP POLICY IF EXISTS admin_modify_cost_categories ON public.gf_cost_categories;
CREATE POLICY admin_modify_cost_categories ON public.gf_cost_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- 2. GF_COSTS
-- ============================================
ALTER TABLE IF EXISTS public.gf_costs ENABLE ROW LEVEL SECURITY;

-- Operadores e Admins podem ver custos de suas empresas
DROP POLICY IF EXISTS operator_select_costs ON public.gf_costs;
CREATE POLICY operator_select_costs ON public.gf_costs
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.gf_user_company_map
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Operadores e Admins podem inserir custos em suas empresas
DROP POLICY IF EXISTS operator_insert_costs ON public.gf_costs;
CREATE POLICY operator_insert_costs ON public.gf_costs
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.gf_user_company_map
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Operadores e Admins podem atualizar custos de suas empresas
DROP POLICY IF EXISTS operator_update_costs ON public.gf_costs;
CREATE POLICY operator_update_costs ON public.gf_costs
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.gf_user_company_map
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Operadores e Admins podem deletar custos de suas empresas
DROP POLICY IF EXISTS operator_delete_costs ON public.gf_costs;
CREATE POLICY operator_delete_costs ON public.gf_costs
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.gf_user_company_map
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- 3. GF_BUDGETS
-- ============================================
ALTER TABLE IF EXISTS public.gf_budgets ENABLE ROW LEVEL SECURITY;

-- Operadores e Admins podem ver orçamentos de suas empresas
DROP POLICY IF EXISTS operator_select_budgets ON public.gf_budgets;
CREATE POLICY operator_select_budgets ON public.gf_budgets
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.gf_user_company_map
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Operadores e Admins podem inserir orçamentos em suas empresas
DROP POLICY IF EXISTS operator_insert_budgets ON public.gf_budgets;
CREATE POLICY operator_insert_budgets ON public.gf_budgets
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.gf_user_company_map
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Operadores e Admins podem atualizar orçamentos de suas empresas
DROP POLICY IF EXISTS operator_update_budgets ON public.gf_budgets;
CREATE POLICY operator_update_budgets ON public.gf_budgets
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.gf_user_company_map
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Operadores e Admins podem deletar orçamentos de suas empresas
DROP POLICY IF EXISTS operator_delete_budgets ON public.gf_budgets;
CREATE POLICY operator_delete_budgets ON public.gf_budgets
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.gf_user_company_map
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

COMMENT ON POLICY operator_select_costs ON public.gf_costs IS 'RLS: Operadores veem apenas custos de suas empresas via gf_user_company_map';
COMMENT ON POLICY operator_select_budgets ON public.gf_budgets IS 'RLS: Operadores veem apenas orçamentos de suas empresas via gf_user_company_map';

