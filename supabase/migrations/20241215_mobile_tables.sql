-- ====================================================
-- GolfFox Mobile Integration Tables
-- Migration Date: 2025-12-15
-- ====================================================
-- Creates tables required for mobile app functionality:
-- - passenger_checkins: Check-in/out de passageiros
-- - vehicle_checklists: Checklist pré-viagem do motorista
-- - driver_locations: Rastreamento GPS em tempo real
-- - driver_messages: Chat motorista-central
-- - passenger_cancellations: Registro de não-embarques

-- ====================================================
-- PART 1: passageiro CHECK-INS
-- ====================================================
CREATE TABLE IF NOT EXISTS public.passenger_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('boarding', 'dropoff')),
    method TEXT CHECK (method IN ('qr', 'nfc', 'manual')),
    passenger_identifier TEXT, -- Código QR ou NFC do passageiro
    latitude NUMERIC,
    longitude NUMERIC,
    stop_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_passenger_checkins_trip ON public.passenger_checkins(trip_id);
CREATE INDEX IF NOT EXISTS idx_passenger_checkins_passenger ON public.passenger_checkins(passenger_id);
CREATE INDEX IF NOT EXISTS idx_passenger_checkins_driver ON public.passenger_checkins(driver_id);
CREATE INDEX IF NOT EXISTS idx_passenger_checkins_created ON public.passenger_checkins(created_at);

-- ====================================================
-- PART 2: veiculo CHECKLISTS
-- ====================================================
CREATE TABLE IF NOT EXISTS public.vehicle_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    items JSONB NOT NULL DEFAULT '[]', -- Array de {item, checked, notes}
    photos JSONB DEFAULT '[]', -- Array de URLs das fotos
    odometer_reading NUMERIC,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'incomplete')),
    completed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vehicle_checklists_trip ON public.vehicle_checklists(trip_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_checklists_driver ON public.vehicle_checklists(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_checklists_vehicle ON public.vehicle_checklists(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_checklists_status ON public.vehicle_checklists(status);

-- ====================================================
-- PART 3: motorista LOCATIONS (GPS Tracking)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.driver_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    altitude NUMERIC,
    speed NUMERIC, -- km/h
    heading NUMERIC, -- graus (0-360)
    accuracy NUMERIC, -- metros
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida da última localização
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON public.driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_trip ON public.driver_locations(trip_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded ON public.driver_locations(recorded_at DESC);

-- ====================================================
-- PART 4: motorista MESSAGES (Chat)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.driver_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    carrier_id UUID, -- Transportadora (para multitenancy)
    sender TEXT NOT NULL CHECK (sender IN ('motorista', 'central')),
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'emergency', 'delay', 'system')),
    is_emergency BOOLEAN DEFAULT false,
    metadata JSONB, -- Dados adicionais (localização, delay time, etc)
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_driver_messages_driver ON public.driver_messages(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_messages_carrier ON public.driver_messages(carrier_id);
CREATE INDEX IF NOT EXISTS idx_driver_messages_created ON public.driver_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_messages_emergency ON public.driver_messages(is_emergency) WHERE is_emergency = true;

-- ====================================================
-- PART 5: passageiro CANCELLATIONS
-- ====================================================
CREATE TABLE IF NOT EXISTS public.passenger_cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('home_office', 'folga', 'ferias', 'medico', 'outro')),
    reason_details TEXT,
    pause_notifications BOOLEAN DEFAULT false,
    pause_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_passenger_cancellations_passenger ON public.passenger_cancellations(passenger_id);
CREATE INDEX IF NOT EXISTS idx_passenger_cancellations_date ON public.passenger_cancellations(scheduled_date);

-- ====================================================
-- PART 6: passageiro EVALUATIONS (NPS)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.trip_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    passenger_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    nps_score INTEGER NOT NULL CHECK (nps_score >= 0 AND nps_score <= 10),
    tags JSONB DEFAULT '[]', -- Array de tags selecionadas
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trip_evaluations_trip ON public.trip_evaluations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_evaluations_driver ON public.trip_evaluations(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_evaluations_nps ON public.trip_evaluations(nps_score);

-- ====================================================
-- PART 7: ANNOUNCEMENTS (Mural de Avisos)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    carrier_id UUID,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'alerta', 'urgente')),
    target_role TEXT CHECK (target_role IN ('all', 'motorista', 'passageiro')),
    is_active BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_announcements_company ON public.announcements(company_id);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active, published_at DESC);

-- ====================================================
-- PART 8: RLS POLICIES
-- ====================================================

-- Enable RLS
ALTER TABLE public.passenger_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on passenger_checkins" ON public.passenger_checkins FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on vehicle_checklists" ON public.vehicle_checklists FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on driver_locations" ON public.driver_locations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on driver_messages" ON public.driver_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on passenger_cancellations" ON public.passenger_cancellations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on trip_evaluations" ON public.trip_evaluations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on announcements" ON public.announcements FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Drivers can create checkins
CREATE POLICY "Drivers can create checkins" ON public.passenger_checkins 
    FOR INSERT TO authenticated 
    WITH CHECK (driver_id = auth.uid());

-- Drivers can read their own checkins
CREATE POLICY "Drivers can read own checkins" ON public.passenger_checkins 
    FOR SELECT TO authenticated 
    USING (driver_id = auth.uid() OR passenger_id = auth.uid());

-- Drivers can manage their checklists
CREATE POLICY "Drivers can manage checklists" ON public.vehicle_checklists 
    FOR ALL TO authenticated 
    USING (driver_id = auth.uid())
    WITH CHECK (driver_id = auth.uid());

-- Drivers can insert their locations
CREATE POLICY "Drivers can insert locations" ON public.driver_locations 
    FOR INSERT TO authenticated 
    WITH CHECK (driver_id = auth.uid());

-- Users can read motorista locations for their trips
CREATE POLICY "Users can read trip locations" ON public.driver_locations 
    FOR SELECT TO authenticated 
    USING (true); -- Ajustar para company_id se necessário

-- motorista messages policies
CREATE POLICY "Drivers can manage own messages" ON public.driver_messages 
    FOR ALL TO authenticated 
    USING (driver_id = auth.uid())
    WITH CHECK (driver_id = auth.uid());

-- Passengers can cancel
CREATE POLICY "Passengers can manage cancellations" ON public.passenger_cancellations 
    FOR ALL TO authenticated 
    USING (passenger_id = auth.uid())
    WITH CHECK (passenger_id = auth.uid());

-- Passengers can create evaluations
CREATE POLICY "Passengers can create evaluations" ON public.trip_evaluations 
    FOR INSERT TO authenticated 
    WITH CHECK (passenger_id = auth.uid());

-- Users can read active announcements
CREATE POLICY "Users can read announcements" ON public.announcements 
    FOR SELECT TO authenticated 
    USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- ====================================================
-- PART 9: TRIGGERS
-- ====================================================

-- Updated_at trigger for vehicle_checklists
DROP TRIGGER IF EXISTS update_vehicle_checklists_updated_at ON public.vehicle_checklists;
CREATE TRIGGER update_vehicle_checklists_updated_at 
    BEFORE UPDATE ON public.vehicle_checklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- PART 10: UPDATE USER ROLES (PT-BR)
-- ====================================================
-- Atualizar constraint de roles para incluir PT-BR
DO $$
BEGIN
    -- Verificar se precisamos alterar a constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%role%' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
    END IF;
    
    -- Adicionar nova constraint com roles em PT e EN
    ALTER TABLE public.users ADD CONSTRAINT users_role_check 
        CHECK (role IN (
            'admin', 'operador', 'transportadora', 'motorista', 'passageiro',
            'empresa', 'operador', 'motorista', 'passageiro'
        ));
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not update role constraint: %', SQLERRM;
END $$;

-- ====================================================
-- PART 11: COMMENTS
-- ====================================================
COMMENT ON TABLE public.passenger_checkins IS 'Check-ins de embarque/desembarque de passageiros';
COMMENT ON TABLE public.vehicle_checklists IS 'Checklists de verificação pré-viagem do veículo';
COMMENT ON TABLE public.driver_locations IS 'Histórico de localização GPS dos motoristas';
COMMENT ON TABLE public.driver_messages IS 'Mensagens entre motorista e central de operações';
COMMENT ON TABLE public.passenger_cancellations IS 'Registro de não-embarques de passageiros';
COMMENT ON TABLE public.trip_evaluations IS 'Avaliações NPS das viagens pelos passageiros';
COMMENT ON TABLE public.announcements IS 'Mural de avisos para passageiros e motoristas';

-- ====================================================
-- END OF MIGRATION
-- ====================================================
