-- Script para adicionar colunas faltantes identificadas pelos testes do TestSprite

-- 1. Adicionar coluna is_active à tabela companies (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN is_active BOOLEAN DEFAULT true;
    
    -- Atualizar todas as empresas existentes para ativas
    UPDATE public.companies SET is_active = true WHERE is_active IS NULL;
    
    COMMENT ON COLUMN public.companies.is_active IS 'Indica se a empresa está ativa';
  END IF;
END $$;

-- 2. Adicionar coluna cpf à tabela users (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'cpf'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN cpf TEXT;
    
    -- Criar índice para busca por CPF
    CREATE INDEX IF NOT EXISTS idx_users_cpf ON public.users(cpf) WHERE cpf IS NOT NULL;
    
    COMMENT ON COLUMN public.users.cpf IS 'CPF do usuário (opcional)';
  END IF;
END $$;

-- 3. Verificar e criar views de KPIs do admin (se não existirem)
-- View para KPIs do admin dashboard
-- Nota: Ajustado para usar colunas que realmente existem nas tabelas
CREATE OR REPLACE VIEW public.v_admin_dashboard_kpis AS
SELECT 
  COUNT(DISTINCT c.id) as total_companies,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'operator') as total_operators,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'driver') as total_drivers,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'passenger') as total_passengers,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'inProgress') as active_trips,
  COUNT(DISTINCT v.id) FILTER (WHERE COALESCE(v.is_active, true) = true) as active_vehicles
FROM public.companies c
LEFT JOIN public.users u ON u.company_id = c.id
LEFT JOIN public.trips t ON EXISTS (
  SELECT 1 FROM public.routes r 
  WHERE r.id = t.route_id 
  AND r.company_id = c.id
)
LEFT JOIN public.vehicles v ON v.company_id = c.id
WHERE COALESCE(c.is_active, true) = true;

-- Materialized view para KPIs do admin (para performance)
DROP MATERIALIZED VIEW IF EXISTS public.mv_admin_kpis;
CREATE MATERIALIZED VIEW public.mv_admin_kpis AS
SELECT 
  COUNT(DISTINCT c.id) as total_companies,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'operator') as total_operators,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'driver') as total_drivers,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'passenger') as total_passengers,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'inProgress') as active_trips,
  COUNT(DISTINCT v.id) FILTER (WHERE COALESCE(v.is_active, true) = true) as active_vehicles,
  NOW() as last_updated
FROM public.companies c
LEFT JOIN public.users u ON u.company_id = c.id
LEFT JOIN public.trips t ON EXISTS (
  SELECT 1 FROM public.routes r 
  WHERE r.id = t.route_id 
  AND r.company_id = c.id
)
LEFT JOIN public.vehicles v ON v.company_id = c.id
WHERE COALESCE(c.is_active, true) = true;

-- Criar índice único na materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_admin_kpis_unique ON public.mv_admin_kpis (last_updated);

-- Comentários
COMMENT ON VIEW public.v_admin_dashboard_kpis IS 'View para KPIs do dashboard administrativo';
COMMENT ON MATERIALIZED VIEW public.mv_admin_kpis IS 'Materialized view para KPIs do admin (atualizada periodicamente)';

-- Grant permissions
GRANT SELECT ON public.v_admin_dashboard_kpis TO authenticated;
GRANT SELECT ON public.mv_admin_kpis TO authenticated;

