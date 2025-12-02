-- ========================================
-- Fix Completo: Ambiguidade gf_map_snapshot_full
-- ========================================
-- 
-- PROBLEMA: Existem 2 versões da função com parâmetros diferentes
-- SOLUÇÃO: Manter apenas a versão com p_carrier_id (mais completa)
--
-- Execute este script no Supabase SQL Editor
-- ========================================

-- 1. Verificar quais versões existem
SELECT 
  proname,
  pg_get_function_arguments(oid) as arguments,
  oid
FROM pg_proc 
WHERE proname = 'gf_map_snapshot_full'
ORDER BY proname, oid;

-- 2. Remover a versão antiga (2 parâmetros: p_company_id, p_route_id)
-- Esta versão não tem p_carrier_id, então vamos removê-la
DROP FUNCTION IF EXISTS public.gf_map_snapshot_full(
  p_company_id UUID,
  p_route_id UUID
);

-- 3. Verificar se a versão com 3 parâmetros existe
-- Se não existir, vamos criar baseada na versão mais completa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'gf_map_snapshot_full' 
    AND pg_get_function_arguments(oid) LIKE '%p_carrier_id%'
  ) THEN
    -- Criar versão com 3 parâmetros baseada na migração gf_rpc_map_snapshot.sql
    -- (A implementação completa está em database/migrations/gf_rpc_map_snapshot.sql)
    RAISE NOTICE 'Versão com p_carrier_id não encontrada. Execute a migração gf_rpc_map_snapshot.sql primeiro.';
  ELSE
    RAISE NOTICE 'Versão com p_carrier_id já existe.';
  END IF;
END $$;

-- 4. Verificar resultado final
SELECT 
  proname,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'gf_map_snapshot_full'
ORDER BY proname, oid;

-- 5. Testar a função (deve funcionar agora sem ambiguidade)
-- SELECT public.gf_map_snapshot_full(NULL, NULL, NULL);

COMMENT ON FUNCTION public.gf_map_snapshot_full IS 
  'Retorna snapshot completo do mapa. Use: gf_map_snapshot_full(p_company_id, p_carrier_id, p_route_id). Passe NULL para parâmetros não utilizados.';

