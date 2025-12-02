-- Views for Operator Panel - GOLF FOX v42.6
-- Read-only views for operator dashboard and reports

-- v_operator_dashboard_kpis: KPIs do dashboard do operador
CREATE OR REPLACE VIEW v_operator_dashboard_kpis AS
SELECT
  c.id as empresa_id,
  COUNT(DISTINCT t.id) FILTER (WHERE DATE(t.scheduled_at) = CURRENT_DATE) as trips_today,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'inProgress') as trips_in_progress,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as trips_completed,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.completed_at > t.scheduled_at + INTERVAL '5 minutes') as delays_over_5min,
  AVG(
    (
      SELECT COUNT(*)::NUMERIC 
      FROM trip_passengers tp 
      WHERE tp.trip_id = t.id
    )
  ) FILTER (WHERE t.status = 'inProgress') as avg_occupancy,
  -- Custo/dia faturado GOLF FOX
  SUM(COALESCE(il.amount, 0)) FILTER (WHERE DATE(i.created_at) = CURRENT_DATE) as daily_cost,
  -- SLA D+0 GOLF FOX→Operador (viagens concluídas no prazo hoje)
  CASE 
  WHEN COUNT(DISTINCT t.id) FILTER (WHERE DATE(t.scheduled_at) = CURRENT_DATE AND t.status = 'completed') > 0
  THEN (COUNT(DISTINCT t.id) FILTER (WHERE DATE(t.scheduled_at) = CURRENT_DATE AND t.status = 'completed' AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes')::NUMERIC /
  NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE DATE(t.scheduled_at) = CURRENT_DATE AND t.status = 'completed'), 0)) * 100
    ELSE 0
  END as sla_d0
FROM companies c
LEFT JOIN routes r ON r.company_id = c.id
LEFT JOIN trips t ON t.route_id = r.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN gf_invoice_lines il ON il.route_id = r.id
LEFT JOIN gf_invoices i ON i.id = il.invoice_id
WHERE c.role = 'company'
GROUP BY c.id;

-- v_operator_routes: Rotas do operador com estatísticas
CREATE OR REPLACE VIEW v_operator_routes AS
SELECT 
  r.id,
  r.name,
  r.company_id as empresa_id,
  COUNT(DISTINCT t.id) as total_trips,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_trips,
  -- Agregado de SLA
  AVG(EXTRACT(EPOCH FROM (t.completed_at - t.scheduled_at))/60) FILTER (WHERE t.status = 'completed') as avg_delay_minutes,
  -- Transportadora alocada
  c.name as carrier_name
FROM routes r
LEFT JOIN trips t ON t.route_id = r.id
LEFT JOIN gf_assigned_carriers ac ON ac.empresa_id = r.company_id AND CURRENT_DATE BETWEEN ac.period_start AND COALESCE(ac.period_end, CURRENT_DATE + INTERVAL '1 year')
LEFT JOIN companies c ON c.id = ac.carrier_id
GROUP BY r.id, r.name, r.company_id, c.name;

-- v_operator_alerts: Alertas do operador
CREATE OR REPLACE VIEW v_operator_alerts AS
SELECT 
  a.id,
  a.severity,
  a.message,
  a.company_id as empresa_id,
  a.created_at
FROM gf_alerts a
WHERE a.created_at >= NOW() - INTERVAL '30 days';

-- v_operator_costs: Custos consolidados do operador
CREATE OR REPLACE VIEW v_operator_costs AS
SELECT 
  r.company_id as empresa_id,
  r.id as route_id,
  r.name as route_name,
  DATE_TRUNC('month', i.created_at) as period,
  SUM(il.amount) as total_cost,
  SUM(il.discrepancy) as total_discrepancy,
  SUM(il.measured_km) as total_measured_km,
  SUM(il.invoiced_km) as total_invoiced_km,
  SUM(il.measured_trips) as total_measured_trips,
  SUM(il.invoiced_trips) as total_invoiced_trips
FROM gf_invoice_lines il
JOIN gf_invoices i ON i.id = il.invoice_id
JOIN routes r ON r.id = il.route_id
GROUP BY r.company_id, r.id, r.name, DATE_TRUNC('month', i.created_at);

-- v_operator_assigned_carriers: Prestadores alocados pela GOLF FOX (read-only)
CREATE OR REPLACE VIEW v_operator_assigned_carriers AS
SELECT 
  ac.empresa_id,
  c.id as carrier_id,
  c.name as carrier_name,
  ac.period_start,
  ac.period_end,
  ac.notes
FROM gf_assigned_carriers ac
JOIN companies c ON c.id = ac.carrier_id
WHERE c.role = 'carrier';

-- v_operator_carrier_sla: SLA detalhado por transportadora e período
CREATE OR REPLACE VIEW v_operator_carrier_sla AS
SELECT 
  ac.empresa_id,
  ac.carrier_id,
  c.name as carrier_name,
  DATE_TRUNC('month', t.scheduled_at) as period,
  COUNT(DISTINCT t.id) as total_trips,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes') as on_time_trips,
  (COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes')::NUMERIC / 
   NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)) * 100 as punctuality_percentage,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'cancelled') as cancelled_trips
FROM gf_assigned_carriers ac
JOIN routes r ON r.company_id = ac.empresa_id
JOIN trips t ON t.route_id = r.id
JOIN companies c ON c.id = ac.carrier_id
WHERE CURRENT_DATE BETWEEN ac.period_start AND COALESCE(ac.period_end, CURRENT_DATE + INTERVAL '1 year')
GROUP BY ac.empresa_id, ac.carrier_id, c.name, DATE_TRUNC('month', t.scheduled_at);

-- v_operator_sla: SLA GOLF FOX→Operador por período
CREATE OR REPLACE VIEW v_operator_sla AS
SELECT 
  r.company_id as empresa_id,
  DATE_TRUNC('month', t.scheduled_at) as period,
  COUNT(DISTINCT t.id) as total_trips,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes') as on_time_trips,
  (COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes')::NUMERIC / 
   NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)) * 100 as sla_percentage
FROM trips t
JOIN routes r ON r.id = t.route_id
GROUP BY r.company_id, DATE_TRUNC('month', t.scheduled_at);

-- v_operator_requests: Solicitações do operador com status
CREATE OR REPLACE VIEW v_operator_requests AS
SELECT 
  sr.id,
  sr.empresa_id,
  sr.tipo,
  sr.status,
  sr.priority,
  sr.created_at,
  sr.updated_at,
  sr.resolved_at,
  sr.sla_target,
  sr.created_by,
  sr.assigned_to,
  u.email as assigned_to_email,
  -- Calcula tempo de resposta
  CASE 
    WHEN sr.status IN ('aprovado', 'reprovado', 'em_operacao') AND sr.resolved_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (sr.resolved_at - sr.created_at)) / 3600 -- horas
    WHEN sr.sla_target IS NOT NULL
    THEN EXTRACT(EPOCH FROM (sr.sla_target - sr.created_at)) / 3600
    ELSE NULL
  END as response_time_hours
FROM gf_service_requests sr
LEFT JOIN users u ON u.id = sr.assigned_to;

-- v_operator_employees: Funcionários do operador com status
CREATE OR REPLACE VIEW v_operator_employees AS
SELECT 
  ec.id,
  ec.company_id as empresa_id,
  ec.name,
  ec.cpf,
  ec.email,
  ec.phone,
  ec.address,
  ec.latitude,
  ec.longitude,
  ec.is_active,
  ec.created_at
FROM gf_employee_company ec;

