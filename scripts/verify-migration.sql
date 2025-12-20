-- ============================================================
-- Script de Verificação de Migrations
-- 
-- Execute este script no Supabase SQL Editor para verificar
-- se todas as migrations foram aplicadas corretamente
-- ============================================================

-- 1. Verificar tabelas principais
SELECT 
  'Tabelas Principais' as categoria,
  table_name,
  CASE 
    WHEN table_name IN (
      'users', 'companies', 'vehicles', 'routes', 'trips',
      'drivers', 'carriers', 'gf_costs', 'gf_budgets'
    ) THEN '✅'
    ELSE '⚠️'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'users', 'companies', 'vehicles', 'routes', 'trips',
    'drivers', 'carriers', 'gf_costs', 'gf_budgets'
  )
ORDER BY table_name;

-- 2. Verificar tabelas de sistema (gf_*)
SELECT 
  'Tabelas de Sistema' as categoria,
  table_name,
  '✅' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name LIKE 'gf_%'
ORDER BY table_name;

-- 3. Verificar tabelas mobile
SELECT 
  'Tabelas Mobile' as categoria,
  table_name,
  '✅' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'passageiro_checkins', 'veiculo_checklists', 'motorista_locations',
    'motorista_messages', 'passageiro_cancellations', 'trip_evaluations',
    'announcements', 'motorista_positions', 'gf_veiculo_checklists'
  )
ORDER BY table_name;

-- 4. Verificar tabelas de monitoramento
SELECT 
  'Tabelas de Monitoramento' as categoria,
  table_name,
  '✅' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'gf_web_vitals', 'gf_operational_alerts', 'gf_audit_log', 'gf_event_store'
  )
ORDER BY table_name;

-- 5. Verificar índices importantes
SELECT 
  'Índices' as categoria,
  indexname as nome,
  tablename as tabela,
  '✅' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname
LIMIT 20;

-- 6. Verificar RLS habilitado
SELECT 
  'RLS' as categoria,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Habilitado'
    ELSE '❌ Desabilitado'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'gf_%'
ORDER BY tablename;

-- 7. Contar registros em tabelas importantes
SELECT 
  'Contagem' as categoria,
  'users' as tabela,
  COUNT(*)::text as registros
FROM users
UNION ALL
SELECT 'Contagem', 'companies', COUNT(*)::text FROM companies
UNION ALL
SELECT 'Contagem', 'vehicles', COUNT(*)::text FROM vehicles
UNION ALL
SELECT 'Contagem', 'routes', COUNT(*)::text FROM routes
UNION ALL
SELECT 'Contagem', 'trips', COUNT(*)::text FROM trips
UNION ALL
SELECT 'Contagem', 'gf_costs', COUNT(*)::text FROM gf_costs
UNION ALL
SELECT 'Contagem', 'gf_audit_log', COUNT(*)::text FROM gf_audit_log
UNION ALL
SELECT 'Contagem', 'gf_event_store', COUNT(*)::text FROM gf_event_store;

-- 8. Verificar views materializadas
SELECT 
  'Views Materializadas' as categoria,
  matviewname as nome,
  '✅' as status
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- 9. Verificar funções importantes
SELECT 
  'Funções' as categoria,
  routine_name as nome,
  '✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'update_updated_at_column',
    'gen_random_uuid'
  )
ORDER BY routine_name;

-- 10. Resumo final
SELECT 
  'RESUMO' as categoria,
  'Total de Tabelas' as item,
  COUNT(*)::text as valor
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
  'RESUMO',
  'Total de Índices',
  COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'RESUMO',
  'Tabelas com RLS',
  COUNT(*)::text
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;
