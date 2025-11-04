-- Migration: v43_operator_secure_views
-- Views seguras que filtram por company_ownership() para multi-tenant

-- ============================================
-- V_MY_COMPANIES: lista empresas do auth.uid()
-- ============================================
create or replace view public.v_my_companies as
select 
  c.id, 
  c.name, 
  c.role, 
  cb.logo_url, 
  cb.primary_hex, 
  cb.accent_hex,
  cb.name as branding_name
from public.companies c
join public.gf_user_company_map ucm on ucm.company_id = c.id
left join public.gf_company_branding cb on cb.company_id = c.id
where ucm.user_id = auth.uid();

-- ============================================
-- V_OPERATOR_DASHBOARD_KPIS_SECURE
-- ============================================
create or replace view public.v_operator_dashboard_kpis_secure as
select
  c.id as company_id,
  count(distinct t.id) filter (where date(t.scheduled_at) = current_date) as trips_today,
  count(distinct t.id) filter (where t.status = 'inProgress') as trips_in_progress,
  count(distinct t.id) filter (where t.status = 'completed') as trips_completed,
  count(distinct t.id) filter (where t.status = 'completed' and t.completed_at > t.scheduled_at + interval '5 minutes') as delays_over_5min,
  coalesce(avg(
    (
      select count(*)::numeric 
      from trip_passengers tp 
      where tp.trip_id = t.id
    )
  ) filter (where t.status = 'inProgress'), 0) as avg_occupancy,
  coalesce(sum(il.amount) filter (where date(i.created_at) = current_date), 0) as daily_cost,
  case 
    when count(distinct t.id) filter (where date(t.scheduled_at) = current_date and t.status = 'completed') > 0
    then (
      count(distinct t.id) filter (where date(t.scheduled_at) = current_date and t.status = 'completed' and t.completed_at <= t.scheduled_at + interval '5 minutes')::numeric /
      nullif(count(distinct t.id) filter (where date(t.scheduled_at) = current_date and t.status = 'completed'), 0)
    ) * 100
    else 0
  end as sla_d0
from companies c
left join routes r on r.company_id = c.id
left join trips t on t.route_id = r.id
left join gf_invoice_lines il on il.route_id = r.id
left join gf_invoices i on i.id = il.invoice_id
where company_ownership(c.id)
group by c.id;

-- ============================================
-- V_OPERATOR_ROUTES_SECURE
-- ============================================
create or replace view public.v_operator_routes_secure as
select
  r.id,
  r.name,
  r.company_id,
  r.carrier_id,
  count(distinct t.id) as total_trips,
  count(distinct t.id) filter (where t.status = 'completed') as completed_trips,
  avg(extract(epoch from (t.completed_at - t.scheduled_at))/60) filter (where t.status = 'completed') as avg_delay_minutes,                                     
  c.name as carrier_name
from routes r
left join trips t on t.route_id = r.id
left join companies c on c.id = r.carrier_id
where company_ownership(r.company_id)
group by r.id, r.name, r.company_id, r.carrier_id, c.name;

-- ============================================
-- V_OPERATOR_ALERTS_SECURE
-- ============================================
create or replace view public.v_operator_alerts_secure as
select
  a.id,
  a.severity,
  a.alert_type as type,
  a.message,
  a.company_id,
  a.created_at,
  a.is_resolved
from gf_alerts a
where company_ownership(a.company_id)
  and a.created_at >= now() - interval '30 days';

-- ============================================
-- V_OPERATOR_COSTS_SECURE
-- ============================================
create or replace view public.v_operator_costs_secure as
select 
  r.company_id, 
  r.id as route_id, 
  r.name as route_name,
  date_trunc('month', i.created_at) as period,
  sum(il.amount) as total_cost,
  sum(il.discrepancy) as total_discrepancy,
  sum(il.measured_km) as total_measured_km,
  sum(il.invoiced_km) as total_invoiced_km,
  sum(il.measured_trips) as total_measured_trips,
  sum(il.invoiced_trips) as total_invoiced_trips
from gf_invoice_lines il
join gf_invoices i on i.id = il.invoice_id
join routes r on r.id = il.route_id
where company_ownership(r.company_id)
group by r.company_id, r.id, r.name, date_trunc('month', i.created_at);

-- ============================================
-- V_REPORTS_DELAYS_SECURE
-- ============================================
create or replace view public.v_reports_delays_secure as
select 
  r.company_id,
  date_trunc('day', t.scheduled_at) as date,
  count(distinct t.id) as total_trips,
  count(distinct t.id) filter (where t.completed_at > t.scheduled_at + interval '5 minutes') as delayed_trips,
  avg(extract(epoch from (t.completed_at - t.scheduled_at))/60) filter (where t.completed_at > t.scheduled_at) as avg_delay_minutes
from trips t
join routes r on r.id = t.route_id
where company_ownership(r.company_id)
  and t.status = 'completed'
group by r.company_id, date_trunc('day', t.scheduled_at);

-- ============================================
-- V_REPORTS_OCCUPANCY_SECURE
-- ============================================
create or replace view public.v_reports_occupancy_secure as
select 
  r.company_id,
  date_trunc('day', t.scheduled_at) as date,
  avg(
    (select count(*)::numeric from trip_passengers tp where tp.trip_id = t.id)
  ) as avg_occupancy,
  max(
    (select count(*)::numeric from trip_passengers tp where tp.trip_id = t.id)
  ) as max_occupancy
from trips t
join routes r on r.id = t.route_id
where company_ownership(r.company_id)
  and t.status = 'completed'
group by r.company_id, date_trunc('day', t.scheduled_at);

-- ============================================
-- V_REPORTS_NOT_BOARDED_SECURE
-- ============================================
create or replace view public.v_reports_not_boarded_secure as
select 
  r.company_id,
  date_trunc('day', t.scheduled_at) as date,
  count(*) filter (where tp.passenger_id is not null) as not_boarded_count
from trips t
join routes r on r.id = t.route_id
left join trip_passengers tp on tp.trip_id = t.id
where company_ownership(r.company_id)
  and t.status = 'completed'
group by r.company_id, date_trunc('day', t.scheduled_at);

-- ============================================
-- V_REPORTS_EFFICIENCY_SECURE
-- ============================================
create or replace view public.v_reports_efficiency_secure as
select 
  r.company_id,
  date_trunc('week', t.scheduled_at) as week,
  count(distinct t.id) as total_trips,
  sum(
    extract(epoch from (t.completed_at - t.scheduled_at))/60
  ) filter (where t.status = 'completed') as total_duration_minutes,
  count(distinct r.id) as active_routes
from trips t
join routes r on r.id = t.route_id
where company_ownership(r.company_id)
  and t.status = 'completed'
group by r.company_id, date_trunc('week', t.scheduled_at);

-- ============================================
-- V_REPORTS_ROI_SLA_SECURE
-- ============================================
create or replace view public.v_reports_roi_sla_secure as
select 
  r.company_id,
  date_trunc('month', t.scheduled_at) as month,
  count(distinct t.id) as total_trips,
  count(distinct t.id) filter (where t.status = 'completed' and t.completed_at <= t.scheduled_at + interval '5 minutes') as on_time_trips,
  (
    count(distinct t.id) filter (where t.status = 'completed' and t.completed_at <= t.scheduled_at + interval '5 minutes')::numeric /
    nullif(count(distinct t.id) filter (where t.status = 'completed'), 0)
  ) * 100 as sla_percentage,
  sum(il.amount) as total_cost
from trips t
join routes r on r.id = t.route_id
left join gf_invoice_lines il on il.route_id = r.id
left join gf_invoices i on i.id = il.invoice_id and date_trunc('month', i.created_at) = date_trunc('month', t.scheduled_at)
where company_ownership(r.company_id)
  and t.status = 'completed'
group by r.company_id, date_trunc('month', t.scheduled_at);
