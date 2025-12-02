-- ========================================
-- Migration v57: Fix v_carrier_expiring_documents para usar transportadora_id
-- ========================================
-- 
-- Esta migration atualiza a view v_carrier_expiring_documents para usar
-- transportadora_id ao invés de carrier_id
--

-- Dropar views existentes para recriar com a estrutura correta
DROP VIEW IF EXISTS public.v_carrier_expiring_documents CASCADE;
DROP VIEW IF EXISTS public.v_carrier_vehicle_costs_summary CASCADE;
DROP VIEW IF EXISTS public.v_carrier_route_costs_summary CASCADE;

-- View: Vencimentos próximos (documentos e exames) - Atualizada para transportadora_id
CREATE OR REPLACE VIEW public.v_carrier_expiring_documents AS
SELECT 
  'driver_document' as item_type,
  dd.id,
  dd.driver_id as entity_id,
  u.name as entity_name,
  dd.document_type,
  dd.expiry_date,
  dd.status,
  CASE 
    WHEN dd.expiry_date < NOW()::date THEN 'expired'
    WHEN dd.expiry_date <= (NOW()::date + INTERVAL '7 days') THEN 'critical'
    WHEN dd.expiry_date <= (NOW()::date + INTERVAL '30 days') THEN 'warning'
    ELSE 'ok'
  END as alert_level,
  (dd.expiry_date - NOW()::date)::integer as days_to_expiry,
  u.transportadora_id
FROM public.driver_documents dd
JOIN public.users u ON u.id = dd.driver_id
WHERE dd.expiry_date IS NOT NULL

UNION ALL

SELECT 
  'driver_exam' as item_type,
  dme.id,
  dme.driver_id as entity_id,
  u.name as entity_name,
  dme.exam_type as document_type,
  dme.expiry_date,
  dme.result as status,
  CASE 
    WHEN dme.expiry_date < NOW()::date THEN 'expired'
    WHEN dme.expiry_date <= (NOW()::date + INTERVAL '7 days') THEN 'critical'
    WHEN dme.expiry_date <= (NOW()::date + INTERVAL '30 days') THEN 'warning'
    ELSE 'ok'
  END as alert_level,
  (dme.expiry_date - NOW()::date)::integer as days_to_expiry,
  u.transportadora_id
FROM public.driver_medical_exams dme
JOIN public.users u ON u.id = dme.driver_id
WHERE dme.expiry_date IS NOT NULL

UNION ALL

SELECT 
  'vehicle_document' as item_type,
  vd.id,
  vd.vehicle_id as entity_id,
  v.plate as entity_name,
  vd.document_type,
  vd.expiry_date,
  vd.status,
  CASE 
    WHEN vd.expiry_date < NOW()::date THEN 'expired'
    WHEN vd.expiry_date <= (NOW()::date + INTERVAL '7 days') THEN 'critical'
    WHEN vd.expiry_date <= (NOW()::date + INTERVAL '30 days') THEN 'warning'
    ELSE 'ok'
  END as alert_level,
  (vd.expiry_date - NOW()::date)::integer as days_to_expiry,
  v.transportadora_id
FROM public.vehicle_documents vd
JOIN public.vehicles v ON v.id = vd.vehicle_id
WHERE vd.expiry_date IS NOT NULL;

-- View: Custos consolidados por veículo - Atualizada para transportadora_id
CREATE OR REPLACE VIEW public.v_carrier_vehicle_costs_summary AS
SELECT 
  v.id as vehicle_id,
  v.plate,
  v.model,
  v.transportadora_id,
  DATE_TRUNC('month', vc.cost_date) as month,
  SUM(vc.amount_brl) as total_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'combustivel' THEN vc.amount_brl ELSE 0 END) as fuel_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'manutencao' THEN vc.amount_brl ELSE 0 END) as maintenance_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'seguro' THEN vc.amount_brl ELSE 0 END) as insurance_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'ipva' THEN vc.amount_brl ELSE 0 END) as ipva_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'pedagio' THEN vc.amount_brl ELSE 0 END) as toll_cost_brl,
  SUM(CASE WHEN vc.cost_category = 'multas' THEN vc.amount_brl ELSE 0 END) as fines_cost_brl,
  SUM(CASE WHEN vc.cost_category NOT IN ('combustivel', 'manutencao', 'seguro', 'ipva', 'pedagio', 'multas') THEN vc.amount_brl ELSE 0 END) as other_cost_brl,
  COUNT(*) as cost_entries
FROM public.vehicles v
LEFT JOIN public.vehicle_costs vc ON vc.vehicle_id = v.id
GROUP BY v.id, v.plate, v.model, v.transportadora_id, DATE_TRUNC('month', vc.cost_date);

-- View: Custos consolidados por rota - Atualizada para transportadora_id
CREATE OR REPLACE VIEW public.v_carrier_route_costs_summary AS
SELECT 
  r.id as route_id,
  r.name as route_name,
  r.transportadora_id,
  r.company_id,
  DATE_TRUNC('month', rc.cost_date) as month,
  COUNT(DISTINCT rc.trip_id) as trips_count,
  SUM(rc.total_cost_brl) as total_cost_brl,
  SUM(rc.fuel_cost_brl) as fuel_cost_brl,
  SUM(rc.labor_cost_brl) as labor_cost_brl,
  SUM(rc.maintenance_cost_brl) as maintenance_cost_brl,
  SUM(rc.toll_cost_brl) as toll_cost_brl,
  SUM(rc.fixed_cost_brl) as fixed_cost_brl,
  SUM(rc.passengers_transported) as total_passengers,
  AVG(rc.cost_per_passenger_brl) as avg_cost_per_passenger_brl,
  SUM(rc.distance_km) as total_distance_km
FROM public.routes r
LEFT JOIN public.route_costs rc ON rc.route_id = r.id
GROUP BY r.id, r.name, r.transportadora_id, r.company_id, DATE_TRUNC('month', rc.cost_date);

-- Atualizar view v_operator_routes_secure para usar transportadora_id
CREATE OR REPLACE VIEW public.v_operator_routes_secure AS
SELECT
  r.id,
  r.name,
  r.company_id,
  r.transportadora_id,
  COUNT(DISTINCT t.id) as total_trips,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_trips,
  AVG(EXTRACT(EPOCH FROM (t.completed_at - t.scheduled_at))/60) FILTER (WHERE t.status = 'completed') as avg_delay_minutes,
  c.name as carrier_name
FROM routes r
LEFT JOIN trips t ON t.route_id = r.id
LEFT JOIN companies c ON c.id = r.transportadora_id
WHERE company_ownership(r.company_id)
GROUP BY r.id, r.name, r.company_id, r.transportadora_id, c.name;

-- Comentários para documentação
COMMENT ON VIEW public.v_carrier_expiring_documents IS 'View unificada de documentos e exames próximos do vencimento para alertas - usa transportadora_id';
COMMENT ON VIEW public.v_carrier_vehicle_costs_summary IS 'Resumo mensal de custos por veículo agrupados por categoria - usa transportadora_id';
COMMENT ON VIEW public.v_carrier_route_costs_summary IS 'Resumo mensal de custos por rota com métricas de rentabilidade - usa transportadora_id';

