-- Migration: Report Scheduling Tables
-- v43_report_scheduling.sql
-- Tabelas para agendamento e histórico de relatórios

-- Tabela de agendamentos
create table if not exists public.gf_report_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_key varchar(50) not null,
  cron varchar(50) not null, -- formato cron: "0 9 * * 1" (segunda-feira às 9h)
  recipients text[] not null default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references public.users(id),
  constraint valid_report_key check (report_key in ('delays', 'occupancy', 'not_boarded', 'efficiency', 'driver_ranking'))
);

-- Tabela de histórico de execuções
create table if not exists public.gf_report_history (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references public.gf_report_schedules(id) on delete set null,
  company_id uuid not null references public.companies(id) on delete cascade,
  report_key varchar(50) not null,
  generated_at timestamptz not null default now(),
  file_url text,
  file_storage_path text,
  status varchar(20) not null default 'pending', -- pending, completed, failed
  error_message text,
  recipients text[],
  format varchar(10) not null default 'csv', -- csv, excel, pdf
  record_count int,
  file_size_bytes bigint,
  constraint valid_report_key check (report_key in ('delays', 'occupancy', 'not_boarded', 'efficiency', 'driver_ranking')),
  constraint valid_status check (status in ('pending', 'completed', 'failed')),
  constraint valid_format check (format in ('csv', 'excel', 'pdf'))
);

-- Índices
create index if not exists idx_gf_report_schedules_company on public.gf_report_schedules(company_id);
create index if not exists idx_gf_report_schedules_active on public.gf_report_schedules(is_active) where is_active = true;
create index if not exists idx_gf_report_history_company on public.gf_report_history(company_id);
create index if not exists idx_gf_report_history_schedule on public.gf_report_history(schedule_id);
create index if not exists idx_gf_report_history_generated on public.gf_report_history(generated_at desc);
create index if not exists idx_gf_report_history_status on public.gf_report_history(status);

-- Trigger para updated_at
create or replace function update_gf_report_schedules_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_gf_report_schedules_updated_at
  before update on public.gf_report_schedules
  for each row
  execute function update_gf_report_schedules_updated_at();

-- RLS
alter table public.gf_report_schedules enable row level security;
alter table public.gf_report_history enable row level security;

-- Políticas RLS para admin bypass
create policy "Admin can manage all report schedules"
  on public.gf_report_schedules
  for all
  using (
    auth.role() = 'admin' or
    (current_setting('request.jwt.claims', true)::json ->> 'role')::text = 'admin'
  );

create policy "Admin can view all report history"
  on public.gf_report_history
  for select
  using (
    auth.role() = 'admin' or
    (current_setting('request.jwt.claims', true)::json ->> 'role')::text = 'admin'
  );

-- Políticas por company_id
create policy "Users can manage schedules for their company"
  on public.gf_report_schedules
  for all
  using (
    company_id in (
      select company_id from public.users
      where id = auth.uid()
    )
  );

create policy "Users can view history for their company"
  on public.gf_report_history
  for select
  using (
    company_id in (
      select company_id from public.users
      where id = auth.uid()
    )
  );

-- Comentários
comment on table public.gf_report_schedules is 'Agendamentos de relatórios automáticos';
comment on table public.gf_report_history is 'Histórico de execuções de relatórios agendados';
comment on column public.gf_report_schedules.cron is 'Expressão cron (ex: "0 9 * * 1" = segunda-feira às 9h)';
comment on column public.gf_report_history.file_storage_path is 'Caminho no Supabase Storage (ex: reports/2024/01/relatorio_123.xlsx)';
