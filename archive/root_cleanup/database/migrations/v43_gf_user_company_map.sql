-- Migration: v43_gf_user_company_map
-- Tabela de vínculo usuário↔empresa para multi-tenant

create table if not exists public.gf_user_company_map(
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(user_id, company_id)
);

alter table public.gf_user_company_map enable row level security;

-- Policy: usuários só veem seus próprios mapeamentos
drop policy if exists user_own_mappings on public.gf_user_company_map;
create policy user_own_mappings on public.gf_user_company_map
  for select using (user_id = auth.uid());

-- Índice para performance
create index if not exists idx_gf_user_company_map_user on public.gf_user_company_map(user_id);
create index if not exists idx_gf_user_company_map_company on public.gf_user_company_map(company_id);

-- Seed inicial: mapear usuários operadores existentes via users.company_id
insert into public.gf_user_company_map(user_id, company_id)
select id, company_id 
from public.users 
where role = 'operator' and company_id is not null
on conflict (user_id, company_id) do nothing;
