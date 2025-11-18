-- Fix: Remover ambiguidade da função gf_map_snapshot_full
-- Existem duas versões da função, vamos manter apenas a versão com carrier_id

-- Primeiro, vamos verificar quais versões existem
-- SELECT proname, pg_get_function_arguments(oid) 
-- FROM pg_proc 
-- WHERE proname = 'gf_map_snapshot_full';

-- Remover a versão antiga (2 parâmetros) se existir
DROP FUNCTION IF EXISTS public.gf_map_snapshot_full(UUID, UUID);

-- Manter apenas a versão com carrier_id (3 parâmetros)
-- Se a versão com 3 parâmetros não existir, criar baseada na versão mais completa

-- Nota: Este script deve ser executado manualmente no Supabase SQL Editor
-- após verificar qual versão está sendo usada no código

