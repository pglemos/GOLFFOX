-- ========================================
-- GOLF FOX - EXECUTE MIGRATIONS
-- ========================================
-- Execute este arquivo NO SUPABASE SQL EDITOR
-- Execute na ordem abaixo (1, 2, 3)

-- ========================================
-- PASSO 1: Views (gf_views.sql)
-- ========================================

-- View: Última posição de cada motorista
CREATE OR REPLACE VIEW public.v_driver_last_position AS
SELECT DISTINCT ON (driver_id)
  driver_id,
  vehicle_id,
  trip_id,
  latitude AS lat,
  longitude AS lng,
  speed,
  heading,
  accuracy,
  timestamp AS captured_at,
  NOW() - timestamp AS time_since_update
FROM public.driver_positions
ORDER BY driver_id, timestamp DESC;

-- View: Viagens ativas com informações consolidadas
CREATE OR REPLACE VIEW public.v_active_trips AS
SELECT 
  t.id AS trip_id,
  t.route_id,
  t.driver_id,
  t.vehicle_id,
  t.status,
  t.scheduled_start_time,
  t.actual_start_time,
  r.name AS route_name,
  r.origin,
  r.destination,
  r.company_id,
  c.name AS company_name,
  u.name AS driver_name,
  u.email AS driver_email,
  v.plate AS vehicle_plate,
  v.model AS vehicle_model,
  (
    SELECT COUNT(*)
    FROM public.trip_passengers tp
    WHERE tp.trip_id = t.id
    AND tp.status IN ('pending', 'confirmed', 'pickedup')
  ) AS active_passengers,
  (
    SELECT COUNT(*)
    FROM public.trip_passengers tp
    WHERE tp.trip_id = t.id
    AND tp.status = 'pickedup'
  ) AS picked_up_count,
  lp.lat AS last_lat,
  lp.lng AS last_lng,
  lp.speed AS last_speed,
  lp.captured_at AS last_position_at,
  lp.time_since_update
FROM public.trips t
LEFT JOIN public.routes r ON r.id = t.route_id
LEFT JOIN public.companies c ON c.id = r.company_id
LEFT JOIN public.users u ON u.id = t.driver_id
LEFT JOIN public.vehicles v ON v.id = t.vehicle_id
LEFT JOIN public.v_driver_last_position lp ON lp.trip_id = t.id
WHERE t.status = 'inProgress';

-- View: Pontos de parada por rota
CREATE OR REPLACE VIEW public.v_route_stops AS
SELECT 
  rp.id,
  rp.route_id,
  rp.stop_order,
  rp.latitude,
  rp.longitude,
  rp.address,
  rp.stop_name,
  rp.passenger_id,
  rp.employee_id,
  u.name AS passenger_name,
  u.email AS passenger_email,
  rp.created_at,
  r.name AS route_name
FROM public.gf_route_plan rp
LEFT JOIN public.routes r ON r.id = rp.route_id
LEFT JOIN public.users u ON u.id = rp.passenger_id
ORDER BY rp.route_id, rp.stop_order;

-- Grant permissions
GRANT SELECT ON public.v_driver_last_position TO authenticated;
GRANT SELECT ON public.v_active_trips TO authenticated;
GRANT SELECT ON public.v_route_stops TO authenticated;

-- ========================================
-- PASSO 2: Tabelas Auxiliares
-- Execute o conteúdo de: database/migrations/gf_tables_auxiliares.sql
-- (Arquivo muito grande, execute diretamente do arquivo original)
-- ========================================

-- ========================================
-- PASSO 3: RPC do Mapa
-- Execute o conteúdo de: database/migrations/gf_rpc_map_snapshot.sql
-- (Arquivo muito grande, execute diretamente do arquivo original)
-- ========================================

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se as views foram criadas
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('v_driver_last_position', 'v_active_trips', 'v_route_stops');

-- Verificar se as tabelas gf_ foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'gf_%'
ORDER BY table_name;

-- Verificar se a RPC foi criada
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'gf_map_snapshot_full';

-- ========================================
-- FIM
-- ========================================

