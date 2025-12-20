-- ====================================================
-- GolfFox - Script de Validação RLS
-- Execute este script no Supabase SQL Editor
-- ====================================================

-- ====================================================
-- 1. VALIDAÇÃO DE EXTENSÕES
-- ====================================================
SELECT 
  '1. Extensões' as validacao,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ OK'
    ELSE '❌ FALTANDO: ' || (3 - COUNT(*))::text || ' extensões'
  END as status,
  STRING_AGG(extname, ', ' ORDER BY extname) as detalhes
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_cron');

-- ====================================================
-- 2. VALIDAÇÃO DE TABELAS CORE
-- ====================================================
SELECT 
  '2. Tabelas Core' as validacao,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ OK (' || COUNT(*)::text || ' tabelas)'
    ELSE '❌ FALTANDO: ' || (7 - COUNT(*))::text || ' tabelas'
  END as status,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as detalhes
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'companies', 'carriers', 'users', 'vehicles', 'routes', 
    'trips', 'driver_positions'
  );

-- ====================================================
-- 3. VALIDAÇÃO DE RLS HABILITADO
-- ====================================================
SELECT 
  '3. RLS Habilitado' as validacao,
  CASE 
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE rowsecurity = true) THEN '✅ OK'
    ELSE '❌ PROBLEMA: ' || COUNT(*) FILTER (WHERE rowsecurity = false)::text || ' tabelas sem RLS'
  END as status,
  STRING_AGG(
    CASE WHEN rowsecurity THEN tablename || ' ✅' ELSE tablename || ' ❌' END, 
    ', ' 
    ORDER BY tablename
  ) as detalhes
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'routes', 'trips', 'vehicles', 'driver_positions', 'companies', 'gf_costs')
ORDER BY tablename;

-- ====================================================
-- 4. VALIDAÇÃO DE POLÍTICAS RLS POR TABELA
-- ====================================================
SELECT 
  '4. Políticas RLS' as validacao,
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policies,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ OK'
    ELSE '⚠️ POUCAS POLÍTICAS'
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'routes', 'trips', 'vehicles', 'driver_positions', 'companies', 'gf_costs')
GROUP BY tablename
ORDER BY tablename;

-- ====================================================
-- 5. VALIDAÇÃO DE POLÍTICAS ESPECÍFICAS CRÍTICAS
-- ====================================================

-- 5.1 motorista Positions (deve ter políticas para insert e read)
SELECT 
  '5.1 motorista Positions Policies' as validacao,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ OK (' || COUNT(*)::text || ' políticas)'
    ELSE '❌ FALTANDO: Mínimo 2 políticas necessárias'
  END as status,
  STRING_AGG(policyname || ' (' || cmd || ')', ', ' ORDER BY policyname) as detalhes
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'driver_positions';

-- 5.2 Trips (deve ter políticas para diferentes roles)
SELECT 
  '5.2 Trips Policies' as validacao,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ OK (' || COUNT(*)::text || ' políticas)'
    ELSE '❌ FALTANDO: Mínimo 2 políticas necessárias'
  END as status,
  STRING_AGG(policyname || ' (' || cmd || ')', ', ' ORDER BY policyname) as detalhes
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'trips';

-- 5.3 Users (deve ter políticas para self-read e service_role)
SELECT 
  '5.3 Users Policies' as validacao,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ OK (' || COUNT(*)::text || ' políticas)'
    ELSE '❌ FALTANDO: Mínimo 2 políticas necessárias'
  END as status,
  STRING_AGG(policyname || ' (' || cmd || ')', ', ' ORDER BY policyname) as detalhes
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'users';

-- ====================================================
-- 6. VALIDAÇÃO DE HELPER FUNCTIONS
-- ====================================================
SELECT 
  '6. Helper Functions' as validacao,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ OK (' || COUNT(*)::text || ' funções)'
    ELSE '⚠️ FALTANDO: ' || (4 - COUNT(*))::text || ' funções'
  END as status,
  STRING_AGG(routine_name, ', ' ORDER BY routine_name) as detalhes
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'current_role', 'current_company_id', 'current_carrier_id');

-- ====================================================
-- 7. VALIDAÇÃO DE GRANTS
-- ====================================================
SELECT 
  '7. Grants (Users table)' as validacao,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ OK'
    ELSE '⚠️ VERIFICAR GRANTS'
  END as status,
  STRING_AGG(grantee || ' (' || privilege_type || ')', ', ' ORDER BY grantee) as detalhes
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND grantee IN ('anon', 'authenticated', 'service_role');

-- ====================================================
-- 8. RESUMO DE PROBLEMAS ENCONTRADOS
-- ====================================================
SELECT 
  '8. RESUMO' as validacao,
  CASE 
    WHEN (
      (SELECT COUNT(*) FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_cron')) = 3
      AND (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'routes', 'trips', 'vehicles', 'driver_positions', 'companies', 'gf_costs')) >= 7
      AND (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true AND tablename IN ('users', 'routes', 'trips', 'vehicles', 'driver_positions', 'companies', 'gf_costs')) >= 7
      AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'routes', 'trips', 'vehicles', 'driver_positions', 'companies', 'gf_costs')) >= 14
    ) THEN '✅ TODAS AS VALIDAÇÕES PASSARAM'
    ELSE '⚠️ ALGUMAS VALIDAÇÕES FALHARAM - VER DETALHES ACIMA'
  END as status,
  '' as detalhes;

