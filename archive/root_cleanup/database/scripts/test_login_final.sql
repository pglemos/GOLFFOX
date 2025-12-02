-- ========================================
-- VERIFICAÇÃO FINAL - Teste de Login
-- GolfFox v7.4
-- ========================================

-- 1. Verificar usuários em auth.users
SELECT 
  '📧 AUTH.USERS' as status,
  COUNT(*) as total
FROM auth.users;

-- 2. Verificar perfis em public.users
SELECT 
  '👤 PUBLIC.USERS' as status,
  COUNT(*) as total,
  json_agg(json_build_object('email', email, 'role', role)) as usuarios
FROM public.users;

-- 3. Verificar se há correspondência entre auth e public
SELECT 
  au.email as auth_email,
  au.id as auth_id,
  pu.role as public_role,
  pu.name as public_name,
  CASE 
    WHEN pu.id IS NOT NULL THEN '✅ Perfil OK'
    ELSE '❌ Sem perfil'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
ORDER BY au.email;

-- 4. Verificar dados completos (para cada perfil)
SELECT 
  u.email,
  u.name,
  u.role,
  c.name as company_name,
  ca.name as carrier_name
FROM public.users u
LEFT JOIN public.companies c ON c.id = u.company_id
LEFT JOIN public.carriers ca ON ca.id = u.carrier_id
ORDER BY u.role, u.email;

-- 5. Contar por role
SELECT 
  role,
  COUNT(*) as quantidade
FROM public.users
GROUP BY role
ORDER BY role;

-- 6. Verificar trips (se existem)
SELECT 
  '🚌 TRIPS' as status,
  COUNT(*) as total
FROM public.trips;

-- 7. Verificar posições (se existem)
SELECT 
  '📍 POSIÇÕES' as status,
  COUNT(*) as total
FROM public.driver_positions;

