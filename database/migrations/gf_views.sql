-- ========================================
-- GolfFox - Views para Mapa e Operação
-- ========================================

-- Helper: obter nome do usuário de forma resiliente
CREATE OR REPLACE FUNCTION public.get_user_name(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE v_name text;
BEGIN
  BEGIN
    SELECT name INTO v_name FROM public.users WHERE id = p_user_id;
  EXCEPTION WHEN undefined_column THEN
    SELECT email INTO v_name FROM public.users WHERE id = p_user_id;
  END;
  RETURN v_name;
END;
$$;

-- Helpers: obter lat/lng de driver_positions independentemente do schema (lat/lng ou latitude/longitude)
-- Dropar helpers antigos para permitir mudar tipo de retorno (evita 42P13)
DROP FUNCTION IF EXISTS public.get_driver_position_lat(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_driver_position_lng(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_driver_position_lat(p_position_id uuid)
RETURNS double precision
LANGUAGE plpgsql
AS $$
DECLARE v_lat double precision;
BEGIN
  BEGIN
    SELECT lat::double precision INTO v_lat FROM public.driver_positions WHERE id = p_position_id;
  EXCEPTION WHEN undefined_column THEN
    SELECT latitude::double precision INTO v_lat FROM public.driver_positions WHERE id = p_position_id;
  END;
  RETURN v_lat;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_driver_position_lng(p_position_id uuid)
RETURNS double precision
LANGUAGE plpgsql
AS $$
DECLARE v_lng double precision;
BEGIN
  BEGIN
    SELECT lng::double precision INTO v_lng FROM public.driver_positions WHERE id = p_position_id;
  EXCEPTION WHEN undefined_column THEN
    SELECT longitude::double precision INTO v_lng FROM public.driver_positions WHERE id = p_position_id;
  END;
  RETURN v_lng;
END;
$$;

CREATE OR REPLACE VIEW public.v_driver_last_position AS
SELECT DISTINCT ON (driver_id)
  driver_id,
  trip_id,
  public.get_driver_position_lat(id) AS lat,
  public.get_driver_position_lng(id) AS lng,
  speed,
  NULL::numeric AS heading,
  NULL::numeric AS accuracy,
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
  t.scheduled_at,
  t.started_at,
  r.name AS route_name,
  NULL::text AS origin,
  NULL::text AS destination,
  r.company_id,
  c.name AS company_name,
  public.get_user_name(t.driver_id) AS driver_name,
  u.email AS driver_email,
  v.plate AS vehicle_plate,
  v.model AS vehicle_model,
  -- Compatível com esquemas sem coluna 'status' em trip_passengers
  (
    SELECT COUNT(*)
    FROM public.trip_passengers tp
    WHERE tp.trip_id = t.id
  ) AS active_passengers,
  (
    -- Fallback: contar eventos de embarque quando existirem; se não houver, retorna 0
    SELECT COALESCE(
      (
        SELECT COUNT(*) FROM public.trip_events te 
        WHERE te.trip_id = t.id AND te.event_type IN ('pickedup','boarded','embarked')
      ), 0
    )
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
  public.get_user_name(rp.passenger_id) AS passenger_name,
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

