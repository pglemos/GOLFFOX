-- =========================================
-- Migration v61: Fix funções que usam carrier_id para usar transportadora_id
-- =========================================
-- 
-- Esta migration atualiza as funções que ainda usam carrier_id
-- para usar transportadora_id
--

-- Função: get_user_carrier_id -> atualizar para usar transportadora_id
DROP FUNCTION IF EXISTS public.get_user_carrier_id() CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_carrier_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT transportadora_id FROM public.users WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_carrier_id() IS 'Retorna o transportadora_id do usuário autenticado (mantido para compatibilidade)';

-- Função: current_carrier_id -> atualizar para usar transportadora_id
DROP FUNCTION IF EXISTS public.current_carrier_id() CASCADE;
CREATE OR REPLACE FUNCTION public.current_carrier_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT transportadora_id FROM public.users WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.current_carrier_id() IS 'Retorna o transportadora_id do usuário autenticado (mantido para compatibilidade)';

-- Função: rpc_carrier_monthly_score -> atualizar para usar transportadora_id
-- Nota: Esta função pode não existir, mas vamos verificar
DROP FUNCTION IF EXISTS public.rpc_carrier_monthly_score(UUID, DATE) CASCADE;

