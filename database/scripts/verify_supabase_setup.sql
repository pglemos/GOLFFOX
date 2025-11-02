-- ========================================
-- Verificação completa do Supabase
-- GolfFox Transport System v7.4
-- ========================================

-- 1. Verificar tabelas criadas
SELECT '📊 Tabelas:' as categoria, table_name as item
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar políticas RLS
SELECT '🔒 Políticas RLS:' as categoria, 
       tablename as tabela,
       policyname as politica,
       cmd as comando
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verificar funções
SELECT '⚙️ Funções:' as categoria,
       routine_name as funcao,
       routine_type as tipo
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- 4. Verificar triggers
SELECT '🔄 Triggers:' as categoria,
       tgname as trigger,
       tgrelid::regclass as tabela
FROM pg_trigger
WHERE NOT tgisinternal
AND schemaname = 'public'
ORDER BY tgname;

-- 5. Verificar usuários auth
SELECT '👥 Usuários Auth:' as categoria,
       id::text as usuario_id,
       email,
       created_at
FROM auth.users
ORDER BY created_at;

-- 6. Verificar usuários public
SELECT '👤 Usuários Public:' as categoria,
       id::text as usuario_id,
       email,
       role,
       company_id,
       carrier_id
FROM public.users
ORDER BY role;

-- 7. Verificar companies
SELECT '🏢 Empresas:' as categoria,
       id::text as company_id,
       name
FROM public.companies;

-- 8. Verificar carriers
SELECT '🚚 Transportadoras:' as categoria,
       id::text as carrier_id,
       name
FROM public.carriers;

-- 9. Verificar trips
SELECT '🚌 Trips:' as categoria,
       id::text as trip_id,
       route_id,
       vehicle_id,
       driver_id,
       status,
       scheduled_at
FROM public.trips
ORDER BY created_at DESC
LIMIT 5;

-- 10. Verificar driver_positions
SELECT '📍 Posições:' as categoria,
       COUNT(*) as total_posicoes,
       MAX(timestamp) as ultima_posicao
FROM public.driver_positions;

-- ========================================
-- RESUMO
-- ========================================
SELECT '✅ RESUMO:' as status,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tabelas_criadas,
       (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as politicas_rls,
       (SELECT COUNT(*) FROM auth.users) as usuarios_auth,
       (SELECT COUNT(*) FROM public.users) as usuarios_public,
       (SELECT COUNT(*) FROM public.trips) as trips_criadas;

