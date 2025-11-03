-- ========================================
-- GolfFox v41.0 - Views e KPIs do Dashboard
-- ========================================

-- View: KPIs do Dashboard
CREATE OR REPLACE VIEW public.v_dashboard_kpis AS
SELECT 
  -- Colaboradores em Trânsito
  (
    SELECT COUNT(DISTINCT tp.id)
    FROM public.trip_passengers tp
    JOIN public.trips t ON tp.trip_id = t.id
    WHERE t.status = 'inProgress'
      AND tp.status IN ('pending', 'confirmed', 'pickedup', 'picked_up')
  ) AS colaboradores_em_transito,
  
  -- Veículos Ativos
  (
    SELECT COUNT(DISTINCT t.vehicle_id)
    FROM public.trips t
    WHERE t.status = 'inProgress'
      AND t.vehicle_id IS NOT NULL
  ) AS veiculos_ativos,
  
  -- Rotas do Dia
  (
    SELECT COUNT(DISTINCT t.id)
    FROM public.trips t
    WHERE DATE(t.scheduled_at) = CURRENT_DATE
  ) AS rotas_do_dia,
  
  -- Alertas Críticos
  (
    SELECT COUNT(*)
    FROM public.gf_alerts
    WHERE severity = 'critical'
      AND is_resolved = false
  ) AS alertas_criticos;

-- View: Custos por Rota
CREATE OR REPLACE VIEW public.v_route_costs AS
SELECT 
  r.id AS route_id,
  r.name AS route_name,
  c.id AS company_id,
  c.name AS company_name,
  COUNT(DISTINCT vc.id) AS cost_records_count,
  COALESCE(SUM(vc.km), 0) AS total_km,
  COALESCE(SUM(vc.fuel), 0) AS total_fuel_cost,
  COALESCE(SUM(vc.maintenance), 0) AS total_maintenance_cost,
  COALESCE(SUM(vc.other_costs), 0) AS total_other_costs,
  COALESCE(SUM(vc.total), 0) AS total_cost,
  AVG(vc.total) AS avg_cost_per_trip,
  MIN(vc.date) AS first_cost_date,
  MAX(vc.date) AS last_cost_date
FROM public.routes r
JOIN public.companies c ON r.company_id = c.id
LEFT JOIN public.gf_vehicle_costs vc ON vc.route_id = r.id
GROUP BY r.id, r.name, c.id, c.name;

-- View: Relatórios de Atrasos
CREATE OR REPLACE VIEW public.v_reports_delays AS
SELECT 
  t.id AS trip_id,
  t.route_id,
  r.name AS route_name,
  t.driver_id,
  public.get_user_name(t.driver_id) AS driver_name,
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
  COUNT(DISTINCT CASE WHEN tp.status IN ('pickedup', 'picked_up') THEN tp.id END) AS picked_up_passengers
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
LEFT JOIN public.trip_passengers tp ON tp.trip_id = t.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY t.id, t.route_id, r.name, t.driver_id, t.scheduled_at, t.started_at, t.completed_at;

-- View: Ocupação por Horário
CREATE OR REPLACE VIEW public.v_reports_occupancy AS
SELECT 
  DATE(t.scheduled_at) AS date,
  EXTRACT(HOUR FROM t.scheduled_at) AS hour,
  COUNT(DISTINCT t.id) AS total_trips,
  COUNT(DISTINCT t.vehicle_id) AS vehicles_in_use,
  COUNT(DISTINCT tp.id) AS total_passengers,
  AVG(v.capacity) AS avg_vehicle_capacity,
  ROUND(
    (COUNT(DISTINCT tp.id)::NUMERIC / NULLIF(SUM(DISTINCT v.capacity), 0)) * 100,
    2
  ) AS occupancy_percentage
FROM public.trips t
LEFT JOIN public.vehicles v ON t.vehicle_id = v.id
LEFT JOIN public.trip_passengers tp ON tp.trip_id = t.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(t.scheduled_at), EXTRACT(HOUR FROM t.scheduled_at);

-- View: Passageiros Não Embarcados
CREATE OR REPLACE VIEW public.v_reports_not_boarded AS
SELECT 
  t.id AS trip_id,
  r.name AS route_name,
  public.get_user_name(t.driver_id) AS driver_name,
  tp.id AS passenger_id,
  public.get_user_name(tp.passenger_id) AS passenger_name,
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
LEFT JOIN public.gf_alerts a ON a.trip_id = t.id AND a.affected_user_id = tp.passenger_id
WHERE t.status = 'completed'
  AND tp.status NOT IN ('pickedup', 'picked_up', 'completed', 'dropped_off');

-- Tabela: Cache de Relatórios Pesados
CREATE TABLE IF NOT EXISTS public.gf_reports_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  report_period_start DATE,
  report_period_end DATE,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_type, report_period_start, report_period_end)
);

CREATE INDEX IF NOT EXISTS idx_gf_reports_cache_type_period ON public.gf_reports_cache(report_type, report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_gf_reports_cache_expires ON public.gf_reports_cache(expires_at);

-- Function: Limpar cache expirado
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.gf_reports_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

