-- ============================================
-- GolfFox v44.0 - Views de Agregação de Custos
-- ============================================

-- 1. VIEW: KPIs Principais de Custos
-- ============================================
CREATE OR REPLACE VIEW public.v_costs_kpis AS
SELECT 
  c.company_id,
  comp.name AS company_name,
  -- Custo Total
  COALESCE(SUM(c.amount), 0) AS total_cost,
  -- Custo por KM (soma de custos / soma de km medidos)
  CASE 
    WHEN COALESCE(SUM(vc.km), 0) > 0 
    THEN COALESCE(SUM(c.amount), 0) / SUM(vc.km)
    ELSE 0
  END AS cost_per_km,
  -- Custo por Viagem
  CASE 
    WHEN COUNT(DISTINCT t.id) > 0
    THEN COALESCE(SUM(c.amount), 0) / COUNT(DISTINCT t.id)
    ELSE 0
  END AS cost_per_trip,
  -- Custo por Passageiro
  CASE 
    WHEN COALESCE(SUM(tp_count.count), 0) > 0
    THEN COALESCE(SUM(c.amount), 0) / SUM(tp_count.count)
    ELSE 0
  END AS cost_per_passenger,
  -- KM Medidos
  COALESCE(SUM(vc.km), 0) AS total_km,
  -- Viagens
  COUNT(DISTINCT t.id) AS total_trips,
  -- Passageiros Transportados
  COALESCE(SUM(tp_count.count), 0) AS total_passengers,
  -- Últimos 30 dias
  COALESCE(SUM(c.amount) FILTER (WHERE c.date >= CURRENT_DATE - INTERVAL '30 days'), 0) AS total_cost_30d,
  -- Últimos 90 dias
  COALESCE(SUM(c.amount) FILTER (WHERE c.date >= CURRENT_DATE - INTERVAL '90 days'), 0) AS total_cost_90d
FROM public.gf_costs c
JOIN public.companies comp ON comp.id = c.company_id
LEFT JOIN public.gf_vehicle_costs vc ON vc.vehicle_id = c.vehicle_id 
  AND DATE_TRUNC('day', vc.date) = DATE_TRUNC('day', c.date)
LEFT JOIN public.trips t ON t.route_id = c.route_id 
  AND DATE_TRUNC('day', t.scheduled_at) = DATE_TRUNC('day', c.date)
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS count
  FROM public.trip_passengers tp
  WHERE tp.trip_id = t.id
) tp_count ON true
GROUP BY c.company_id, comp.name;

COMMENT ON VIEW public.v_costs_kpis IS 'KPIs principais de custos: total, custo/km, custo/viagem, custo/passageiro, últimos 30/90 dias';

-- 2. VIEW: Breakdown por Grupo/Categoria/Subcategoria
-- ============================================
CREATE OR REPLACE VIEW public.v_costs_breakdown AS
SELECT 
  c.company_id,
  comp.name AS company_name,
  cat.group_name,
  cat.category,
  cat.subcategory,
  DATE_TRUNC('month', c.date) AS period_month,
  EXTRACT(YEAR FROM c.date) AS period_year,
  COUNT(*) AS cost_records,
  COALESCE(SUM(c.amount), 0) AS total_amount,
  COALESCE(AVG(c.amount), 0) AS avg_amount,
  MIN(c.amount) AS min_amount,
  MAX(c.amount) AS max_amount,
  COALESCE(SUM(c.qty), 0) AS total_qty
FROM public.gf_costs c
JOIN public.companies comp ON comp.id = c.company_id
JOIN public.gf_cost_categories cat ON cat.id = c.cost_category_id
WHERE cat.is_active = true
GROUP BY 
  c.company_id, 
  comp.name, 
  cat.group_name, 
  cat.category, 
  cat.subcategory,
  DATE_TRUNC('month', c.date),
  EXTRACT(YEAR FROM c.date);

COMMENT ON VIEW public.v_costs_breakdown IS 'Breakdown hierárquico de custos: grupo → categoria → subcategoria por período';

-- 3. VIEW: Realizado vs Orçamento
-- ============================================
CREATE OR REPLACE VIEW public.v_costs_vs_budget AS
SELECT 
  comp.id AS company_id,
  comp.name AS company_name,
  COALESCE(
    DATE_PART('month', c.date), 
    b.period_month
  ) AS period_month,
  COALESCE(
    EXTRACT(YEAR FROM c.date), 
    b.period_year
  ) AS period_year,
  COALESCE(cat.group_name, cat_budget.group_name) AS group_name,
  COALESCE(cat.category, cat_budget.category) AS category,
  COALESCE(cat.id, b.category_id) AS category_id,
  -- Realizado
  COALESCE(SUM(c.amount), 0) AS actual_amount,
  -- Orçado
  COALESCE(SUM(b.amount_budgeted), 0) AS budgeted_amount,
  -- Variação Absoluta
  COALESCE(SUM(c.amount), 0) - COALESCE(SUM(b.amount_budgeted), 0) AS variance_absolute,
  -- Variação Percentual
  CASE 
    WHEN COALESCE(SUM(b.amount_budgeted), 0) > 0
    THEN ((COALESCE(SUM(c.amount), 0) - COALESCE(SUM(b.amount_budgeted), 0)) / SUM(b.amount_budgeted)) * 100
    ELSE NULL
  END AS variance_percent,
  -- YTD Realizado
  COALESCE(SUM(c.amount) FILTER (
    WHERE EXTRACT(YEAR FROM c.date) = EXTRACT(YEAR FROM CURRENT_DATE)
  ), 0) AS ytd_actual,
  -- YTD Orçado
  COALESCE(SUM(b.amount_budgeted) FILTER (
    WHERE b.period_year = EXTRACT(YEAR FROM CURRENT_DATE)
  ), 0) AS ytd_budgeted
FROM public.companies comp
LEFT JOIN public.gf_costs c ON c.company_id = comp.id
LEFT JOIN public.gf_cost_categories cat ON cat.id = c.cost_category_id
LEFT JOIN public.gf_budgets b ON b.company_id = comp.id 
  AND (DATE_PART('month', c.date) = b.period_month OR c.date IS NULL)
  AND (EXTRACT(YEAR FROM c.date) = b.period_year OR c.date IS NULL)
  AND (cat.id = b.category_id OR b.category_id IS NULL OR cat.id IS NULL)
LEFT JOIN public.gf_cost_categories cat_budget ON cat_budget.id = b.category_id
GROUP BY 
  comp.id,
  comp.name,
  COALESCE(DATE_PART('month', c.date), b.period_month),
  COALESCE(EXTRACT(YEAR FROM c.date), b.period_year),
  COALESCE(cat.group_name, cat_budget.group_name),
  COALESCE(cat.category, cat_budget.category),
  COALESCE(cat.id, b.category_id);

COMMENT ON VIEW public.v_costs_vs_budget IS 'Comparativo realizado vs orçamento por empresa, período e categoria (mensal e YTD)';

-- 4. VIEW: Conciliação Medido vs Faturado
-- ============================================
CREATE OR REPLACE VIEW public.v_costs_conciliation AS
SELECT 
  c.company_id,
  comp.name AS company_name,
  c.route_id,
  r.name AS route_name,
  c.vehicle_id,
  v.plate AS vehicle_plate,
  i.id AS invoice_id,
  i.invoice_number,
  il.id AS invoice_line_id,
  -- Medido (do sistema)
  COALESCE(SUM(vc.km), 0) AS measured_km,
  COALESCE(SUM(EXTRACT(EPOCH FROM (t.completed_at - t.started_at)) / 3600), 0) AS measured_hours,
  COUNT(DISTINCT t.id) AS measured_trips,
  -- Faturado (da fatura)
  COALESCE(SUM(il.invoiced_km), 0) AS invoiced_km,
  COALESCE(SUM(il.invoiced_time), 0) AS invoiced_hours,
  COALESCE(SUM(il.trip_count), 0) AS invoiced_trips,
  -- Valores
  COALESCE(SUM(c.amount), 0) AS measured_amount,
  COALESCE(SUM(il.amount), 0) AS invoiced_amount,
  -- Divergências
  COALESCE(SUM(il.invoiced_km), 0) - COALESCE(SUM(vc.km), 0) AS discrepancy_km,
  COALESCE(SUM(il.invoiced_hours), 0) - COALESCE(SUM(EXTRACT(EPOCH FROM (t.completed_at - t.started_at)) / 3600), 0) AS discrepancy_hours,
  COALESCE(SUM(il.trip_count), 0) - COUNT(DISTINCT t.id) AS discrepancy_trips,
  COALESCE(SUM(il.amount), 0) - COALESCE(SUM(c.amount), 0) AS discrepancy_amount,
  -- Percentual de Divergência
  CASE 
    WHEN COALESCE(SUM(c.amount), 0) > 0
    THEN ABS((COALESCE(SUM(il.amount), 0) - COALESCE(SUM(c.amount), 0)) / SUM(c.amount)) * 100
    ELSE 0
  END AS discrepancy_percent,
  -- Flag de Divergência Significativa (>5% ou >R$100)
  CASE 
    WHEN ABS(COALESCE(SUM(il.amount), 0) - COALESCE(SUM(c.amount), 0)) > 100
      OR (COALESCE(SUM(c.amount), 0) > 0 
          AND ABS((COALESCE(SUM(il.amount), 0) - COALESCE(SUM(c.amount), 0)) / SUM(c.amount)) * 100 > 5)
    THEN true
    ELSE false
  END AS has_significant_discrepancy,
  -- Status de Conciliação
  COALESCE(i.reconciliation_status, 'pending') AS reconciliation_status,
  i.period_start,
  i.period_end
FROM public.gf_costs c
JOIN public.companies comp ON comp.id = c.company_id
LEFT JOIN public.routes r ON r.id = c.route_id
LEFT JOIN public.vehicles v ON v.id = c.vehicle_id
LEFT JOIN public.gf_invoices i ON i.id = c.invoice_id
LEFT JOIN public.gf_invoice_lines il ON il.invoice_id = i.id AND il.route_id = c.route_id
LEFT JOIN public.gf_vehicle_costs vc ON vc.vehicle_id = c.vehicle_id 
  AND vc.route_id = c.route_id
  AND DATE_TRUNC('day', vc.date) >= i.period_start 
  AND DATE_TRUNC('day', vc.date) <= i.period_end
LEFT JOIN public.trips t ON t.route_id = c.route_id 
  AND t.vehicle_id = c.vehicle_id
  AND DATE_TRUNC('day', t.scheduled_at) >= i.period_start
  AND DATE_TRUNC('day', t.scheduled_at) <= i.period_end
WHERE c.source = 'invoice' OR c.invoice_id IS NOT NULL
GROUP BY 
  c.company_id,
  comp.name,
  c.route_id,
  r.name,
  c.vehicle_id,
  v.plate,
  i.id,
  i.invoice_number,
  il.id,
  i.reconciliation_status,
  i.period_start,
  i.period_end;

COMMENT ON VIEW public.v_costs_conciliation IS 'Conciliação medido vs faturado com cálculo de divergências e flags de significância (>5% ou >R$100)';

-- 5. VIEW: Custos Seguros (com RLS aplicado)
-- ============================================
CREATE OR REPLACE VIEW public.v_costs_secure AS
SELECT 
  c.*,
  comp.name AS company_name,
  car.name AS carrier_name,
  r.name AS route_name,
  v.plate AS vehicle_plate,
  v.model AS vehicle_model,
  u.email AS driver_email,
  cat.group_name,
  cat.category,
  cat.subcategory,
  cc.name AS cost_center_name
FROM public.gf_costs c
JOIN public.companies comp ON comp.id = c.company_id
LEFT JOIN public.carriers car ON car.id = c.carrier_id
LEFT JOIN public.routes r ON r.id = c.route_id
LEFT JOIN public.vehicles v ON v.id = c.vehicle_id
LEFT JOIN public.users u ON u.id = c.driver_id
JOIN public.gf_cost_categories cat ON cat.id = c.cost_category_id
LEFT JOIN public.gf_cost_centers cc ON cc.id = c.cost_center_id
WHERE cat.is_active = true;

COMMENT ON VIEW public.v_costs_secure IS 'View segura de custos com joins para nomes (RLS aplicado via tabela base)';

