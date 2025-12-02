-- ========================================
-- Fix: Corrigir tabelas ausentes e políticas RLS
-- GolfFox Transport System - Final Fix
-- ========================================

-- Verificar e criar tabela trip_passengers se não existir
CREATE TABLE IF NOT EXISTS public.trip_passengers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES public.bus_stops(id),
    pickup_time TIMESTAMPTZ,
    dropoff_time TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'dropped_off', 'no_show')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verificar e criar tabela gf_alerts se não existir
CREATE TABLE IF NOT EXISTS public.gf_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'success')),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.trip_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para trip_passengers
DROP POLICY IF EXISTS "trip_passengers_admin_all" ON public.trip_passengers;
CREATE POLICY "trip_passengers_admin_all" ON public.trip_passengers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "trip_passengers_company_read" ON public.trip_passengers;
CREATE POLICY "trip_passengers_company_read" ON public.trip_passengers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.trips t 
        WHERE t.id = trip_passengers.trip_id 
        AND public.can_access_company_data(t.company_id)
    )
);

-- Políticas para gf_alerts
DROP POLICY IF EXISTS "gf_alerts_admin_all" ON public.gf_alerts;
CREATE POLICY "gf_alerts_admin_all" ON public.gf_alerts FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "gf_alerts_company_read" ON public.gf_alerts;
CREATE POLICY "gf_alerts_company_read" ON public.gf_alerts FOR SELECT USING (public.can_access_company_data(company_id));

-- Inserir alguns dados de teste para gf_alerts se a tabela estiver vazia
INSERT INTO public.gf_alerts (title, message, severity, is_resolved)
SELECT 
    'Sistema Operacional',
    'Sistema funcionando normalmente',
    'info',
    true
WHERE NOT EXISTS (SELECT 1 FROM public.gf_alerts LIMIT 1);

-- Verificar estrutura das tabelas
SELECT 
    'trip_passengers' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'trip_passengers'
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'gf_alerts' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'gf_alerts'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar resultado
SELECT 'Verificação e correção das tabelas concluída!' as resultado;