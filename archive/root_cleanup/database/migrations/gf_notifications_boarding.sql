-- ========================================
-- GolfFox - Notificações e Sistema de Embarque (NFC/QR)
-- ========================================

-- Tabela: Notificações do sistema
CREATE TABLE IF NOT EXISTS public.gf_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'arrival', 'boarding', 'route_completed', 'alert', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_notifications_user_id ON public.gf_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_gf_notifications_type ON public.gf_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_gf_notifications_is_read ON public.gf_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_gf_notifications_created_at ON public.gf_notifications(created_at DESC);

-- Tabela: Tokens de embarque (NFC/QR)
CREATE TABLE IF NOT EXISTS public.gf_boarding_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- Token único para NFC/QR
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  stop_order INTEGER, -- Ordem da parada para embarque
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_boarding_tokens_trip_id ON public.gf_boarding_tokens(trip_id);
CREATE INDEX IF NOT EXISTS idx_gf_boarding_tokens_passenger_id ON public.gf_boarding_tokens(passenger_id);
CREATE INDEX IF NOT EXISTS idx_gf_boarding_tokens_token ON public.gf_boarding_tokens(token);
CREATE INDEX IF NOT EXISTS idx_gf_boarding_tokens_is_used ON public.gf_boarding_tokens(is_used);

-- Tabela: Eventos de embarque
CREATE TABLE IF NOT EXISTS public.gf_boarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES public.gf_boarding_tokens(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'scanned', 'validated', 'boarded', 'rejected'
  latitude NUMERIC,
  longitude NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_boarding_events_token_id ON public.gf_boarding_events(token_id);
CREATE INDEX IF NOT EXISTS idx_gf_boarding_events_trip_id ON public.gf_boarding_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_gf_boarding_events_passenger_id ON public.gf_boarding_events(passenger_id);
CREATE INDEX IF NOT EXISTS idx_gf_boarding_events_event_type ON public.gf_boarding_events(event_type);
CREATE INDEX IF NOT EXISTS idx_gf_boarding_events_created_at ON public.gf_boarding_events(created_at DESC);

-- RPC: Validar token de embarque (usado pelo motorista via NFC/QR)
CREATE OR REPLACE FUNCTION public.rpc_validate_boarding(
  p_token TEXT,
  p_route_id UUID,
  p_driver_id UUID,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_record RECORD;
  v_result JSONB;
  v_event_id UUID;
BEGIN
  -- Buscar token
  SELECT * INTO v_token_record
  FROM public.gf_boarding_tokens
  WHERE token = p_token
    AND is_used = false
    AND expires_at > NOW()
    AND (route_id IS NULL OR route_id = p_route_id);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token inválido, expirado ou já usado'
    );
  END IF;
  
  -- Validar que o token pertence à rota correta
  IF v_token_record.route_id IS NOT NULL AND v_token_record.route_id != p_route_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token não pertence a esta rota'
    );
  END IF;
  
  -- Marcar token como usado
  UPDATE public.gf_boarding_tokens
  SET is_used = true, used_at = NOW()
  WHERE id = v_token_record.id;
  
  -- Criar evento de embarque
  INSERT INTO public.gf_boarding_events (
    token_id, trip_id, passenger_id, driver_id, vehicle_id,
    event_type, latitude, longitude, metadata
  )
  VALUES (
    v_token_record.id,
    v_token_record.trip_id,
    v_token_record.passenger_id,
    p_driver_id,
    (SELECT vehicle_id FROM public.trips WHERE id = v_token_record.trip_id LIMIT 1),
    'validated',
    p_latitude,
    p_longitude,
    jsonb_build_object('validated_at', NOW())
  )
  RETURNING id INTO v_event_id;
  
  -- Atualizar trip_passengers para marcar como embarcado
  INSERT INTO public.trip_passengers (trip_id, passenger_id, status, boarded_at)
  VALUES (v_token_record.trip_id, v_token_record.passenger_id, 'boarded', NOW())
  ON CONFLICT (trip_id, passenger_id) DO UPDATE
  SET status = 'boarded', boarded_at = NOW();
  
  RETURN jsonb_build_object(
    'success', true,
    'passenger_id', v_token_record.passenger_id,
    'trip_id', v_token_record.trip_id,
    'event_id', v_event_id,
    'message', 'Embarque confirmado com sucesso'
  );
END;
$$;

-- View: Status do motorista com cor do ônibus
CREATE OR REPLACE VIEW public.v_driver_last_status AS
SELECT DISTINCT ON (dp.driver_id)
  dp.driver_id,
  dp.trip_id,
  dp.route_id,
  dp.vehicle_id,
  public.get_driver_position_lat(dp.id) AS lat,
  public.get_driver_position_lng(dp.id) AS lng,
  dp.speed,
  dp.timestamp AS last_update,
  NOW() - dp.timestamp AS time_since_update,
  -- Determinar cor baseado no tempo parado e velocidade
  CASE 
    WHEN NOW() - dp.timestamp > INTERVAL '3 minutes' THEN 'red'::text
    WHEN NOW() - dp.timestamp > INTERVAL '2 minutes' THEN 'yellow'::text
    WHEN dp.speed > 0 THEN 'green'::text
    ELSE 'blue'::text
  END AS color,
  -- Informações adicionais
  r.name AS route_name,
  v.plate AS vehicle_plate,
  public.get_user_name(dp.driver_id) AS driver_name
FROM public.driver_positions dp
LEFT JOIN public.routes r ON dp.route_id = r.id
LEFT JOIN public.vehicles v ON dp.vehicle_id = v.id
ORDER BY dp.driver_id, dp.timestamp DESC;

-- RLS Policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_notifications') THEN
    ALTER TABLE public.gf_notifications ENABLE ROW LEVEL SECURITY;
    
    -- Admin pode tudo
    DROP POLICY IF EXISTS "Admin full access on gf_notifications" ON public.gf_notifications;
    CREATE POLICY "Admin full access on gf_notifications" ON public.gf_notifications
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
      );
    
    -- Usuários podem ver suas próprias notificações
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.gf_notifications;
    CREATE POLICY "Users can view own notifications" ON public.gf_notifications
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_boarding_tokens') THEN
    ALTER TABLE public.gf_boarding_tokens ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Admin full access on gf_boarding_tokens" ON public.gf_boarding_tokens;
    CREATE POLICY "Admin full access on gf_boarding_tokens" ON public.gf_boarding_tokens
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
      );
    
    -- Passageiros podem ver seus próprios tokens
    DROP POLICY IF EXISTS "Passengers can view own tokens" ON public.gf_boarding_tokens;
    CREATE POLICY "Passengers can view own tokens" ON public.gf_boarding_tokens
      FOR SELECT USING (passenger_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gf_boarding_events') THEN
    ALTER TABLE public.gf_boarding_events ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Admin full access on gf_boarding_events" ON public.gf_boarding_events;
    CREATE POLICY "Admin full access on gf_boarding_events" ON public.gf_boarding_events
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
      );
    
    -- Passageiros podem ver seus próprios eventos
    DROP POLICY IF EXISTS "Passengers can view own events" ON public.gf_boarding_events;
    CREATE POLICY "Passengers can view own events" ON public.gf_boarding_events
      FOR SELECT USING (passenger_id = auth.uid());
  END IF;
END $$;

COMMENT ON TABLE public.gf_notifications IS 'Notificações do sistema para usuários';
COMMENT ON TABLE public.gf_boarding_tokens IS 'Tokens únicos para embarque via NFC/QR';
COMMENT ON TABLE public.gf_boarding_events IS 'Eventos de validação e embarque';
COMMENT ON FUNCTION public.rpc_validate_boarding IS 'Valida token de embarque e registra evento (usado pelo motorista)';
COMMENT ON VIEW public.v_driver_last_status IS 'Última posição e status de cada motorista com cor do ônibus';

