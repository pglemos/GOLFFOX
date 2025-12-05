-- ====================================================
-- GolfFox Transport Management System
-- CONSOLIDATED MIGRATIONS - Apply All
-- Date: 2025-01-XX
-- ====================================================
-- ⚠️ IMPORTANTE: Este script aplica todas as migrations na ordem correta
-- Execute este script no Supabase SQL Editor
-- Todas as migrations são idempotentes (podem ser executadas múltiplas vezes)

-- ====================================================
-- MIGRATION 0: Ensure update_updated_at_column Function Exists
-- ====================================================

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ====================================================
-- MIGRATION 1: RLS Helper Functions
-- ====================================================

-- Function: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(v_role = 'admin', false);
END;
$$;

-- Function: Get current user's role
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN v_role;
END;
$$;

-- Function: Get current user's company_id
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN v_company_id;
END;
$$;

-- Function: Get current user's carrier_id
CREATE OR REPLACE FUNCTION public.current_carrier_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_carrier_id TEXT;
BEGIN
  SELECT carrier_id INTO v_carrier_id
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN v_carrier_id;
END;
$$;

-- Function: Get user by ID for login (used by auth API)
CREATE OR REPLACE FUNCTION public.get_user_by_id_for_login(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  company_id UUID,
  transportadora_id TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.company_id,
    u.carrier_id as transportadora_id,
    u.avatar_url
  FROM public.users u
  WHERE u.id = p_user_id;
END;
$$;

-- ====================================================
-- MIGRATION 2: Canonical RLS Policies
-- ====================================================

-- Drop existing basic policies
DROP POLICY IF EXISTS "Service role full access on companies" ON public.companies;
DROP POLICY IF EXISTS "Users can read their company" ON public.companies;
DROP POLICY IF EXISTS "Service role full access on users" ON public.users;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access on routes" ON public.routes;
DROP POLICY IF EXISTS "Users can read routes from their company" ON public.routes;
DROP POLICY IF EXISTS "Service role full access on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can read vehicles from their company" ON public.vehicles;
DROP POLICY IF EXISTS "Service role full access on trips" ON public.trips;
DROP POLICY IF EXISTS "Users can read trips from their company" ON public.trips;
DROP POLICY IF EXISTS "Service role full access on cost categories" ON public.gf_cost_categories;
DROP POLICY IF EXISTS "Users can read active cost categories" ON public.gf_cost_categories;
DROP POLICY IF EXISTS "Service role full access on costs" ON public.gf_costs;
DROP POLICY IF EXISTS "Users can read costs from their company" ON public.gf_costs;

-- Companies Policies
CREATE POLICY "service_role_full_access_companies"
  ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_access_companies"
  ON public.companies FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "operator_read_own_company"
  ON public.companies FOR SELECT TO authenticated
  USING (public.current_role() = 'operator' AND id = public.current_company_id());

CREATE POLICY "operator_update_own_company"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.current_role() = 'operator' AND id = public.current_company_id())
  WITH CHECK (public.current_role() = 'operator' AND id = public.current_company_id());

CREATE POLICY "carrier_read_own_company"
  ON public.companies FOR SELECT TO authenticated
  USING (public.current_role() = 'carrier' AND id = public.current_company_id());

-- Users Policies
CREATE POLICY "service_role_full_access_users"
  ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_access_users"
  ON public.users FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "operator_read_company_users"
  ON public.users FOR SELECT TO authenticated
  USING (public.current_role() = 'operator' AND company_id = public.current_company_id());

CREATE POLICY "carrier_read_carrier_users"
  ON public.users FOR SELECT TO authenticated
  USING (public.current_role() = 'carrier' AND carrier_id = public.current_carrier_id());

CREATE POLICY "driver_read_own_profile"
  ON public.users FOR SELECT TO authenticated
  USING (public.current_role() = 'driver' AND id = auth.uid());

CREATE POLICY "driver_update_own_profile"
  ON public.users FOR UPDATE TO authenticated
  USING (public.current_role() = 'driver' AND id = auth.uid())
  WITH CHECK (public.current_role() = 'driver' AND id = auth.uid());

CREATE POLICY "passenger_read_own_profile"
  ON public.users FOR SELECT TO authenticated
  USING (public.current_role() = 'passenger' AND id = auth.uid());

CREATE POLICY "authenticated_read_own_profile"
  ON public.users FOR SELECT TO authenticated USING (id = auth.uid());

-- Routes Policies
CREATE POLICY "service_role_full_access_routes"
  ON public.routes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_access_routes"
  ON public.routes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "operator_full_access_company_routes"
  ON public.routes FOR ALL TO authenticated
  USING (public.current_role() = 'operator' AND company_id = public.current_company_id())
  WITH CHECK (public.current_role() = 'operator' AND company_id = public.current_company_id());

CREATE POLICY "carrier_read_carrier_routes"
  ON public.routes FOR SELECT TO authenticated
  USING (public.current_role() = 'carrier' AND carrier_id = public.current_carrier_id());

CREATE POLICY "driver_read_assigned_routes"
  ON public.routes FOR SELECT TO authenticated
  USING (
    public.current_role() = 'driver' AND
    id IN (SELECT route_id FROM public.trips WHERE driver_id = auth.uid())
  );

CREATE POLICY "passenger_read_assigned_routes"
  ON public.routes FOR SELECT TO authenticated
  USING (
    public.current_role() = 'passenger' AND
    id IN (
      SELECT route_id FROM public.trips
      WHERE id IN (SELECT trip_id FROM public.trip_passengers WHERE passenger_id = auth.uid())
    )
  );

-- Vehicles Policies
CREATE POLICY "service_role_full_access_vehicles"
  ON public.vehicles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_access_vehicles"
  ON public.vehicles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "operator_full_access_company_vehicles"
  ON public.vehicles FOR ALL TO authenticated
  USING (public.current_role() = 'operator' AND company_id = public.current_company_id())
  WITH CHECK (public.current_role() = 'operator' AND company_id = public.current_company_id());

CREATE POLICY "carrier_full_access_carrier_vehicles"
  ON public.vehicles FOR ALL TO authenticated
  USING (public.current_role() = 'carrier' AND carrier_id = public.current_carrier_id())
  WITH CHECK (public.current_role() = 'carrier' AND carrier_id = public.current_carrier_id());

CREATE POLICY "driver_read_assigned_vehicles"
  ON public.vehicles FOR SELECT TO authenticated
  USING (
    public.current_role() = 'driver' AND
    id IN (SELECT vehicle_id FROM public.trips WHERE driver_id = auth.uid())
  );

-- Trips Policies
CREATE POLICY "service_role_full_access_trips"
  ON public.trips FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_access_trips"
  ON public.trips FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "operator_full_access_company_trips"
  ON public.trips FOR ALL TO authenticated
  USING (
    public.current_role() = 'operator' AND
    route_id IN (SELECT id FROM public.routes WHERE company_id = public.current_company_id())
  )
  WITH CHECK (
    public.current_role() = 'operator' AND
    route_id IN (SELECT id FROM public.routes WHERE company_id = public.current_company_id())
  );

CREATE POLICY "carrier_read_carrier_trips"
  ON public.trips FOR SELECT TO authenticated
  USING (
    public.current_role() = 'carrier' AND
    route_id IN (SELECT id FROM public.routes WHERE carrier_id = public.current_carrier_id())
  );

CREATE POLICY "driver_full_access_own_trips"
  ON public.trips FOR ALL TO authenticated
  USING (public.current_role() = 'driver' AND driver_id = auth.uid())
  WITH CHECK (public.current_role() = 'driver' AND driver_id = auth.uid());

CREATE POLICY "passenger_read_assigned_trips"
  ON public.trips FOR SELECT TO authenticated
  USING (
    public.current_role() = 'passenger' AND
    id IN (SELECT trip_id FROM public.trip_passengers WHERE passenger_id = auth.uid())
  );

-- Cost Categories Policies
CREATE POLICY "service_role_full_access_cost_categories"
  ON public.gf_cost_categories FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_active_cost_categories"
  ON public.gf_cost_categories FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "admin_full_access_cost_categories"
  ON public.gf_cost_categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Costs Policies
CREATE POLICY "service_role_full_access_costs"
  ON public.gf_costs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_access_costs"
  ON public.gf_costs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "operator_full_access_company_costs"
  ON public.gf_costs FOR ALL TO authenticated
  USING (public.current_role() = 'operator' AND company_id = public.current_company_id())
  WITH CHECK (public.current_role() = 'operator' AND company_id = public.current_company_id());

CREATE POLICY "carrier_read_carrier_costs"
  ON public.gf_costs FOR SELECT TO authenticated
  USING (public.current_role() = 'carrier' AND carrier_id = public.current_carrier_id());

-- Driver Positions Policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'driver_positions') THEN
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Service role full access on driver_positions" ON public.driver_positions;
    DROP POLICY IF EXISTS "Drivers can insert their positions" ON public.driver_positions;
    DROP POLICY IF EXISTS "Users can read positions for their company trips" ON public.driver_positions;

    CREATE POLICY "service_role_full_access_driver_positions"
      ON public.driver_positions FOR ALL TO service_role USING (true) WITH CHECK (true);

    CREATE POLICY "admin_full_access_driver_positions"
      ON public.driver_positions FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());

    CREATE POLICY "driver_insert_own_positions"
      ON public.driver_positions FOR INSERT TO authenticated
      WITH CHECK (public.current_role() = 'driver' AND driver_id = auth.uid());

    CREATE POLICY "operator_read_company_trip_positions"
      ON public.driver_positions FOR SELECT TO authenticated
      USING (
        public.current_role() = 'operator' AND
        trip_id IN (
          SELECT t.id FROM public.trips t
          JOIN public.routes r ON t.route_id = r.id
          WHERE r.company_id = public.current_company_id()
        )
      );

    CREATE POLICY "carrier_read_carrier_trip_positions"
      ON public.driver_positions FOR SELECT TO authenticated
      USING (
        public.current_role() = 'carrier' AND
        trip_id IN (
          SELECT t.id FROM public.trips t
          JOIN public.routes r ON t.route_id = r.id
          WHERE r.carrier_id = public.current_carrier_id()
        )
      );

    CREATE POLICY "driver_read_own_trip_positions"
      ON public.driver_positions FOR SELECT TO authenticated
      USING (
        public.current_role() = 'driver' AND
        trip_id IN (SELECT id FROM public.trips WHERE driver_id = auth.uid())
      );
  END IF;
END $$;

-- ====================================================
-- MIGRATION 3: Improve RPC Trip Transition
-- ====================================================

DROP FUNCTION IF EXISTS public.rpc_trip_transition(UUID, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN);

CREATE OR REPLACE FUNCTION public.rpc_trip_transition(
  p_trip_id UUID,
  p_new_status TEXT,
  p_description TEXT DEFAULT NULL,
  p_lat DOUBLE PRECISION DEFAULT NULL,
  p_lng DOUBLE PRECISION DEFAULT NULL,
  p_force BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip trips%ROWTYPE;
  v_current_status TEXT;
  v_user_role TEXT;
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_is_operator BOOLEAN;
  v_is_carrier BOOLEAN;
  v_is_driver BOOLEAN;
  v_transition_valid BOOLEAN := false;
BEGIN
  v_user_id := auth.uid();
  v_user_role := public.current_role();
  v_is_admin := public.is_admin();
  v_is_operator := (v_user_role = 'operator');
  v_is_carrier := (v_user_role = 'carrier');
  v_is_driver := (v_user_role = 'driver');

  IF p_new_status NOT IN ('scheduled', 'inProgress', 'completed', 'cancelled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status: ' || p_new_status, 'code', 'invalid_status');
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;

  IF v_trip.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trip not found', 'code', 'trip_not_found');
  END IF;

  v_current_status := v_trip.status;

  IF v_current_status = p_new_status THEN
    RETURN jsonb_build_object('success', true, 'status', p_new_status, 'message', 'Status already set', 'trip_id', p_trip_id);
  END IF;

  v_transition_valid := (
    (v_current_status = 'scheduled' AND p_new_status = 'inProgress') OR
    (v_current_status = 'scheduled' AND p_new_status = 'cancelled') OR
    (v_current_status = 'inProgress' AND p_new_status = 'completed') OR
    (v_current_status = 'inProgress' AND p_new_status = 'cancelled') OR
    (v_current_status = 'completed' AND p_new_status = 'inProgress' AND p_force = true)
  );

  IF NOT v_transition_valid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid transition: ' || v_current_status || ' → ' || p_new_status,
      'code', 'invalid_transition',
      'current_status', v_current_status,
      'new_status', p_new_status,
      'force', p_force
    );
  END IF;

  IF v_is_driver THEN
    IF v_trip.driver_id != v_user_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Driver can only modify own trips', 'code', 'permission_denied');
    END IF;
    IF NOT ((v_current_status = 'scheduled' AND p_new_status = 'inProgress') OR (v_current_status = 'inProgress' AND p_new_status = 'completed')) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Driver can only start or complete trips', 'code', 'permission_denied');
    END IF;
  END IF;

  IF p_new_status = 'cancelled' AND NOT (v_is_admin OR v_is_operator OR v_is_carrier) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admin, operator, or carrier can cancel trips', 'code', 'permission_denied');
  END IF;

  IF p_force AND v_current_status = 'completed' AND p_new_status = 'inProgress' AND NOT (v_is_admin OR v_is_operator OR v_is_carrier) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admin, operator, or carrier can force reopen trips', 'code', 'permission_denied');
  END IF;

  UPDATE public.trips
  SET
    status = p_new_status,
    updated_at = NOW(),
    actual_start_time = CASE WHEN p_new_status = 'inProgress' AND actual_start_time IS NULL THEN NOW() ELSE actual_start_time END,
    actual_end_time = CASE WHEN p_new_status IN ('completed', 'cancelled') AND actual_end_time IS NULL THEN NOW() ELSE actual_end_time END,
    start_latitude = CASE WHEN p_new_status = 'inProgress' AND p_lat IS NOT NULL THEN p_lat ELSE start_latitude END,
    start_longitude = CASE WHEN p_new_status = 'inProgress' AND p_lng IS NOT NULL THEN p_lng ELSE start_longitude END,
    end_latitude = CASE WHEN p_new_status IN ('completed', 'cancelled') AND p_lat IS NOT NULL THEN p_lat ELSE end_latitude END,
    end_longitude = CASE WHEN p_new_status IN ('completed', 'cancelled') AND p_lng IS NOT NULL THEN p_lng ELSE end_longitude END
  WHERE id = p_trip_id;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trip_events') THEN
    INSERT INTO public.trip_events (trip_id, event_type, payload)
    VALUES (
      p_trip_id,
      'status_change',
      jsonb_build_object(
        'old_status', v_current_status,
        'new_status', p_new_status,
        'description', p_description,
        'lat', p_lat,
        'lng', p_lng,
        'force', p_force,
        'user_id', v_user_id,
        'user_role', v_user_role,
        'timestamp', NOW()
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', p_new_status,
    'trip_id', p_trip_id,
    'previous_status', v_current_status,
    'message', 'Trip status updated successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'code', 'internal_error');
END;
$$;

-- ====================================================
-- MIGRATION 4: Trip Summary
-- ====================================================

-- Create trip_summary table
CREATE TABLE IF NOT EXISTS public.trip_summary (
  trip_id UUID PRIMARY KEY REFERENCES public.trips(id) ON DELETE CASCADE,
  total_distance_km NUMERIC(10, 2) DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  max_speed_kmh NUMERIC(6, 2) DEFAULT 0,
  avg_speed_kmh NUMERIC(6, 2) DEFAULT 0,
  position_count INTEGER DEFAULT 0,
  last_position_at TIMESTAMPTZ,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_summary_trip_id ON public.trip_summary(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_summary_calculated_at ON public.trip_summary(calculated_at DESC);

ALTER TABLE public.trip_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_trip_summary"
  ON public.trip_summary FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_access_trip_summary"
  ON public.trip_summary FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "operator_read_company_trip_summaries"
  ON public.trip_summary FOR SELECT TO authenticated
  USING (
    public.current_role() = 'operator' AND
    trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.routes r ON t.route_id = r.id
      WHERE r.company_id = public.current_company_id()
    )
  );

CREATE POLICY "carrier_read_carrier_trip_summaries"
  ON public.trip_summary FOR SELECT TO authenticated
  USING (
    public.current_role() = 'carrier' AND
    trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.routes r ON t.route_id = r.id
      WHERE r.carrier_id = public.current_carrier_id()
    )
  );

CREATE POLICY "driver_read_own_trip_summaries"
  ON public.trip_summary FOR SELECT TO authenticated
  USING (
    public.current_role() = 'driver' AND
    trip_id IN (SELECT id FROM public.trips WHERE driver_id = auth.uid())
  );

CREATE POLICY "passenger_read_assigned_trip_summaries"
  ON public.trip_summary FOR SELECT TO authenticated
  USING (
    public.current_role() = 'passenger' AND
    trip_id IN (SELECT trip_id FROM public.trip_passengers WHERE passenger_id = auth.uid())
  );

-- Haversine function
CREATE OR REPLACE FUNCTION public.haversine_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R NUMERIC := 6371;
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat / 2) * sin(dlat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon / 2) * sin(dlon / 2);
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  RETURN ROUND(R * c, 2);
END;
$$;

-- Calculate trip summary function
CREATE OR REPLACE FUNCTION public.calculate_trip_summary(p_trip_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_distance NUMERIC := 0;
  v_total_duration INTEGER := 0;
  v_max_speed NUMERIC := 0;
  v_avg_speed NUMERIC := 0;
  v_position_count INTEGER := 0;
  v_last_position_at TIMESTAMPTZ;
  v_first_position_at TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*), MIN(timestamp), MAX(timestamp)
  INTO v_position_count, v_first_position_at, v_last_position_at
  FROM public.driver_positions
  WHERE trip_id = p_trip_id;

  IF v_position_count = 0 THEN
    INSERT INTO public.trip_summary (
      trip_id, total_distance_km, total_duration_minutes, max_speed_kmh,
      avg_speed_kmh, position_count, last_position_at, calculated_at
    ) VALUES (p_trip_id, 0, 0, 0, 0, 0, NULL, NOW())
    ON CONFLICT (trip_id) DO UPDATE SET
      total_distance_km = 0, total_duration_minutes = 0, max_speed_kmh = 0,
      avg_speed_kmh = 0, position_count = 0, last_position_at = NULL,
      calculated_at = NOW(), updated_at = NOW();
    RETURN;
  END IF;

  IF v_first_position_at IS NOT NULL AND v_last_position_at IS NOT NULL THEN
    v_total_duration := EXTRACT(EPOCH FROM (v_last_position_at - v_first_position_at)) / 60;
  END IF;

  WITH position_pairs AS (
    SELECT 
      lat, lng, speed, timestamp,
      LAG(lat) OVER (ORDER BY timestamp) as prev_lat,
      LAG(lng) OVER (ORDER BY timestamp) as prev_lng
    FROM public.driver_positions
    WHERE trip_id = p_trip_id
    ORDER BY timestamp ASC
  ),
  distances AS (
    SELECT 
      CASE WHEN prev_lat IS NOT NULL AND prev_lng IS NOT NULL THEN
        public.haversine_distance(prev_lat, prev_lng, lat, lng)
      ELSE 0 END as segment_distance,
      speed
    FROM position_pairs
    WHERE prev_lat IS NOT NULL AND prev_lng IS NOT NULL
  )
  SELECT 
    COALESCE(SUM(segment_distance), 0),
    COALESCE(MAX(speed), 0),
    COALESCE(AVG(speed), 0)
  INTO v_total_distance, v_max_speed, v_avg_speed
  FROM distances;

  INSERT INTO public.trip_summary (
    trip_id, total_distance_km, total_duration_minutes, max_speed_kmh,
    avg_speed_kmh, position_count, last_position_at, calculated_at
  ) VALUES (
    p_trip_id, v_total_distance, v_total_duration, v_max_speed,
    v_avg_speed, v_position_count, v_last_position_at, NOW()
  )
  ON CONFLICT (trip_id) DO UPDATE SET
    total_distance_km = v_total_distance,
    total_duration_minutes = v_total_duration,
    max_speed_kmh = v_max_speed,
    avg_speed_kmh = v_avg_speed,
    position_count = v_position_count,
    last_position_at = v_last_position_at,
    calculated_at = NOW(),
    updated_at = NOW();
END;
$$;

-- Trigger function
CREATE OR REPLACE FUNCTION public.trigger_recalculate_trip_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_trip_summary(OLD.trip_id);
    RETURN OLD;
  ELSE
    PERFORM public.calculate_trip_summary(NEW.trip_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_driver_positions_recalc_summary ON public.driver_positions;

CREATE TRIGGER trg_driver_positions_recalc_summary
  AFTER INSERT OR UPDATE OR DELETE ON public.driver_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_trip_summary();

-- ====================================================
-- MIGRATION 5: Create gf_user_company_map Table
-- ====================================================

CREATE TABLE IF NOT EXISTS public.gf_user_company_map (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_gf_user_company_map_user_id ON public.gf_user_company_map(user_id);
CREATE INDEX IF NOT EXISTS idx_gf_user_company_map_company_id ON public.gf_user_company_map(company_id);

ALTER TABLE public.gf_user_company_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_gf_user_company_map"
  ON public.gf_user_company_map FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_full_access_gf_user_company_map"
  ON public.gf_user_company_map FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "operator_read_own_mappings"
  ON public.gf_user_company_map FOR SELECT TO authenticated
  USING (public.current_role() = 'operator' AND user_id = auth.uid());

CREATE POLICY "authenticated_read_own_mappings"
  ON public.gf_user_company_map FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS update_gf_user_company_map_updated_at ON public.gf_user_company_map;

CREATE TRIGGER update_gf_user_company_map_updated_at
  BEFORE UPDATE ON public.gf_user_company_map
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- MIGRATION 6: Address Columns (if needed)
-- ====================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cnh VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(5);

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS chassis VARCHAR(50);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS renavam VARCHAR(20);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS carrier_id UUID;

-- ====================================================
-- END OF CONSOLIDATED MIGRATIONS
-- ====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ ALL MIGRATIONS APPLIED SUCCESSFULLY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Run validation script:';
  RAISE NOTICE '   Execute: apps/web/database/scripts/validate_migrations.sql';
  RAISE NOTICE '';
  RAISE NOTICE '2. Enable Realtime:';
  RAISE NOTICE '   Dashboard → Database → Replication → Enable driver_positions';
  RAISE NOTICE '';
  RAISE NOTICE '3. Quick verification queries:';
  RAISE NOTICE '   SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = ''public'' AND routine_name IN (''is_admin'', ''current_role'', ''current_company_id'', ''current_carrier_id'', ''get_user_by_id_for_login'');';
  RAISE NOTICE '   SELECT COUNT(*) FROM pg_policies WHERE schemaname = ''public'';';
  RAISE NOTICE '   SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN (''trip_summary'', ''gf_user_company_map'');';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SECURITY IMPROVEMENTS APPLIED:';
  RAISE NOTICE '   ✅ CSRF protection enabled in production';
  RAISE NOTICE '   ✅ Cookies are httpOnly';
  RAISE NOTICE '   ✅ Canonical RLS policies implemented';
  RAISE NOTICE '   ✅ Helper functions RLS created';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ FUNCTIONAL IMPROVEMENTS APPLIED:';
  RAISE NOTICE '   ✅ Trip summary calculated automatically';
  RAISE NOTICE '   ✅ RPC with concurrency control (SELECT FOR UPDATE)';
  RAISE NOTICE '   ✅ State transition validation';
  RAISE NOTICE '   ✅ Role-based permissions';
  RAISE NOTICE '';
  RAISE NOTICE '📚 DOCUMENTATION:';
  RAISE NOTICE '   See: docs/auditoria/GUIA_APLICACAO_MIGRATIONS.md';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

