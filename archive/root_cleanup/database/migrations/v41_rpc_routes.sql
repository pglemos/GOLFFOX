-- ========================================
-- GolfFox v41.0 - RPCs para Rotas
-- ========================================

-- Function: Gerar pontos de parada automaticamente baseado em funcionários
CREATE OR REPLACE FUNCTION public.rpc_generate_route_stops(
  p_route_id UUID,
  p_company_id UUID
)
RETURNS TABLE(
  stop_order INTEGER,
  latitude NUMERIC,
  longitude NUMERIC,
  address TEXT,
  stop_name TEXT,
  employee_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_emp RECORD;
  v_order INTEGER := 1;
BEGIN
  -- Buscar todos os funcionários ativos da empresa que têm localização
  FOR v_emp IN 
    SELECT 
      id,
      name,
      latitude,
      longitude,
      address
    FROM public.gf_employee_company
    WHERE company_id = p_company_id
      AND is_active = true
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    ORDER BY name
  LOOP
    -- Retornar ponto de parada
    RETURN QUERY SELECT 
      v_order,
      v_emp.latitude,
      v_emp.longitude,
      v_emp.address,
      v_emp.name AS stop_name,
      v_emp.id AS employee_id;
    
    v_order := v_order + 1;
  END LOOP;
  
  RETURN;
END;
$$;

-- Function: Otimizar rota com Google Maps Directions
-- Nota: Esta função retorna os pontos ordenados, mas não chama a API do Google
-- A chamada real à API será feita no backend/edge function
CREATE OR REPLACE FUNCTION public.rpc_optimize_route_google(
  p_points JSONB -- Array de {lat, lng}
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Esta é uma função placeholder
  -- A otimização real será feita por uma edge function que chama Google Directions API
  -- A edge function vai retornar um polyline codificado e waypoints ordenados
  
  -- Por enquanto, retorna os pontos na ordem original
  v_result := jsonb_build_object(
    'optimized_points', p_points,
    'total_distance_meters', 0,
    'total_duration_seconds', 0,
    'polyline', ''
  );
  
  RETURN v_result;
END;
$$;

-- Function: Obter snapshot completo do mapa para frota em tempo real
CREATE OR REPLACE FUNCTION public.gf_map_snapshot_full(
  p_company_id UUID DEFAULT NULL,
  p_route_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH driver_positions_data AS (
    SELECT DISTINCT ON (dp.driver_id)
      dp.driver_id,
      dp.trip_id,
      dp.route_id,
      dp.vehicle_id,
      dp.lat,
      dp.lng,
      dp.speed,
      dp.timestamp AS captured_at,
      NOW() - dp.timestamp AS time_since_update
    FROM public.driver_positions dp
    WHERE (p_company_id IS NULL OR EXISTS (
        SELECT 1 FROM public.routes r 
        WHERE r.id = dp.route_id AND r.company_id = p_company_id
      ))
      AND (p_route_id IS NULL OR dp.route_id = p_route_id)
    ORDER BY dp.driver_id, dp.timestamp DESC
  ),
  buses_with_info AS (
    SELECT 
      dp.driver_id,
      dp.trip_id,
      dp.route_id,
      dp.vehicle_id,
      dp.lat,
      dp.lng,
      dp.speed,
      dp.captured_at,
      dp.time_since_update,
      r.name AS route_name,
      public.get_user_name(dp.driver_id) AS driver_name,
      v.plate AS vehicle_plate,
      v.model AS vehicle_model,
      c.id AS company_id,
      c.name AS company_name,
      -- Determinar cor baseado no tempo parado
      CASE 
        WHEN dp.time_since_update > INTERVAL '3 minutes' THEN 'red'
        WHEN dp.time_since_update > INTERVAL '2 minutes' THEN 'yellow'
        WHEN dp.speed > 0 THEN 'green'
        ELSE 'blue'
      END AS color
    FROM driver_positions_data dp
    LEFT JOIN public.routes r ON dp.route_id = r.id
    LEFT JOIN public.vehicles v ON dp.vehicle_id = v.id
    LEFT JOIN public.companies c ON r.company_id = c.id
  ),
  stops_data AS (
    SELECT 
      rp.id,
      rp.route_id,
      rp.stop_order,
      rp.latitude,
      rp.longitude,
      rp.address,
      rp.stop_name,
      public.get_user_name(rp.passenger_id) AS passenger_name
    FROM public.gf_route_plan rp
    WHERE (p_company_id IS NULL OR EXISTS (
        SELECT 1 FROM public.routes r 
        WHERE r.id = rp.route_id AND r.company_id = p_company_id
      ))
      AND (p_route_id IS NULL OR rp.route_id = p_route_id)
  ),
  routes_data AS (
    SELECT 
      r.id,
      r.name,
      r.company_id,
      c.name AS company_name,
      ST_AsGeoJSON(ST_MakeLine(
        ST_SetSRID(ST_MakePoint(rp.longitude, rp.latitude), 4326)
        ORDER BY rp.stop_order
      )) AS polyline_geojson
    FROM public.routes r
    JOIN public.companies c ON r.company_id = c.id
    JOIN public.gf_route_plan rp ON rp.route_id = r.id
    WHERE (p_company_id IS NULL OR r.company_id = p_company_id)
      AND (p_route_id IS NULL OR r.id = p_route_id)
    GROUP BY r.id, r.name, r.company_id, c.name
  )
  SELECT jsonb_build_object(
    'buses', COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
      'id', driver_id,
      'trip_id', trip_id,
      'route_id', route_id,
      'route_name', route_name,
      'vehicle_id', vehicle_id,
      'vehicle_plate', vehicle_plate,
      'vehicle_model', vehicle_model,
      'driver_id', driver_id,
      'driver_name', driver_name,
      'company_id', company_id,
      'company_name', company_name,
      'lat', lat,
      'lng', lng,
      'speed', speed,
      'color', color,
      'last_update', captured_at
    )) FILTER (WHERE driver_id IS NOT NULL), '[]'::jsonb),
    'stops', COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
      'id', id,
      'route_id', route_id,
      'stop_order', stop_order,
      'lat', latitude,
      'lng', longitude,
      'address', address,
      'stop_name', stop_name,
      'passenger_name', passenger_name
    )) FILTER (WHERE id IS NOT NULL), '[]'::jsonb),
    'routes', COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
      'id', id,
      'name', name,
      'company_id', company_id,
      'company_name', company_name,
      'polyline', polyline_geojson
    )) FILTER (WHERE id IS NOT NULL), '[]'::jsonb)
  ) INTO v_result
  FROM buses_with_info
  FULL OUTER JOIN stops_data ON TRUE
  FULL OUTER JOIN routes_data ON TRUE;
  
  RETURN v_result;
END;
$$;

-- Comentários de documentação
COMMENT ON FUNCTION public.rpc_generate_route_stops IS 'Gera automaticamente pontos de parada baseado nos funcionários cadastrados pela empresa';
COMMENT ON FUNCTION public.rpc_optimize_route_google IS 'Placeholder para otimização de rotas usando Google Directions API (implementar em edge function)';
COMMENT ON FUNCTION public.gf_map_snapshot_full IS 'Retorna snapshot completo de buses, stops e rotas para exibição no mapa em tempo real';

