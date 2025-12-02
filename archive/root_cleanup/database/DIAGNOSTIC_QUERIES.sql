-- Queries de diagnóstico para identificar problemas no sistema
-- Execute estas queries no SQL Editor do Supabase

-- 1. Verificar estrutura da tabela vehicles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'vehicles'
ORDER BY ordinal_position;

-- 2. Verificar veículos ativos
SELECT id, plate, model, is_active, company_id, carrier_id, created_at
FROM vehicles
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- 3. Contar veículos por status
SELECT 
  is_active,
  COUNT(*) as total
FROM vehicles
GROUP BY is_active;

-- 4. Verificar trips ativas
SELECT 
  t.id, 
  t.vehicle_id, 
  t.driver_id, 
  t.route_id, 
  t.status,
  v.plate,
  r.name as route_name
FROM trips t
LEFT JOIN vehicles v ON v.id = t.vehicle_id
LEFT JOIN routes r ON r.id = t.route_id
WHERE t.status = 'inProgress'
ORDER BY t.created_at DESC
LIMIT 10;

-- 5. Verificar posições GPS recentes (últimas 24h)
SELECT 
  dp.id,
  dp.trip_id,
  dp.lat,
  dp.lng,
  dp.timestamp,
  t.vehicle_id,
  v.plate
FROM driver_positions dp
LEFT JOIN trips t ON t.id = dp.trip_id
LEFT JOIN vehicles v ON v.id = t.vehicle_id
WHERE dp.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY dp.timestamp DESC
LIMIT 10;

-- 6. Verificar políticas RLS da tabela vehicles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY policyname;

-- 7. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'vehicles';

-- 8. Verificar views existentes
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('v_live_vehicles', 'v_route_polylines', 'v_alerts_open')
ORDER BY table_name;

-- 9. Verificar tabelas que existem
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('vehicles', 'trips', 'driver_positions', 'routes', 'route_stops', 'gf_incidents', 'gf_service_requests')
ORDER BY table_name;

-- 10. Verificar usuário atual e suas permissões
SELECT current_user, current_role;

-- 11. Verificar se há veículos sem company_id
SELECT COUNT(*) as vehicles_without_company
FROM vehicles
WHERE company_id IS NULL AND is_active = true;

-- 12. Verificar se há veículos com trips mas sem posições
SELECT 
  v.id,
  v.plate,
  t.id as trip_id,
  t.status,
  COUNT(dp.id) as position_count
FROM vehicles v
INNER JOIN trips t ON t.vehicle_id = v.id
LEFT JOIN driver_positions dp ON dp.trip_id = t.id
WHERE v.is_active = true AND t.status = 'inProgress'
GROUP BY v.id, v.plate, t.id, t.status
ORDER BY position_count ASC;

