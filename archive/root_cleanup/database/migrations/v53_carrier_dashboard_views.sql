-- ============================================================================
-- v53_carrier_dashboard_views.sql
-- Views para dashboard do painel da transportadora
-- ============================================================================

-- View: Vencimentos próximos (documentos e exames)
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
  u.carrier_id
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
  u.carrier_id
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
  v.carrier_id
FROM public.vehicle_documents vd
JOIN public.vehicles v ON v.id = vd.vehicle_id
WHERE vd.expiry_date IS NOT NULL;

-- View: Custos consolidados por veículo
CREATE OR REPLACE VIEW public.v_carrier_vehicle_costs_summary AS
SELECT 
  v.id as vehicle_id,
  v.plate,
  v.model,
  v.carrier_id,
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
GROUP BY v.id, v.plate, v.model, v.carrier_id, DATE_TRUNC('month', vc.cost_date);

-- View: Custos consolidados por rota
CREATE OR REPLACE VIEW public.v_carrier_route_costs_summary AS
SELECT 
  r.id as route_id,
  r.name as route_name,
  r.carrier_id,
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
GROUP BY r.id, r.name, r.carrier_id, r.company_id, DATE_TRUNC('month', rc.cost_date);

-- Habilitar Realtime nas tabelas relacionadas (se ainda não habilitado)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Tabelas já devem estar habilitadas, mas garantimos aqui
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.driver_positions;
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.trips;
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.trip_passengers;
  END IF;
END $$;

-- Função auxiliar para contar passageiros de uma viagem
CREATE OR REPLACE FUNCTION get_trip_passenger_count(p_trip_id uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer FROM public.trip_passengers WHERE trip_id = p_trip_id
$$ LANGUAGE sql STABLE;

-- Comentários para documentação
COMMENT ON VIEW public.v_carrier_expiring_documents IS 'View unificada de documentos e exames próximos do vencimento para alertas';
COMMENT ON VIEW public.v_carrier_vehicle_costs_summary IS 'Resumo mensal de custos por veículo agrupados por categoria';
COMMENT ON VIEW public.v_carrier_route_costs_summary IS 'Resumo mensal de custos por rota com métricas de rentabilidade';
COMMENT ON FUNCTION get_trip_passenger_count IS 'Retorna a quantidade de passageiros embarcados em uma viagem';

