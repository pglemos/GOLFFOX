-- Migration: v43_route_optimization_cache
-- Tabela de cache para resultados de otimização de rotas

create table if not exists public.gf_route_optimization_cache(
  route_id uuid primary key references public.routes(id) on delete cascade,
  optimized_order jsonb not null,
  etas jsonb not null,
  cached_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists idx_route_opt_cache_cached_at 
  on public.gf_route_optimization_cache(cached_at);

-- RLS
alter table public.gf_route_optimization_cache enable row level security;

drop policy if exists operator_select_route_cache on public.gf_route_optimization_cache;
create policy operator_select_route_cache on public.gf_route_optimization_cache
  for select using (
    route_id in (
      select id from public.routes 
      where company_ownership(company_id)
    )
  );

drop policy if exists operator_write_route_cache on public.gf_route_optimization_cache;
create policy operator_write_route_cache on public.gf_route_optimization_cache
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
