-- Migration: v43_operator_rls_complete
-- RLS completa (SELECT + INSERT/UPDATE/DELETE com WITH CHECK) para todas as tabelas do operador
-- Usa função company_ownership() para consistência

-- ============================================
-- ROUTES
-- ============================================
alter table public.routes enable row level security;

drop policy if exists operator_select_routes on public.routes;
create policy operator_select_routes on public.routes
  for select using (company_ownership(company_id));

drop policy if exists operator_write_routes on public.routes;
create policy operator_write_routes on public.routes
  for all using (company_ownership(company_id))
  with check (company_ownership(company_id));

-- ============================================
-- TRIPS
-- ============================================
alter table public.trips enable row level security;

drop policy if exists operator_select_trips on public.trips;
create policy operator_select_trips on public.trips
  for select using (
    route_id in (
      select id from public.routes 
      where company_ownership(company_id)
    )
  );

drop policy if exists operator_write_trips on public.trips;
create policy operator_write_trips on public.trips
  for all using (
    route_id in (
      select id from public.routes 
      where company_ownership(company_id)
    )
  )
  with check (
    route_id in (
      select id from public.routes 
      where company_ownership(company_id)
    )
  );

-- ============================================
-- GF_EMPLOYEE_COMPANY
-- ============================================
alter table public.gf_employee_company enable row level security;

drop policy if exists operator_select_employees on public.gf_employee_company;
create policy operator_select_employees on public.gf_employee_company
  for select using (company_ownership(company_id));

drop policy if exists operator_write_employees on public.gf_employee_company;
create policy operator_write_employees on public.gf_employee_company
  for all using (company_ownership(company_id))
  with check (company_ownership(company_id));

-- ============================================
-- GF_ALERTS
-- ============================================
alter table public.gf_alerts enable row level security;

drop policy if exists operator_select_alerts on public.gf_alerts;
create policy operator_select_alerts on public.gf_alerts
  for select using (company_ownership(company_id));

drop policy if exists operator_write_alerts on public.gf_alerts;
create policy operator_write_alerts on public.gf_alerts
  for all using (company_ownership(company_id))
  with check (company_ownership(company_id));

-- ============================================
-- GF_SERVICE_REQUESTS (Socorro)
-- ============================================
alter table public.gf_service_requests enable row level security;

drop policy if exists operator_select_service_requests on public.gf_service_requests;
create policy operator_select_service_requests on public.gf_service_requests
  for select using (company_ownership(empresa_id));

drop policy if exists operator_write_service_requests on public.gf_service_requests;
create policy operator_write_service_requests on public.gf_service_requests
  for all using (company_ownership(empresa_id))
  with check (company_ownership(empresa_id));

-- ============================================
-- GF_INVOICES
-- ============================================
alter table public.gf_invoices enable row level security;

drop policy if exists operator_select_invoices on public.gf_invoices;
create policy operator_select_invoices on public.gf_invoices
  for select using (company_ownership(empresa_id));

drop policy if exists operator_write_invoices on public.gf_invoices;
create policy operator_write_invoices on public.gf_invoices
  for all using (company_ownership(empresa_id))
  with check (company_ownership(empresa_id));

-- ============================================
-- GF_INVOICE_LINES
-- ============================================
alter table public.gf_invoice_lines enable row level security;

drop policy if exists operator_select_invoice_lines on public.gf_invoice_lines;
create policy operator_select_invoice_lines on public.gf_invoice_lines
  for select using (
    invoice_id in (
      select id from public.gf_invoices 
      where company_ownership(empresa_id)
    )
  );

drop policy if exists operator_write_invoice_lines on public.gf_invoice_lines;
create policy operator_write_invoice_lines on public.gf_invoice_lines
  for all using (
    invoice_id in (
      select id from public.gf_invoices 
      where company_ownership(empresa_id)
    )
  )
  with check (
    invoice_id in (
      select id from public.gf_invoices 
      where company_ownership(empresa_id)
    )
  );

-- ============================================
-- GF_OPERATOR_SETTINGS
-- ============================================
alter table public.gf_operator_settings enable row level security;

drop policy if exists operator_select_settings on public.gf_operator_settings;
create policy operator_select_settings on public.gf_operator_settings
  for select using (company_ownership(empresa_id));

drop policy if exists operator_write_settings on public.gf_operator_settings;
create policy operator_write_settings on public.gf_operator_settings
  for all using (company_ownership(empresa_id))
  with check (company_ownership(empresa_id));

-- ============================================
-- GF_COST_CENTERS
-- ============================================
alter table public.gf_cost_centers enable row level security;

drop policy if exists operator_select_cost_centers on public.gf_cost_centers;
create policy operator_select_cost_centers on public.gf_cost_centers
  for select using (company_ownership(company_id));

drop policy if exists operator_write_cost_centers on public.gf_cost_centers;
create policy operator_write_cost_centers on public.gf_cost_centers
  for all using (company_ownership(company_id))
  with check (company_ownership(company_id));

-- ============================================
-- GF_OPERATOR_INCIDENTS
-- ============================================
alter table public.gf_operator_incidents enable row level security;

drop policy if exists operator_select_incidents on public.gf_operator_incidents;
create policy operator_select_incidents on public.gf_operator_incidents
  for select using (company_ownership(empresa_id));

drop policy if exists operator_write_incidents on public.gf_operator_incidents;
create policy operator_write_incidents on public.gf_operator_incidents
  for all using (company_ownership(empresa_id))
  with check (company_ownership(empresa_id));

-- ============================================
-- GF_ASSIGNED_CARRIERS (read-only para operador)
-- ============================================
alter table public.gf_assigned_carriers enable row level security;

drop policy if exists operator_select_assigned_carriers on public.gf_assigned_carriers;
create policy operator_select_assigned_carriers on public.gf_assigned_carriers
  for select using (company_ownership(empresa_id));

-- Operador NÃO pode modificar assigned_carriers (admin apenas)

-- ============================================
-- GF_ANNOUNCEMENTS
-- ============================================
alter table public.gf_announcements enable row level security;

drop policy if exists operator_select_announcements on public.gf_announcements;
create policy operator_select_announcements on public.gf_announcements
  for select using (company_ownership(empresa_id));

drop policy if exists operator_write_announcements on public.gf_announcements;
create policy operator_write_announcements on public.gf_announcements
  for all using (company_ownership(empresa_id))
  with check (company_ownership(empresa_id));

-- ============================================
-- GF_ANNOUNCEMENT_TEMPLATES
-- ============================================
alter table public.gf_announcement_templates enable row level security;

drop policy if exists operator_select_templates on public.gf_announcement_templates;
create policy operator_select_templates on public.gf_announcement_templates
  for select using (company_ownership(empresa_id));

drop policy if exists operator_write_templates on public.gf_announcement_templates;
create policy operator_write_templates on public.gf_announcement_templates
  for all using (company_ownership(empresa_id))
  with check (company_ownership(empresa_id));

-- ============================================
-- GF_ANNOUNCEMENT_READS
-- ============================================
alter table public.gf_announcement_reads enable row level security;

drop policy if exists operator_modify_reads on public.gf_announcement_reads;
create policy operator_modify_reads on public.gf_announcement_reads
  for all using (
    announcement_id in (
      select id from public.gf_announcements 
      where company_ownership(empresa_id)
    )
    or user_id = auth.uid()
  )
  with check (
    announcement_id in (
      select id from public.gf_announcements 
      where company_ownership(empresa_id)
    )
    or user_id = auth.uid()
  );

-- ============================================
-- GF_HOLIDAYS
-- ============================================
alter table public.gf_holidays enable row level security;

drop policy if exists operator_select_holidays on public.gf_holidays;
create policy operator_select_holidays on public.gf_holidays
  for select using (company_ownership(company_id));

drop policy if exists operator_write_holidays on public.gf_holidays;
create policy operator_write_holidays on public.gf_holidays
  for all using (company_ownership(company_id))
  with check (company_ownership(company_id));

-- ============================================
-- GF_OPERATOR_AUDITS
-- ============================================
alter table public.gf_operator_audits enable row level security;

drop policy if exists operator_select_audits on public.gf_operator_audits;
create policy operator_select_audits on public.gf_operator_audits
  for select using (company_ownership(empresa_id));

drop policy if exists operator_write_audits on public.gf_operator_audits;
create policy operator_write_audits on public.gf_operator_audits
  for all using (company_ownership(empresa_id))
  with check (company_ownership(empresa_id));

-- ============================================
-- GF_OPERATOR_DOCUMENTS
-- ============================================
alter table public.gf_operator_documents enable row level security;

drop policy if exists operator_select_documents on public.gf_operator_documents;
create policy operator_select_documents on public.gf_operator_documents
  for select using (company_ownership(empresa_id));

drop policy if exists operator_write_documents on public.gf_operator_documents;
create policy operator_write_documents on public.gf_operator_documents
  for all using (company_ownership(empresa_id))
  with check (company_ownership(empresa_id));
