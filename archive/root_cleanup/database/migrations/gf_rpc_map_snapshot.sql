-- ========================================
-- GolfFox - RPC para Mapa da Frota
-- ========================================

-- Helper: obter nome do usuário de forma resiliente
CREATE OR REPLACE FUNCTION public.get_user_name(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE v_name text;
BEGIN
  -- Tenta coluna 'name'; se não existir, cai para 'email'
  BEGIN
    SELECT name INTO v_name FROM public.users WHERE id = p_user_id;
  EXCEPTION WHEN undefined_column THEN
    SELECT email INTO v_name FROM public.users WHERE id = p_user_id;
  END;
  RETURN v_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.gf_map_snapshot_full(
  p_company_id UUID DEFAULT NULL,
  p_route_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buses JSON;
  v_stops JSON;
  v_garages JSON;
  v_routes JSON;
  v_result JSON;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- BUSES: Veículos em rota + status + cor calculada
  SELECT json_agg(
    json_build_object(
      'id', t.id,
      'trip_id', t.id,
      'route_id', t.route_id,
      'route_name', r.name,
      'vehicle_id', t.vehicle_id,
      'vehicle_plate', v.plate,
      'vehicle_model', v.model,
      'capacity', v.capacity,
      'driver_id', t.driver_id,
      'driver_name', public.get_user_name(t.driver_id),
      'company_id', r.company_id,
      'company_name', c.name,
      'lat', lp.lat,
      'lng', lp.lng,
      'speed', lp.speed,
      'heading', lp.heading,
      'status', t.status,
      'last_update', lp.captured_at,
      'time_since_update_seconds', EXTRACT(EPOCH FROM (v_now - COALESCE(lp.captured_at, t.started_at))),
      'color', CASE
        -- VERDE: em movimento (speed > 5 km/h)
        WHEN COALESCE(lp.speed, 0) > 5 THEN 'green'
        -- AMARELO: parado até 2 min
        WHEN EXTRACT(EPOCH FROM (v_now - COALESCE(lp.captured_at, t.started_at))) < 120 THEN 'yellow'
        -- VERMELHO: parado a partir de 3 min
        WHEN EXTRACT(EPOCH FROM (v_now - COALESCE(lp.captured_at, t.started_at))) >= 180 THEN 'red'
        -- AZUL: terminou na garagem ou sem rota ativa
        WHEN t.status = 'completed' OR t.status = 'cancelled' THEN 'blue'
        ELSE 'yellow'
      END,
      'passenger_count', (
        -- Contar passageiros embarcados (pickedup ou status similar)
        SELECT COUNT(*) 
        FROM public.trip_passengers tp 
        WHERE tp.trip_id = t.id 
        AND (tp.status IS NULL OR tp.status IN ('pending', 'confirmed', 'pickedup', 'picked_up'))
      )
    )
    ORDER BY t.started_at DESC NULLS LAST
  )
  INTO v_buses
  FROM public.trips t
  LEFT JOIN public.routes r ON r.id = t.route_id
  LEFT JOIN public.companies c ON c.id = r.company_id
  LEFT JOIN public.vehicles v ON v.id = t.vehicle_id
  LEFT JOIN public.v_driver_last_position lp ON lp.trip_id = t.id
  WHERE t.status IN ('scheduled', 'inProgress')
    AND (p_company_id IS NULL OR r.company_id = p_company_id)
    AND (p_route_id IS NULL OR t.route_id = p_route_id);

  -- STOPS: Pontos de parada da rota (se route_id especificado)
  SELECT json_agg(
    json_build_object(
      'id', rp.id,
      'route_id', rp.route_id,
      'stop_order', rp.stop_order,
      'lat', rp.latitude,
      'lng', rp.longitude,
      'address', rp.address,
      'stop_name', rp.stop_name,
      'passenger_id', rp.passenger_id,
      'passenger_name', COALESCE(public.get_user_name(rp.passenger_id), ec.name),
      'estimated_arrival', rp.estimated_arrival_time
    )
    ORDER BY rp.stop_order
  )
  INTO v_stops
  FROM public.gf_route_plan rp
  LEFT JOIN public.gf_employee_company ec ON ec.id = rp.employee_id
  WHERE (p_route_id IS NULL OR rp.route_id = p_route_id);

  -- GARAGES: Veículos parados sem rota ativa
  SELECT json_agg(
    json_build_object(
      'id', v.id,
      'vehicle_id', v.id,
      'plate', v.plate,
      'model', v.model,
      'status', 'garage',
      'color', 'blue',
      'last_trip_id', (
        SELECT id FROM public.trips 
        WHERE vehicle_id = v.id 
        ORDER BY COALESCE(completed_at, started_at, updated_at) DESC NULLS LAST
        LIMIT 1
      ),
      'last_position', (
        SELECT json_build_object(
          'lat', public.get_driver_position_lat(dp.id),
          'lng', public.get_driver_position_lng(dp.id),
          'timestamp', dp.timestamp
        )
        FROM public.driver_positions dp
        JOIN public.trips t ON dp.trip_id = t.id
        WHERE t.vehicle_id = v.id
        ORDER BY dp.timestamp DESC
        LIMIT 1
      )
    )
  )
  INTO v_garages
  FROM public.vehicles v
  WHERE v.id NOT IN (
      SELECT DISTINCT vehicle_id 
      FROM public.trips 
      WHERE status IN ('scheduled', 'inProgress')
        AND vehicle_id IS NOT NULL
    );

  -- ROUTES: Info de rota para desenhar polyline
  SELECT json_agg(
    json_build_object(
      'id', r.id,
      'route_id', r.id,
      'name', r.name,
      'origin', NULL,
      'destination', NULL,
      'polyline_points', (
        SELECT json_agg(
          json_build_object(
            'lat', rp.latitude,
            'lng', rp.longitude,
            'order', rp.stop_order
          )
          ORDER BY rp.stop_order
        )
        FROM public.gf_route_plan rp
        WHERE rp.route_id = r.id
      ),
      'company_id', r.company_id,
      'company_name', c.name
    )
  )
  INTO v_routes
  FROM public.routes r
  LEFT JOIN public.companies c ON c.id = r.company_id
  WHERE (p_company_id IS NULL OR r.company_id = p_company_id)
    AND (p_route_id IS NULL OR r.id = p_route_id);

  -- Montar resultado final
  SELECT json_build_object(
    'buses', COALESCE(v_buses, '[]'::json),
    'stops', COALESCE(v_stops, '[]'::json),
    'garages', COALESCE(v_garages, '[]'::json),
    'routes', COALESCE(v_routes, '[]'::json),
    'timestamp', v_now
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.gf_map_snapshot_full TO authenticated;
GRANT EXECUTE ON FUNCTION public.gf_map_snapshot_full TO anon;

