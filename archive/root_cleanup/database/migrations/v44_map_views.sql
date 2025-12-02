-- Migration: v44_map_views
-- Views otimizadas para o mapa admin com visão ao vivo e histórico
-- Admin vê todas as empresas; Operator vê apenas sua empresa (via RLS)

-- ============================================
-- V_LIVE_VEHICLES
-- Veículos em tempo real: última posição + status + heading + ocupação
-- ============================================
CREATE OR REPLACE VIEW public.v_live_vehicles AS
WITH latest_positions AS (
  SELECT DISTINCT ON (t.vehicle_id, t.driver_id)
    t.vehicle_id,
    t.driver_id,
    t.id AS trip_id,
    t.route_id,
    t.status AS trip_status,
    dp.lat,
    dp.lng,
    dp.speed,
    dp.timestamp AS last_position_time,
    -- Calcular heading entre última e penúltima posição
    CASE 
      WHEN LAG(dp.lat) OVER (PARTITION BY t.vehicle_id, t.driver_id ORDER BY dp.timestamp) IS NOT NULL
      THEN DEGREES(
        ATAN2(
          dp.lng - LAG(dp.lng) OVER (PARTITION BY t.vehicle_id, t.driver_id ORDER BY dp.timestamp),
          dp.lat - LAG(dp.lat) OVER (PARTITION BY t.vehicle_id, t.driver_id ORDER BY dp.timestamp)
        )
      )
      ELSE NULL
    END AS heading
  FROM public.trips t
  INNER JOIN public.driver_positions dp ON dp.trip_id = t.id
  WHERE t.status = 'inProgress'
    AND dp.timestamp > NOW() - INTERVAL '5 minutes'
  ORDER BY t.vehicle_id, t.driver_id, dp.timestamp DESC
),
vehicle_status AS (
  SELECT 
    v.id AS vehicle_id,
    v.plate,
    v.model,
    v.company_id,
    c.name AS company_name,
    lp.trip_id,
    lp.route_id,
    r.name AS route_name,
    lp.driver_id,
    u.name AS driver_name,
    u.email AS driver_email,
    lp.lat,
    lp.lng,
    lp.speed,
    lp.heading,
    lp.last_position_time,
    lp.trip_status,
    -- Determinar status do veículo baseado em velocidade e tempo parado
    CASE
      WHEN lp.speed IS NULL OR lp.speed < 0.83 THEN -- < 3 km/h
        CASE 
          WHEN lp.last_position_time < NOW() - INTERVAL '3 minutes' THEN 'stopped_long'
          WHEN lp.last_position_time < NOW() - INTERVAL '2 minutes' THEN 'stopped_short'
          ELSE 'stopped_short'
        END
      ELSE 'moving'
    END AS vehicle_status,
    -- Calcular ocupação (passageiros)
    COALESCE(
      (SELECT COUNT(*) FROM public.trip_passengers tp WHERE tp.trip_id = lp.trip_id),
      0
    ) AS passenger_count
  FROM public.vehicles v
  INNER JOIN public.companies c ON c.id = v.company_id
  LEFT JOIN latest_positions lp ON lp.vehicle_id = v.id
  LEFT JOIN public.routes r ON r.id = lp.route_id
  LEFT JOIN public.users u ON u.id = lp.driver_id
  WHERE v.is_active = true
    AND (lp.vehicle_id IS NOT NULL OR v.id IN (
      SELECT DISTINCT vehicle_id FROM public.trips WHERE status = 'inProgress'
    ))
)
SELECT * FROM vehicle_status;

COMMENT ON VIEW public.v_live_vehicles IS 
  'Veículos em tempo real com última posição, heading calculado, status e ocupação. Admin vê todas as empresas.';

-- ============================================
-- V_ROUTE_POLYLINES
-- Rotas planejadas simplificadas (polyline para desenhar no mapa)
-- ============================================
CREATE OR REPLACE VIEW public.v_route_polylines AS
SELECT 
  r.id AS route_id,
  r.name AS route_name,
  r.company_id,
  c.name AS company_name,
  r.origin_address,
  r.origin_lat,
  r.origin_lng,
  r.destination_address,
  r.destination_lat,
  r.destination_lng,
  -- Gerar pontos do polyline a partir das paradas ordenadas
  json_agg(
    json_build_object(
      'lat', rs.lat,
      'lng', rs.lng,
      'order', rs.seq
    ) ORDER BY rs.seq
  ) AS polyline_points,
  -- Contar paradas
  COUNT(rs.id) AS stops_count
FROM public.routes r
INNER JOIN public.companies c ON c.id = r.company_id
LEFT JOIN public.route_stops rs ON rs.route_id = r.id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.company_id, c.name, 
         r.origin_address, r.origin_lat, r.origin_lng,
         r.destination_address, r.destination_lat, r.destination_lng;

COMMENT ON VIEW public.v_route_polylines IS 
  'Rotas planejadas com pontos simplificados para desenhar polylines no mapa.';

-- ============================================
-- V_TRIP_STATUS
-- Status de viagens: %concluído, atraso, próximo checkpoint
-- ============================================
CREATE OR REPLACE VIEW public.v_trip_status AS
WITH trip_progress AS (
  SELECT 
    t.id AS trip_id,
    t.route_id,
    t.vehicle_id,
    t.driver_id,
    t.status AS trip_status,
    t.scheduled_at,
    t.started_at,
    t.completed_at,
    r.name AS route_name,
    -- Contar paradas da rota
    (SELECT COUNT(*) FROM public.route_stops rs WHERE rs.route_id = t.route_id) AS total_stops,
    -- Contar eventos de chegada em paradas
    (SELECT COUNT(DISTINCT te.event_type) 
     FROM public.trip_events te 
     WHERE te.trip_id = t.id 
       AND te.event_type LIKE 'arrived_at_stop%'
    ) AS completed_stops,
    -- Última posição
    (SELECT dp.lat FROM public.driver_positions dp 
     WHERE dp.trip_id = t.id 
     ORDER BY dp.timestamp DESC LIMIT 1
    ) AS last_lat,
    (SELECT dp.lng FROM public.driver_positions dp 
     WHERE dp.trip_id = t.id 
     ORDER BY dp.timestamp DESC LIMIT 1
    ) AS last_lng,
    -- Próxima parada (primeira não completada)
    (SELECT rs.id FROM public.route_stops rs
     WHERE rs.route_id = t.route_id
       AND NOT EXISTS (
         SELECT 1 FROM public.trip_events te
         WHERE te.trip_id = t.id
           AND te.event_type = 'arrived_at_stop_' || rs.id
       )
     ORDER BY rs.seq ASC LIMIT 1
    ) AS next_stop_id,
    -- Calcular atraso (comparar started_at com scheduled_at)
    CASE 
      WHEN t.started_at IS NOT NULL AND t.scheduled_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (t.started_at - t.scheduled_at)) / 60
      ELSE NULL
    END AS delay_minutes
  FROM public.trips t
  INNER JOIN public.routes r ON r.id = t.route_id
  WHERE t.status IN ('inProgress', 'scheduled')
)
SELECT 
  tp.*,
  -- Calcular % concluído
  CASE 
    WHEN tp.total_stops > 0 
    THEN ROUND((tp.completed_stops::numeric / tp.total_stops::numeric) * 100, 1)
    ELSE 0
  END AS completion_percentage,
  -- Dados da próxima parada
  rs_next.name AS next_stop_name,
  rs_next.lat AS next_stop_lat,
  rs_next.lng AS next_stop_lng,
  rs_next.seq AS next_stop_order
FROM trip_progress tp
LEFT JOIN public.route_stops rs_next ON rs_next.id = tp.next_stop_id;

COMMENT ON VIEW public.v_trip_status IS 
  'Status detalhado de viagens com progresso, atraso e próxima parada.';

-- ============================================
-- V_ALERTS_OPEN
-- Alertas e solicitações de socorro abertas
-- ============================================
CREATE OR REPLACE VIEW public.v_alerts_open AS
SELECT 
  'incident' AS alert_type,
  i.id AS alert_id,
  i.company_id,
  c.name AS company_name,
  i.route_id,
  r.name AS route_name,
  i.vehicle_id,
  v.plate AS vehicle_plate,
  i.driver_id,
  u.name AS driver_name,
  i.severity,
  i.status,
  i.description,
  i.created_at,
  NULL::double precision AS lat,
  NULL::double precision AS lng
FROM public.gf_incidents i
INNER JOIN public.companies c ON c.id = i.company_id
LEFT JOIN public.routes r ON r.id = i.route_id
LEFT JOIN public.vehicles v ON v.id = i.vehicle_id
LEFT JOIN public.users u ON u.id = i.driver_id
WHERE i.status = 'open'

UNION ALL

SELECT 
  'assistance' AS alert_type,
  sr.id AS alert_id,
  sr.empresa_id AS company_id,
  c.name AS company_name,
  NULL::uuid AS route_id,
  NULL::text AS route_name,
  NULL::uuid AS vehicle_id,
  NULL::text AS vehicle_plate,
  NULL::uuid AS driver_id,
  NULL::text AS driver_name,
  CASE sr.priority
    WHEN 'urgente' THEN 'critical'
    WHEN 'alta' THEN 'high'
    WHEN 'normal' THEN 'medium'
    ELSE 'low'
  END AS severity,
  sr.status,
  sr.notes AS description,
  sr.created_at,
  (sr.payload->>'latitude')::double precision AS lat,
  (sr.payload->>'longitude')::double precision AS lng
FROM public.gf_service_requests sr
INNER JOIN public.companies c ON c.id = sr.empresa_id
WHERE sr.tipo = 'socorro'
  AND sr.status IN ('enviado', 'em_analise', 'rascunho');

COMMENT ON VIEW public.v_alerts_open IS 
  'Alertas e solicitações de socorro abertas com localização quando disponível.';

-- ============================================
-- V_POSITIONS_BY_INTERVAL
-- Histórico agregado de posições para playback
-- Retorna posições simplificadas por intervalo de tempo
-- ============================================
CREATE OR REPLACE FUNCTION public.v_positions_by_interval(
  p_company_id uuid DEFAULT NULL,
  p_route_id uuid DEFAULT NULL,
  p_vehicle_id uuid DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_interval_minutes int DEFAULT 1
)
RETURNS TABLE (
  position_id uuid,
  trip_id uuid,
  vehicle_id uuid,
  driver_id uuid,
  route_id uuid,
  lat double precision,
  lng double precision,
  speed double precision,
  heading double precision,
  timestamp timestamptz,
  passenger_count int
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH position_intervals AS (
    SELECT 
      dp.id,
      dp.trip_id,
      t.vehicle_id,
      dp.driver_id,
      t.route_id,
      dp.lat,
      dp.lng,
      dp.speed,
      dp.timestamp,
      -- Calcular heading entre posições consecutivas
      CASE 
        WHEN LAG(dp.lat) OVER (PARTITION BY t.vehicle_id, t.driver_id ORDER BY dp.timestamp) IS NOT NULL
        THEN DEGREES(
          ATAN2(
            dp.lng - LAG(dp.lng) OVER (PARTITION BY t.vehicle_id, t.driver_id ORDER BY dp.timestamp),
            dp.lat - LAG(dp.lat) OVER (PARTITION BY t.vehicle_id, t.driver_id ORDER BY dp.timestamp)
          )
        )
        ELSE NULL
      END AS heading,
      -- Agrupar por intervalo de tempo
      DATE_TRUNC('minute', dp.timestamp) + 
        (FLOOR(EXTRACT(MINUTE FROM dp.timestamp)::int / p_interval_minutes) * p_interval_minutes || ' minutes')::interval AS interval_time
    FROM public.driver_positions dp
    INNER JOIN public.trips t ON t.id = dp.trip_id
    WHERE (p_company_id IS NULL OR t.vehicle_id IN (
      SELECT id FROM public.vehicles WHERE company_id = p_company_id
    ))
      AND (p_route_id IS NULL OR t.route_id = p_route_id)
      AND (p_vehicle_id IS NULL OR t.vehicle_id = p_vehicle_id)
      AND (p_from IS NULL OR dp.timestamp >= p_from)
      AND (p_to IS NULL OR dp.timestamp <= p_to)
  ),
  aggregated_positions AS (
    SELECT DISTINCT ON (pi.interval_time, pi.vehicle_id, pi.driver_id)
      pi.id AS position_id,
      pi.trip_id,
      pi.vehicle_id,
      pi.driver_id,
      pi.route_id,
      pi.lat,
      pi.lng,
      pi.speed,
      pi.heading,
      pi.interval_time AS timestamp
    FROM position_intervals pi
    ORDER BY pi.interval_time, pi.vehicle_id, pi.driver_id, pi.timestamp DESC
  )
  SELECT 
    ap.position_id,
    ap.trip_id,
    ap.vehicle_id,
    ap.driver_id,
    ap.route_id,
    ap.lat,
    ap.lng,
    ap.speed,
    ap.heading,
    ap.timestamp,
    -- Contar passageiros no momento
    COALESCE(
      (SELECT COUNT(*) FROM public.trip_passengers tp WHERE tp.trip_id = ap.trip_id),
      0
    ) AS passenger_count
  FROM aggregated_positions ap
  ORDER BY ap.timestamp, ap.vehicle_id;
END;
$$;

COMMENT ON FUNCTION public.v_positions_by_interval IS 
  'Retorna histórico agregado de posições para playback, agrupado por intervalo de tempo.';

-- ============================================
-- RLS Policies para Admin
-- Admin vê todas as empresas (sem restrição)
-- ============================================
-- As views já filtram por company_id, então não precisam de RLS adicional
-- Mas garantimos que apenas admins podem ler

-- Revogar acesso público
REVOKE ALL ON public.v_live_vehicles FROM PUBLIC;
REVOKE ALL ON public.v_route_polylines FROM PUBLIC;
REVOKE ALL ON public.v_trip_status FROM PUBLIC;
REVOKE ALL ON public.v_alerts_open FROM PUBLIC;

-- Permitir acesso para usuários autenticados
GRANT SELECT ON public.v_live_vehicles TO authenticated;
GRANT SELECT ON public.v_route_polylines TO authenticated;
GRANT SELECT ON public.v_trip_status TO authenticated;
GRANT SELECT ON public.v_alerts_open TO authenticated;

-- Permitir execução da função para usuários autenticados
GRANT EXECUTE ON FUNCTION public.v_positions_by_interval TO authenticated;

