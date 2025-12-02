-- Migration: v43_admin_views
-- Views globais para admin (sem filtro company_ownership, admin vê todas as empresas)
-- Todas as views incluem company_id para permitir filtros opcionais
-- Padronização: period_start, period_end para views de relatórios

-- ============================================
-- V_ADMIN_DASHBOARD_KPIS
-- KPIs do dashboard por empresa (admin vê todas)
-- ============================================
CREATE OR REPLACE VIEW public.v_admin_dashboard_kpis AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  -- Viagens Hoje
  COUNT(DISTINCT t.id) FILTER (WHERE DATE(t.scheduled_at) = CURRENT_DATE) AS trips_today,
  -- Veículos Ativos (em rota)
  COUNT(DISTINCT t.vehicle_id) FILTER (WHERE t.status = 'inProgress' AND t.vehicle_id IS NOT NULL) AS vehicles_active,
  -- Colaboradores em Trânsito
  COUNT(DISTINCT tp.id) FILTER (
    WHERE t.status = 'inProgress' 
    AND tp.status IN ('pending', 'confirmed', 'pickedup', 'picked_up')
  ) AS employees_in_transit,
  -- Alertas Críticos
  COUNT(DISTINCT a.id) FILTER (
    WHERE a.severity = 'critical' 
    AND a.is_resolved = false
  ) AS critical_alerts,
  -- Rotas do Dia
  COUNT(DISTINCT r.id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM public.trips t2 
      WHERE t2.route_id = r.id 
      AND DATE(t2.scheduled_at) = CURRENT_DATE
    )
  ) AS routes_today
FROM public.companies c
LEFT JOIN public.routes r ON r.company_id = c.id
LEFT JOIN public.trips t ON t.route_id = r.id
LEFT JOIN public.trip_passengers tp ON tp.trip_id = t.id
LEFT JOIN public.gf_alerts a ON a.company_id = c.id
WHERE c.role IN ('operator', 'carrier')
GROUP BY c.id, c.name;

COMMENT ON VIEW public.v_admin_dashboard_kpis IS 
  'KPIs do dashboard admin por empresa. Admin vê todas as empresas sem filtro RLS.';

-- ============================================
-- V_COSTS_BREAKDOWN
-- Custos detalhados por empresa/rota/veículo com daily_total
-- ============================================
CREATE OR REPLACE VIEW public.v_costs_breakdown AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  -- Por Rota
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'route_id', route_id,
        'route_name', route_name,
        'total_cost', total_cost,
        'total_km', total_km,
        'total_trips', total_trips
      )
    )
    FROM (
      SELECT 
        r.id AS route_id,
        r.name AS route_name,
        COALESCE(SUM(vc.total), 0) AS total_cost,
        COALESCE(SUM(vc.km), 0) AS total_km,
        COUNT(DISTINCT vc.trip_id) AS total_trips
      FROM public.routes r
      LEFT JOIN public.gf_vehicle_costs vc ON vc.route_id = r.id
      WHERE r.company_id = c.id
      GROUP BY r.id, r.name
    ) route_costs
  ) AS by_route,
  -- Por Veículo
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'vehicle_id', vehicle_id,
        'vehicle_plate', vehicle_plate,
        'total_cost', total_cost,
        'total_km', total_km
      )
    )
    FROM (
      SELECT 
        v.id AS vehicle_id,
        v.plate AS vehicle_plate,
        COALESCE(SUM(vc.total), 0) AS total_cost,
        COALESCE(SUM(vc.km), 0) AS total_km
      FROM public.vehicles v
      LEFT JOIN public.gf_vehicle_costs vc ON vc.vehicle_id = v.id
      WHERE v.company_id = c.id
      GROUP BY v.id, v.plate
    ) vehicle_costs
  ) AS by_vehicle,
  -- Por Empresa (total)
  COALESCE(SUM(vc.total), 0) AS by_company,
  -- Daily Total (hoje)
  COALESCE(
    SUM(vc.total) FILTER (WHERE vc.date = CURRENT_DATE), 
    0
  ) AS daily_total
FROM public.companies c
LEFT JOIN public.routes r ON r.company_id = c.id
LEFT JOIN public.gf_vehicle_costs vc ON vc.route_id = r.id
WHERE c.role IN ('operator', 'carrier')
GROUP BY c.id, c.name;

COMMENT ON VIEW public.v_costs_breakdown IS 
  'Custos detalhados por empresa com breakdown por rota, veículo e total diário.';

-- ============================================
-- V_REPORTS_DELAYS
-- Relatório de atrasos padronizado (company_id, period_start, period_end)
-- ============================================
CREATE OR REPLACE VIEW public.v_reports_delays AS
SELECT 
  r.company_id,
  DATE(t.scheduled_at) AS period_start,
  DATE(t.scheduled_at) AS period_end,
  t.id AS trip_id,
  t.route_id,
  r.name AS route_name,
  t.driver_id,
  COALESCE(
    (SELECT name FROM public.users WHERE id = t.driver_id),
    'Motorista não identificado'
  ) AS driver_name,
  t.scheduled_at,
  t.started_at,
  t.completed_at,
  CASE 
    WHEN t.started_at IS NULL THEN NULL
    ELSE EXTRACT(EPOCH FROM (t.started_at - t.scheduled_at)) / 60
  END AS delay_start_minutes,
  CASE 
    WHEN t.completed_at IS NULL THEN NULL
    ELSE EXTRACT(EPOCH FROM (t.completed_at - t.scheduled_at)) / 60
  END AS total_delay_minutes,
  COUNT(DISTINCT tp.id) AS total_passengers,
  COUNT(DISTINCT CASE WHEN tp.status IN ('pickedup', 'picked_up') THEN tp.id END) AS picked_up_passengers,
  t.status
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
LEFT JOIN public.trip_passengers tp ON tp.trip_id = t.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '90 days'
  AND r.company_id IS NOT NULL
GROUP BY 
  r.company_id,
  DATE(t.scheduled_at),
  t.id,
  t.route_id,
  r.name,
  t.driver_id,
  t.scheduled_at,
  t.started_at,
  t.completed_at,
  t.status;

COMMENT ON VIEW public.v_reports_delays IS 
  'Relatório de atrasos padronizado com company_id, period_start, period_end para filtros.';

-- ============================================
-- V_REPORTS_OCCUPANCY
-- Ocupação por horário padronizado
-- ============================================
CREATE OR REPLACE VIEW public.v_reports_occupancy AS
SELECT 
  r.company_id,
  DATE(t.scheduled_at) AS period_start,
  DATE(t.scheduled_at) AS period_end,
  DATE(t.scheduled_at) AS date,
  EXTRACT(HOUR FROM t.scheduled_at)::integer AS hour,
  COUNT(DISTINCT t.id) AS total_trips,
  COUNT(DISTINCT t.vehicle_id) AS vehicles_in_use,
  COUNT(DISTINCT tp.id) AS total_passengers,
  COALESCE(AVG(v.capacity), 0) AS avg_vehicle_capacity,
  ROUND(
    (COUNT(DISTINCT tp.id)::NUMERIC / 
     NULLIF(SUM(DISTINCT v.capacity), 0)) * 100,
    2
  ) AS occupancy_percentage
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
LEFT JOIN public.vehicles v ON t.vehicle_id = v.id
LEFT JOIN public.trip_passengers tp ON tp.trip_id = t.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '90 days'
  AND r.company_id IS NOT NULL
GROUP BY 
  r.company_id,
  DATE(t.scheduled_at),
  EXTRACT(HOUR FROM t.scheduled_at);

COMMENT ON VIEW public.v_reports_occupancy IS 
  'Ocupação por horário padronizado com company_id, period_start, period_end.';

-- ============================================
-- V_REPORTS_NOT_BOARDED
-- Passageiros não embarcados padronizado
-- ============================================
CREATE OR REPLACE VIEW public.v_reports_not_boarded AS
SELECT 
  r.company_id,
  DATE(t.scheduled_at) AS period_start,
  DATE(t.scheduled_at) AS period_end,
  t.id AS trip_id,
  r.name AS route_name,
  COALESCE(
    (SELECT name FROM public.users WHERE id = t.driver_id),
    'Motorista não identificado'
  ) AS driver_name,
  tp.passenger_id,
  COALESCE(
    (SELECT name FROM public.users WHERE id = tp.passenger_id),
    'Passageiro não identificado'
  ) AS passenger_name,
  tp.pickup_location AS missed_pickup_location,
  t.scheduled_at,
  CASE 
    WHEN t.completed_at IS NULL THEN 'trip_not_completed'
    WHEN tp.status IN ('confirmed') THEN 'missed_pickup'
    WHEN tp.status IN ('pending') THEN 'never_confirmed'
    ELSE 'other'
  END AS reason,
  COALESCE(a.description, 'Sem motivo informado') AS alert_description
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
JOIN public.trip_passengers tp ON tp.trip_id = t.id
LEFT JOIN public.gf_alerts a ON a.trip_id = t.id AND a.passenger_id = tp.passenger_id
WHERE t.status = 'completed'
  AND tp.status NOT IN ('pickedup', 'picked_up', 'completed', 'dropped_off')
  AND r.company_id IS NOT NULL;

COMMENT ON VIEW public.v_reports_not_boarded IS 
  'Passageiros não embarcados padronizado com company_id, period_start, period_end.';

-- ============================================
-- V_REPORTS_EFFICIENCY
-- Eficiência de rotas padronizado
-- ============================================
CREATE OR REPLACE VIEW public.v_reports_efficiency AS
SELECT 
  r.company_id,
  DATE_TRUNC('week', t.scheduled_at)::date AS period_start,
  (DATE_TRUNC('week', t.scheduled_at) + INTERVAL '6 days')::date AS period_end,
  COUNT(DISTINCT t.id) AS total_trips,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS completed_trips,
  COUNT(DISTINCT t.id) FILTER (
    WHERE t.status = 'completed' 
    AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes'
  ) AS on_time_trips,
  ROUND(
    (
      COUNT(DISTINCT t.id) FILTER (
        WHERE t.status = 'completed' 
        AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes'
      )::NUMERIC / 
      NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)
    ) * 100,
    2
  ) AS on_time_percentage,
  AVG(
    EXTRACT(EPOCH FROM (t.completed_at - t.scheduled_at)) / 60
  ) FILTER (WHERE t.status = 'completed') AS avg_duration_minutes,
  COUNT(DISTINCT r.id) AS active_routes,
  COUNT(DISTINCT t.vehicle_id) AS vehicles_used
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '90 days'
  AND r.company_id IS NOT NULL
GROUP BY 
  r.company_id,
  DATE_TRUNC('week', t.scheduled_at);

COMMENT ON VIEW public.v_reports_efficiency IS 
  'Eficiência de rotas padronizado com company_id, period_start, period_end.';

-- ============================================
-- V_REPORTS_DRIVER_RANKING
-- Ranking de motoristas (pontualidade, rotas cumpridas, eficiência)
-- ============================================
CREATE OR REPLACE VIEW public.v_reports_driver_ranking AS
SELECT 
  r.company_id,
  t.driver_id,
  COALESCE(
    (SELECT name FROM public.users WHERE id = t.driver_id),
    'Motorista não identificado'
  ) AS driver_name,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS routes_completed,
  COUNT(DISTINCT t.id) FILTER (
    WHERE t.status = 'completed' 
    AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes'
  ) AS on_time_routes,
  ROUND(
    (
      COUNT(DISTINCT t.id) FILTER (
        WHERE t.status = 'completed' 
        AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes'
      )::NUMERIC / 
      NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)
    ) * 100,
    2
  ) AS punctuality_score,
  AVG(
    EXTRACT(EPOCH FROM (t.completed_at - t.scheduled_at)) / 60
  ) FILTER (WHERE t.status = 'completed') AS avg_delay_minutes,
  COUNT(DISTINCT tp.id) FILTER (
    WHERE t.status = 'completed' 
    AND tp.status IN ('pickedup', 'picked_up', 'completed', 'dropped_off')
  ) AS total_passengers_transported,
  -- Score de eficiência (combinação de pontualidade e volume)
  ROUND(
    (
      (
        COUNT(DISTINCT t.id) FILTER (
          WHERE t.status = 'completed' 
          AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes'
        )::NUMERIC / 
        NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)
      ) * 0.6 +
      (
        LEAST(COUNT(DISTINCT tp.id) FILTER (
          WHERE t.status = 'completed' 
          AND tp.status IN ('pickedup', 'picked_up', 'completed', 'dropped_off')
        )::NUMERIC / 100, 1.0)
      ) * 0.4
    ) * 100,
    2
  ) AS efficiency_score
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
LEFT JOIN public.trip_passengers tp ON tp.trip_id = t.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '90 days'
  AND r.company_id IS NOT NULL
  AND t.driver_id IS NOT NULL
GROUP BY 
  r.company_id,
  t.driver_id;

COMMENT ON VIEW public.v_reports_driver_ranking IS 
  'Ranking de motoristas com pontualidade, rotas cumpridas e score de eficiência.';

