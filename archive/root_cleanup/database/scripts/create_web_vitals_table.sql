-- Cria a tabela de Web Vitals para armazenar métricas de performance
create table if not exists public.gf_web_vitals (
  id bigint generated always as identity primary key,
  url text not null,
  user_agent text,
  timestamp timestamptz not null,
  metrics jsonb not null,
  created_at timestamptz not null default now()
);

-- Índices sugeridos
create index if not exists idx_gf_web_vitals_url on public.gf_web_vitals (url);
create index if not exists idx_gf_web_vitals_timestamp on public.gf_web_vitals (timestamp);

