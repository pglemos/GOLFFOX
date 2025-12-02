-- ========================================
-- GolfFox Transport Management System
-- Complete Migration v7.4 - Production Ready
-- Date: 2024-12-17
-- ========================================

-- ========================================
-- PART 1: EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ========================================
-- PART 2: SCHEMA & TABLES (if not exist)
-- ========================================
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.carriers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('admin','operator','carrier','driver','passenger')) NOT NULL,
  company_id uuid REFERENCES public.companies(id),
  carrier_id uuid REFERENCES public.carriers(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate text UNIQUE NOT NULL,
  model text,
  carrier_id uuid REFERENCES public.carriers(id),
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.routes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  company_id uuid REFERENCES public.companies(id) NOT NULL,
  carrier_id uuid REFERENCES public.carriers(id) NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.route_stops (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id uuid REFERENCES public.routes(id) ON DELETE CASCADE,
  seq int NOT NULL,
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  radius_m int DEFAULT 50
);

CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id uuid REFERENCES public.routes(id) NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id),
  driver_id uuid REFERENCES public.users(id),
  status text CHECK (status IN ('scheduled','inProgress','completed','cancelled')) NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT NOW(),
  passenger_ids uuid[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.trip_passengers (
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (trip_id, passenger_id)
);

CREATE TABLE IF NOT EXISTS public.driver_positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  speed double precision,
  timestamp timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trip_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.users(id),
  event_type text NOT NULL,
  description text,
  lat double precision,
  lng double precision,
  timestamp timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trip_summary (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid UNIQUE REFERENCES public.trips(id) ON DELETE CASCADE,
  samples int DEFAULT 0,
  total_distance_km numeric DEFAULT 0,
  duration_minutes numeric DEFAULT 0,
  avg_speed_kmh numeric DEFAULT 0,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.checklists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.passenger_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  kind text CHECK (kind IN ('atraso','conducao_perigosa','lotacao','outro')) NOT NULL,
  message text,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  from_user uuid REFERENCES public.users(id) ON DELETE SET NULL,
  to_role text CHECK (to_role IN ('operator','carrier','driver','passenger','admin')),
  body text NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

-- ========================================
-- PART 3: INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS trips_driver_idx   ON public.trips (driver_id);
CREATE INDEX IF NOT EXISTS trips_route_idx    ON public.trips (route_id);
CREATE INDEX IF NOT EXISTS routes_company_idx ON public.routes (company_id);
CREATE INDEX IF NOT EXISTS routes_carrier_idx ON public.routes (carrier_id);
CREATE INDEX IF NOT EXISTS pos_trip_idx       ON public.driver_positions (trip_id);
CREATE INDEX IF NOT EXISTS events_trip_idx    ON public.trip_events (trip_id);
CREATE INDEX IF NOT EXISTS summary_trip_idx   ON public.trip_summary (trip_id);

-- ========================================
-- PART 4: DROP ALL POLICIES (Clean slate)
-- ========================================
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ========================================
-- PART 5: RLS HELPER FUNCTIONS
-- ========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_carrier_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT carrier_id FROM public.users WHERE id = auth.uid();
$$;

-- ========================================
-- PART 6: ENABLE RLS
-- ========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PART 7: CANONICAL RLS POLICIES (by table)
-- ========================================

-- DRIVER_POSITIONS
CREATE POLICY "pos_admin_all" ON public.driver_positions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Drivers can insert positions" ON public.driver_positions
  FOR INSERT WITH CHECK (public.current_role() = 'driver' AND driver_id = auth.uid());

CREATE POLICY "pos_driver_read" ON public.driver_positions
  FOR SELECT USING (public.current_role() = 'driver' AND driver_id = auth.uid());

CREATE POLICY "pos_company_read" ON public.driver_positions
  FOR SELECT USING (
    public.current_role() IN ('operator','passenger') AND EXISTS (
      SELECT 1 FROM public.trips t JOIN public.routes r ON r.id = t.route_id
      WHERE t.id = public.driver_positions.trip_id AND r.company_id = public.current_company_id()
    )
  );

CREATE POLICY "pos_carrier_read" ON public.driver_positions
  FOR SELECT USING (
    public.current_role() IN ('carrier','driver') AND EXISTS (
      SELECT 1 FROM public.trips t JOIN public.routes r ON r.id = t.route_id
      WHERE t.id = public.driver_positions.trip_id AND r.carrier_id = public.current_carrier_id()
    )
  );

-- ROUTES
CREATE POLICY "routes_admin_all" ON public.routes FOR SELECT USING (public.is_admin());
CREATE POLICY "routes_company_read" ON public.routes FOR SELECT USING (
  public.current_role() IN ('operator','passenger') AND company_id = public.current_company_id()
);
CREATE POLICY "routes_carrier_read" ON public.routes FOR SELECT USING (
  public.current_role() IN ('carrier','driver') AND carrier_id = public.current_carrier_id()
);

-- TRIPS
CREATE POLICY "trips_admin_all" ON public.trips FOR SELECT USING (public.is_admin());
CREATE POLICY "trips_company_read" ON public.trips FOR SELECT USING (
  public.current_role() IN ('operator','passenger') AND EXISTS (
    SELECT 1 FROM public.routes r WHERE r.id = public.trips.route_id AND r.company_id = public.current_company_id()
  )
);
CREATE POLICY "trips_carrier_read" ON public.trips FOR SELECT USING (
  public.current_role() IN ('carrier','driver') AND EXISTS (
    SELECT 1 FROM public.routes r WHERE r.id = public.trips.route_id AND r.carrier_id = public.current_carrier_id()
  )
);
CREATE POLICY "trips_driver_read" ON public.trips FOR SELECT USING (
  public.current_role() = 'driver' AND driver_id = auth.uid()
);
CREATE POLICY "trips_passenger_read" ON public.trips FOR SELECT USING (
  public.current_role() = 'passenger' AND auth.uid() = ANY(passenger_ids)
);

-- VEHICLES
CREATE POLICY "vehicles_admin_all" ON public.vehicles FOR SELECT USING (public.is_admin());
CREATE POLICY "vehicles_carrier_read" ON public.vehicles FOR SELECT USING (
  public.current_role() IN ('carrier','driver') AND carrier_id = public.current_carrier_id()
);
CREATE POLICY "vehicles_company_read" ON public.vehicles FOR SELECT USING (
  public.current_role() IN ('operator','passenger') AND EXISTS (
    SELECT 1 FROM public.trips t JOIN public.routes r ON r.id = t.route_id
    WHERE t.vehicle_id = public.vehicles.id AND r.company_id = public.current_company_id()
  )
);

-- TRIP_EVENTS
CREATE POLICY "events_admin_all" ON public.trip_events FOR SELECT USING (public.is_admin());
CREATE POLICY "events_company_read" ON public.trip_events FOR SELECT USING (
  public.current_role() IN ('operator','passenger') AND EXISTS (
    SELECT 1 FROM public.trips t JOIN public.routes r ON r.id = t.route_id
    WHERE t.id = public.trip_events.trip_id AND r.company_id = public.current_company_id()
  )
);
CREATE POLICY "events_carrier_read" ON public.trip_events FOR SELECT USING (
  public.current_role() IN ('carrier','driver') AND EXISTS (
    SELECT 1 FROM public.trips t JOIN public.routes r ON r.id = t.route_id
    WHERE t.id = public.trip_events.trip_id AND r.carrier_id = public.current_carrier_id()
  )
);
CREATE POLICY "events_driver_read" ON public.trip_events FOR SELECT USING (
  public.current_role() = 'driver' AND EXISTS (
    SELECT 1 FROM public.trips t WHERE t.id = public.trip_events.trip_id AND t.driver_id = auth.uid()
  )
);
CREATE POLICY "events_passenger_read" ON public.trip_events FOR SELECT USING (
  public.current_role() = 'passenger' AND EXISTS (
    SELECT 1 FROM public.trips t WHERE t.id = public.trip_events.trip_id AND auth.uid() = ANY(t.passenger_ids)
  )
);

-- TRIP_SUMMARY
CREATE POLICY "summary_admin_all" ON public.trip_summary FOR SELECT USING (public.is_admin());
CREATE POLICY "summary_company_read" ON public.trip_summary FOR SELECT USING (
  public.current_role() IN ('operator','passenger') AND EXISTS (
    SELECT 1 FROM public.trips t JOIN public.routes r ON r.id = t.route_id
    WHERE t.id = public.trip_summary.trip_id AND r.company_id = public.current_company_id()
  )
);
CREATE POLICY "summary_carrier_read" ON public.trip_summary FOR SELECT USING (
  public.current_role() IN ('carrier','driver') AND EXISTS (
    SELECT 1 FROM public.trips t JOIN public.routes r ON r.id = t.route_id
    WHERE t.id = public.trip_summary.trip_id AND r.carrier_id = public.current_carrier_id()
  )
);
CREATE POLICY "summary_driver_read" ON public.trip_summary FOR SELECT USING (
  public.current_role() = 'driver' AND EXISTS (
    SELECT 1 FROM public.trips t WHERE t.id = public.trip_summary.trip_id AND t.driver_id = auth.uid()
  )
);
CREATE POLICY "summary_passenger_read" ON public.trip_summary FOR SELECT USING (
  public.current_role() = 'passenger' AND EXISTS (
    SELECT 1 FROM public.trips t WHERE t.id = public.trip_summary.trip_id AND auth.uid() = ANY(t.passenger_ids)
  )
);

-- USERS
CREATE POLICY "users_admin_all" ON public.users FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "users_read_company" ON public.users FOR SELECT USING (
  public.current_role() = 'operator' AND company_id = public.current_company_id()
);
CREATE POLICY "users_read_carrier" ON public.users FOR SELECT USING (
  public.current_role() = 'carrier' AND carrier_id = public.current_carrier_id()
);
CREATE POLICY "users_read_self" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_self" ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ========================================
-- PART 8: TRIP SUMMARY CALCULATION (Haversine)
-- ========================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trip_summary_trip_id_key') THEN
    ALTER TABLE public.trip_summary ADD CONSTRAINT trip_summary_trip_id_key UNIQUE (trip_id);
  END IF;
END $$;

-- Adjusted to VOID + SECURITY DEFINER to avoid ambiguity and RLS issues
CREATE OR REPLACE FUNCTION public.calculate_trip_summary(p_trip uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_samples int := 0; v_total numeric := 0; v_start timestamptz := NULL; v_end timestamptz := NULL;
  v_dur numeric := 0; v_avg numeric := 0; r RECORD;
  prev_lat double precision; prev_lng double precision; prev_ts timestamptz;
  first_pt boolean := true;
  earth_km constant numeric := 6371.0; dlat double precision; dlng double precision; a numeric; c numeric;
BEGIN
  FOR r IN SELECT lat, lng, speed, timestamp FROM public.driver_positions WHERE trip_id = p_trip ORDER BY timestamp ASC
  LOOP
    v_samples := v_samples + 1;
    IF first_pt THEN v_start := r.timestamp; first_pt := false;
    ELSE
      dlat := radians(r.lat - prev_lat); dlng := radians(r.lng - prev_lng);
      a := sin(dlat/2)^2 + cos(radians(prev_lat))*cos(radians(r.lat))*sin(dlng/2)^2;
      c := 2 * asin(sqrt(a)); v_total := v_total + earth_km * c;
    END IF;
    prev_lat := r.lat; prev_lng := r.lng; prev_ts := r.timestamp;
  END LOOP;
  v_end := prev_ts;
  IF v_start IS NOT NULL AND v_end IS NOT NULL THEN v_dur := EXTRACT(EPOCH FROM (v_end - v_start))/60.0; END IF;
  IF v_dur > 0 THEN v_avg := v_total / (v_dur/60.0); END IF;
  INSERT INTO public.trip_summary AS ts (
    trip_id, samples, total_distance_km, duration_minutes, avg_speed_kmh, start_time, end_time, created_at, updated_at
  ) VALUES (
    p_trip, COALESCE(v_samples,0), COALESCE(v_total,0), COALESCE(v_dur,0), COALESCE(v_avg,0), v_start, v_end, NOW(), NOW()
  ) ON CONFLICT (trip_id) DO UPDATE SET
    samples = EXCLUDED.samples, total_distance_km = EXCLUDED.total_distance_km,
    duration_minutes = EXCLUDED.duration_minutes, avg_speed_kmh = EXCLUDED.avg_speed_kmh,
    start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, updated_at = NOW();
END; $$;

-- TRIGGER FOR AUTO-RECALC
DROP TRIGGER IF EXISTS trg_driver_positions_recalc_summary ON public.driver_positions;
CREATE OR REPLACE FUNCTION public.recalculate_trip_summary_on_position()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_trip uuid;
BEGIN
  v_trip := COALESCE(NEW.trip_id, OLD.trip_id);
  IF v_trip IS NOT NULL THEN PERFORM public.calculate_trip_summary(v_trip); END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_driver_positions_recalc_summary
AFTER INSERT OR UPDATE OR DELETE ON public.driver_positions
FOR EACH ROW EXECUTE FUNCTION public.recalculate_trip_summary_on_position();

-- ========================================
-- PART 9: RPC TRIP TRANSITION (Concurrency Safe + p_force)
-- ========================================
DROP FUNCTION IF EXISTS public.rpc_trip_transition(uuid,text,text,double precision,double precision,boolean);
CREATE OR REPLACE FUNCTION public.rpc_trip_transition(
  p_trip uuid, p_new_status text, p_description text,
  p_lat double precision, p_lng double precision, p_force boolean DEFAULT false
) RETURNS TABLE (result_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_role text; v_cur text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE='28000'; END IF;
  SELECT role INTO v_role FROM public.users WHERE id = v_uid;
  SELECT t.status INTO v_cur FROM public.trips t WHERE t.id = p_trip FOR UPDATE;
  IF v_cur IS NULL THEN RAISE EXCEPTION 'trip not found'; END IF;
  
  IF v_cur = 'scheduled' AND p_new_status = 'inProgress' THEN NULL;
  ELSIF v_cur = 'inProgress' AND p_new_status IN ('completed','cancelled') THEN NULL;
  ELSIF v_cur = 'completed' AND p_new_status = 'inProgress' THEN
    IF NOT p_force OR v_role NOT IN ('admin','operator','carrier') THEN
      RAISE EXCEPTION 'invalid transition completed -> inProgress (needs p_force and admin/operator/carrier)';
    END IF;
  ELSE RAISE EXCEPTION 'invalid transition % -> %', v_cur, p_new_status;
  END IF;
  
  UPDATE public.trips SET status = p_new_status,
    started_at = COALESCE(started_at, CASE WHEN p_new_status='inProgress' THEN NOW() END),
    completed_at = CASE WHEN p_new_status='completed' THEN NOW() ELSE completed_at END,
    updated_at = NOW()
  WHERE id = p_trip;
  
  INSERT INTO public.trip_events (trip_id, driver_id, event_type, description, lat, lng, timestamp)
  VALUES (p_trip, v_uid,
    CASE p_new_status WHEN 'inProgress' THEN 'start_trip' WHEN 'completed' THEN 'end_trip' ELSE 'stop' END,
    p_description, p_lat, p_lng, NOW());
  RETURN QUERY SELECT p_new_status::text;
END; $$;

-- ========================================
-- PART 10: AUTH PATCH (senha123)
-- ========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$
DECLARE u RECORD;
BEGIN
  FOR u IN SELECT id,email FROM auth.users WHERE LOWER(email) IN (
    'golffox@admin.com','operador@empresa.com','transportadora@trans.com','motorista@trans.com','passageiro@empresa.com'
  ) LOOP
    IF EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id=u.id AND i.provider='email') THEN
      UPDATE auth.identities SET provider_id=COALESCE(NULLIF(provider_id,''),LOWER(u.email)),
        identity_data = COALESCE(identity_data,'{}'::jsonb) || jsonb_build_object('sub',u.id::text,'email',LOWER(u.email)),
        updated_at=NOW() WHERE user_id=u.id AND provider='email';
    ELSE
      INSERT INTO auth.identities (id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
      VALUES (gen_random_uuid(),u.id,jsonb_build_object('sub',u.id::text,'email',LOWER(u.email)),'email',LOWER(u.email),NULL,NOW(),NOW());
    END IF;
    UPDATE auth.users SET email_confirmed_at=COALESCE(email_confirmed_at,NOW()) WHERE id=u.id;
    UPDATE auth.users SET encrypted_password=crypt('senha123',gen_salt('bf')) WHERE id=u.id;
  END LOOP;
END $$;

-- ========================================
-- GRANTS
-- ========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
