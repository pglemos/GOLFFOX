-- Migration: v43_company_branding
-- Tabela de branding/configuração visual por empresa

create table if not exists public.gf_company_branding(
  company_id uuid primary key references public.companies(id) on delete cascade,
  name varchar(255) not null,
  logo_url text,
  primary_hex varchar(7) default '#F97316',
  accent_hex varchar(7) default '#2E7D32',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger para updated_at
create or replace function update_gf_company_branding_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_gf_company_branding_updated_at on public.gf_company_branding;
create trigger trigger_gf_company_branding_updated_at
  before update on public.gf_company_branding
  for each row
  execute function update_gf_company_branding_updated_at();

-- RLS
alter table public.gf_company_branding enable row level security;

drop policy if exists operator_select_branding on public.gf_company_branding;
create policy operator_select_branding on public.gf_company_branding
  for select using (company_ownership(company_id));

drop policy if exists operator_update_branding on public.gf_company_branding;
create policy operator_update_branding on public.gf_company_branding
  for update using (company_ownership(company_id))
  with check (company_ownership(company_id));

drop policy if exists operator_insert_branding on public.gf_company_branding;
create policy operator_insert_branding on public.gf_company_branding
  for insert with check (company_ownership(company_id));
