-- Migration: v49_protect_user_company_map
-- Data: 2025-01-07
-- Descrição: Adicionar RLS em gf_user_company_map para prevenir auto-adição de usuários a empresas
-- Severidade: ALTA - Risco de escalação de privilégios

-- ============================================
-- GF_USER_COMPANY_MAP - RLS Protection
-- ============================================
ALTER TABLE IF EXISTS public.gf_user_company_map ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuário vê apenas seus próprios mapeamentos
DROP POLICY IF EXISTS user_select_own_companies ON public.gf_user_company_map;
CREATE POLICY user_select_own_companies ON public.gf_user_company_map
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE: Apenas admin pode modificar
DROP POLICY IF EXISTS admin_manage_user_companies ON public.gf_user_company_map;
CREATE POLICY admin_manage_user_companies ON public.gf_user_company_map
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY user_select_own_companies ON public.gf_user_company_map IS 
  'RLS: Usuário pode ver apenas seus próprios mapeamentos empresa-usuário';

COMMENT ON POLICY admin_manage_user_companies ON public.gf_user_company_map IS 
  'RLS: Apenas admin pode modificar user-company mappings para prevenir escalation de privilégios';

-- Garantir que a tabela existe e tem estrutura correta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_user_company_map'
  ) THEN
    RAISE EXCEPTION 'Tabela gf_user_company_map não existe. Execute migrations v43 primeiro.';
  END IF;
END $$;

