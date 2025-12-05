-- ====================================================
-- GolfFox Transport Management System
-- Create gf_user_company_map Table
-- Date: 2025-01-XX
-- ====================================================
-- This migration creates the gf_user_company_map table used for
-- mapping operators to companies (multi-tenant support)
-- The table is referenced in multiple API routes

-- ====================================================
-- PART 1: CREATE TABLE
-- ====================================================

CREATE TABLE IF NOT EXISTS public.gf_user_company_map (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, company_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gf_user_company_map_user_id ON public.gf_user_company_map(user_id);
CREATE INDEX IF NOT EXISTS idx_gf_user_company_map_company_id ON public.gf_user_company_map(company_id);

-- ====================================================
-- PART 2: ENABLE RLS
-- ====================================================

ALTER TABLE public.gf_user_company_map ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "service_role_full_access_gf_user_company_map"
  ON public.gf_user_company_map
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "admin_full_access_gf_user_company_map"
  ON public.gf_user_company_map
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "operator_read_own_mappings"
  ON public.gf_user_company_map
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'operator' AND
    user_id = auth.uid()
  );

CREATE POLICY "authenticated_read_own_mappings"
  ON public.gf_user_company_map
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ====================================================
-- PART 3: TRIGGER FOR UPDATED_AT
-- ====================================================

DROP TRIGGER IF EXISTS update_gf_user_company_map_updated_at ON public.gf_user_company_map;

CREATE TRIGGER update_gf_user_company_map_updated_at
  BEFORE UPDATE ON public.gf_user_company_map
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- PART 4: COMMENTS FOR DOCUMENTATION
-- ====================================================

COMMENT ON TABLE public.gf_user_company_map IS 'Mapeamento de usuários (operadores) para empresas (multi-tenant)';
COMMENT ON COLUMN public.gf_user_company_map.user_id IS 'ID do usuário (operador)';
COMMENT ON COLUMN public.gf_user_company_map.company_id IS 'ID da empresa associada';

-- ====================================================
-- END OF MIGRATION
-- ====================================================

