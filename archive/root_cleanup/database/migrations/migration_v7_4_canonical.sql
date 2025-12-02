-- ========================================
-- GolfFox Transport Management System
-- Canonical Migration v7.4
-- Role-based RLS, Trip Transitions, Summaries & Reporting
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ========================================
-- PART 1: Additional Tables (trip_events, trip_summary, checklists)
-- ========================================

-- Trip events table (audit log for state transitions)
CREATE TABLE IF NOT EXISTS trip_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'assigned', 'started', 'completed', 'cancelled', 'reopened')),
  from_status TEXT,
  to_status TEXT NOT NULL,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  forced BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_events_trip_id ON trip_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_events_created_at ON trip_events(created_at);

-- Trip summary table (calculated metrics)
CREATE TABLE IF NOT EXISTS trip_summary (
  trip_id UUID PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,
  total_distance_km NUMERIC DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  max_speed_kmh NUMERIC DEFAULT 0,
  avg_speed_kmh NUMERIC DEFAULT 0,
  position_count INTEGER DEFAULT 0,
  last_position_at TIMESTAMPTZ,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklists table (pre/post trip inspections)
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pre_trip', 'post_trip')),
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  vehicle_condition TEXT,
  fuel_level TEXT,
  tire_pressure TEXT,
  lights_working BOOLEAN,
  brakes_working BOOLEAN,
  emergency_kit BOOLEAN,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklists_trip_id ON checklists(trip_id);

-- ========================================
-- PART 2: DROP ALL EXISTING POLICIES (Idempotent Cleanup)
-- ========================================

-- Drop all policies from all tables
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ========================================
-- PART 3: CANONICAL RLS POLICIES BY ROLE (v7.4)
-- ========================================

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get user company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get user carrier_id
CREATE OR REPLACE FUNCTION get_user_carrier_id()
RETURNS TEXT AS $$
  SELECT carrier_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Admin: full access
CREATE POLICY "Admin can view all users" ON users
  FOR SELECT TO authenticated 
  USING (get_user_role() = 'admin');

CREATE POLICY "Admin can insert users" ON users
  FOR INSERT TO authenticated 
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admin can update users" ON users
  FOR UPDATE TO authenticated 
  USING (get_user_role() = 'admin');

CREATE POLICY "Admin can delete users" ON users
  FOR DELETE TO authenticated 
  USING (get_user_role() = 'admin');

-- Operator: view company users
CREATE POLICY "Operator can view company users" ON users
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'operator' AND 
    company_id = get_user_company_id()
  );

-- Carrier: view carrier users
CREATE POLICY "Carrier can view carrier users" ON users
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'carrier' AND 
    carrier_id = get_user_carrier_id()
  );

-- Driver/Passenger: view self only
CREATE POLICY "Users can view self" ON users
  FOR SELECT TO authenticated 
  USING (
    id = auth.uid() OR
    get_user_role() IN ('admin', 'operator', 'carrier')
  );

-- All users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated 
  USING (id = auth.uid());

-- ========================================
-- COMPANIES TABLE POLICIES
-- ========================================

-- Admin: full access
CREATE POLICY "Admin full access companies" ON companies
  FOR ALL TO authenticated 
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Operator: view own company
CREATE POLICY "Operator view company" ON companies
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'operator' AND 
    id = get_user_company_id()
  );

-- Others: read-only
CREATE POLICY "Others view companies" ON companies
  FOR SELECT TO authenticated 
  USING (get_user_role() IN ('carrier', 'driver', 'passenger'));

-- ========================================
-- ROUTES TABLE POLICIES
-- ========================================

-- Admin: full access
CREATE POLICY "Admin full access routes" ON routes
  FOR ALL TO authenticated 
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Operator: company routes only
CREATE POLICY "Operator view company routes" ON routes
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'operator' AND 
    company_id = get_user_company_id()
  );

CREATE POLICY "Operator insert company routes" ON routes
  FOR INSERT TO authenticated 
  WITH CHECK (
    get_user_role() = 'operator' AND 
    company_id = get_user_company_id()
  );

CREATE POLICY "Operator update company routes" ON routes
  FOR UPDATE TO authenticated 
  USING (
    get_user_role() = 'operator' AND 
    company_id = get_user_company_id()
  );

-- Carrier: carrier routes only
CREATE POLICY "Carrier view carrier routes" ON routes
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'carrier' AND 
    carrier_id = get_user_carrier_id()
  );

-- Driver/Passenger: view all routes (for navigation)
CREATE POLICY "Others view routes" ON routes
  FOR SELECT TO authenticated 
  USING (get_user_role() IN ('driver', 'passenger'));

-- ========================================
-- VEHICLES TABLE POLICIES
-- ========================================

-- Admin: full access
CREATE POLICY "Admin full access vehicles" ON vehicles
  FOR ALL TO authenticated 
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Carrier: carrier vehicles only
CREATE POLICY "Carrier manage vehicles" ON vehicles
  FOR ALL TO authenticated 
  USING (
    get_user_role() = 'carrier' AND 
    carrier_id = get_user_carrier_id()
  )
  WITH CHECK (
    get_user_role() = 'carrier' AND 
    carrier_id = get_user_carrier_id()
  );

-- Others: read-only
CREATE POLICY "Others view vehicles" ON vehicles
  FOR SELECT TO authenticated 
  USING (get_user_role() IN ('operator', 'driver', 'passenger'));

-- ========================================
-- TRIPS TABLE POLICIES
-- ========================================

-- Admin: full access
CREATE POLICY "Admin full access trips" ON trips
  FOR ALL TO authenticated 
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Operator: company trips (via routes)
CREATE POLICY "Operator view company trips" ON trips
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'operator' AND 
    route_id IN (
      SELECT id FROM routes WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Operator manage company trips" ON trips
  FOR INSERT TO authenticated 
  WITH CHECK (
    get_user_role() = 'operator' AND 
    route_id IN (
      SELECT id FROM routes WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Operator update company trips" ON trips
  FOR UPDATE TO authenticated 
  USING (
    get_user_role() = 'operator' AND 
    route_id IN (
      SELECT id FROM routes WHERE company_id = get_user_company_id()
    )
  );

-- Carrier: carrier trips (via routes)
CREATE POLICY "Carrier view carrier trips" ON trips
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'carrier' AND 
    route_id IN (
      SELECT id FROM routes WHERE carrier_id = get_user_carrier_id()
    )
  );

-- Driver: own trips only
CREATE POLICY "Driver view own trips" ON trips
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'driver' AND 
    driver_id = auth.uid()
  );

CREATE POLICY "Driver update own trips" ON trips
  FOR UPDATE TO authenticated 
  USING (
    get_user_role() = 'driver' AND 
    driver_id = auth.uid()
  );

-- Passenger: assigned trips only
CREATE POLICY "Passenger view assigned trips" ON trips
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'passenger' AND 
    id IN (
      SELECT trip_id FROM trip_passengers WHERE passenger_id = auth.uid()
    )
  );

-- ========================================
-- DRIVER_POSITIONS TABLE POLICIES
-- ========================================

-- Admin: full access
CREATE POLICY "Admin full access positions" ON driver_positions
  FOR ALL TO authenticated 
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Driver: insert own positions only, view own positions
CREATE POLICY "Driver insert own positions" ON driver_positions
  FOR INSERT TO authenticated 
  WITH CHECK (
    get_user_role() = 'driver' AND 
    driver_id = auth.uid()
  );

CREATE POLICY "Driver view own positions" ON driver_positions
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'driver' AND 
    driver_id = auth.uid()
  );

-- Operator: view company trip positions
CREATE POLICY "Operator view company positions" ON driver_positions
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'operator' AND 
    trip_id IN (
      SELECT t.id FROM trips t
      JOIN routes r ON t.route_id = r.id
      WHERE r.company_id = get_user_company_id()
    )
  );

-- Carrier: view carrier trip positions
CREATE POLICY "Carrier view carrier positions" ON driver_positions
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'carrier' AND 
    trip_id IN (
      SELECT t.id FROM trips t
      JOIN routes r ON t.route_id = r.id
      WHERE r.carrier_id = get_user_carrier_id()
    )
  );

-- Passenger: view positions for assigned trips
CREATE POLICY "Passenger view trip positions" ON driver_positions
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'passenger' AND 
    trip_id IN (
      SELECT trip_id FROM trip_passengers WHERE passenger_id = auth.uid()
    )
  );

-- ========================================
-- TRIP_PASSENGERS TABLE POLICIES
-- ========================================

-- Admin/Operator: full access
CREATE POLICY "Admin manage trip passengers" ON trip_passengers
  FOR ALL TO authenticated 
  USING (get_user_role() IN ('admin', 'operator'))
  WITH CHECK (get_user_role() IN ('admin', 'operator'));

-- Passenger: view own assignments
CREATE POLICY "Passenger view own assignments" ON trip_passengers
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'passenger' AND 
    passenger_id = auth.uid()
  );

-- Driver: view passengers on own trips
CREATE POLICY "Driver view trip passengers" ON trip_passengers
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'driver' AND 
    trip_id IN (
      SELECT id FROM trips WHERE driver_id = auth.uid()
    )
  );

-- ========================================
-- TRIP_EVENTS TABLE POLICIES
-- ========================================

CREATE POLICY "Admin full access trip events" ON trip_events
  FOR ALL TO authenticated 
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "All can view relevant trip events" ON trip_events
  FOR SELECT TO authenticated 
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE 
        driver_id = auth.uid() OR
        id IN (SELECT trip_id FROM trip_passengers WHERE passenger_id = auth.uid())
    ) OR
    get_user_role() IN ('operator', 'carrier')
  );

CREATE POLICY "System can insert trip events" ON trip_events
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- ========================================
-- TRIP_SUMMARY TABLE POLICIES
-- ========================================

CREATE POLICY "Admin view all summaries" ON trip_summary
  FOR SELECT TO authenticated 
  USING (get_user_role() = 'admin');

CREATE POLICY "All can view relevant summaries" ON trip_summary
  FOR SELECT TO authenticated 
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE 
        driver_id = auth.uid() OR
        id IN (SELECT trip_id FROM trip_passengers WHERE passenger_id = auth.uid())
    ) OR
    get_user_role() IN ('operator', 'carrier')
  );

CREATE POLICY "System can manage summaries" ON trip_summary
  FOR ALL TO authenticated 
  USING (true)
  WITH CHECK (true);

-- ========================================
-- CHECKLISTS TABLE POLICIES
-- ========================================

CREATE POLICY "Admin full access checklists" ON checklists
  FOR ALL TO authenticated 
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Driver manage own trip checklists" ON checklists
  FOR ALL TO authenticated 
  USING (
    get_user_role() = 'driver' AND 
    trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid())
  )
  WITH CHECK (
    get_user_role() = 'driver' AND 
    trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid())
  );

CREATE POLICY "Others view checklists" ON checklists
  FOR SELECT TO authenticated 
  USING (get_user_role() IN ('operator', 'carrier'));

-- ========================================
-- PART 4: RPC TRIP TRANSITION WITH CONCURRENCY CONTROL
-- ========================================

CREATE OR REPLACE FUNCTION rpc_trip_transition(
  p_trip_id UUID,
  p_new_status TEXT,
  p_force BOOLEAN DEFAULT false,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_trip RECORD;
  v_user_role TEXT;
  v_event_type TEXT;
  v_result JSON;
BEGIN
  -- Get user role
  v_user_role := get_user_role();
  
  -- Lock the trip row for update (concurrency control)
  SELECT * INTO v_trip
  FROM trips
  WHERE id = p_trip_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Trip not found');
  END IF;
  
  -- Validate state transitions
  IF v_trip.status = p_new_status THEN
    RETURN json_build_object('success', false, 'error', 'Trip already in target status');
  END IF;
  
  -- Valid transitions without force
  IF NOT p_force THEN
    -- scheduled -> inProgress
    IF v_trip.status = 'scheduled' AND p_new_status = 'inProgress' THEN
      v_event_type := 'started';
    -- inProgress -> completed
    ELSIF v_trip.status = 'inProgress' AND p_new_status = 'completed' THEN
      v_event_type := 'completed';
    -- inProgress -> cancelled
    ELSIF v_trip.status = 'inProgress' AND p_new_status = 'cancelled' THEN
      v_event_type := 'cancelled';
    -- scheduled -> cancelled
    ELSIF v_trip.status = 'scheduled' AND p_new_status = 'cancelled' THEN
      v_event_type := 'cancelled';
    ELSE
      RETURN json_build_object(
        'success', false, 
        'error', format('Invalid transition: %s -> %s (use force=true to override)', v_trip.status, p_new_status)
      );
    END IF;
  ELSE
    -- Force transitions (admin/operator only)
    IF v_user_role NOT IN ('admin', 'operator') THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient permissions for forced transition');
    END IF;
    
    -- completed -> inProgress (reopen)
    IF v_trip.status = 'completed' AND p_new_status = 'inProgress' THEN
      v_event_type := 'reopened';
    ELSE
      v_event_type := 'forced_transition';
    END IF;
  END IF;
  
  -- Update trip status
  UPDATE trips
  SET 
    status = p_new_status,
    actual_start_time = CASE 
      WHEN p_new_status = 'inProgress' AND actual_start_time IS NULL 
      THEN NOW() 
      ELSE actual_start_time 
    END,
    actual_end_time = CASE 
      WHEN p_new_status IN ('completed', 'cancelled') 
      THEN NOW() 
      ELSE actual_end_time 
    END,
    updated_at = NOW()
  WHERE id = p_trip_id;
  
  -- Log event
  INSERT INTO trip_events (trip_id, event_type, from_status, to_status, performed_by, forced, notes)
  VALUES (p_trip_id, v_event_type, v_trip.status, p_new_status, auth.uid(), p_force, p_notes);
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'trip_id', p_trip_id,
    'from_status', v_trip.status,
    'to_status', p_new_status,
    'event_type', v_event_type
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PART 5: TRIP SUMMARY CALCULATION (HAVERSINE)
-- ========================================

CREATE OR REPLACE FUNCTION calculate_trip_summary(p_trip_id UUID)
RETURNS VOID AS $$
DECLARE
  v_positions RECORD;
  v_total_distance NUMERIC := 0;
  v_max_speed NUMERIC := 0;
  v_total_speed NUMERIC := 0;
  v_position_count INTEGER := 0;
  v_prev_lat NUMERIC;
  v_prev_lng NUMERIC;
  v_prev_time TIMESTAMPTZ;
  v_first_time TIMESTAMPTZ;
  v_last_time TIMESTAMPTZ;
  v_duration_minutes INTEGER;
  v_distance_km NUMERIC;
BEGIN
  -- Get all positions for the trip ordered by timestamp
  FOR v_positions IN
    SELECT latitude, longitude, speed, timestamp
    FROM driver_positions
    WHERE trip_id = p_trip_id
    ORDER BY timestamp
  LOOP
    v_position_count := v_position_count + 1;
    
    -- Track max speed
    IF v_positions.speed IS NOT NULL AND v_positions.speed > v_max_speed THEN
      v_max_speed := v_positions.speed;
    END IF;
    
    -- Sum speed for average
    IF v_positions.speed IS NOT NULL THEN
      v_total_speed := v_total_speed + v_positions.speed;
    END IF;
    
    -- Track first and last timestamp
    IF v_first_time IS NULL THEN
      v_first_time := v_positions.timestamp;
    END IF;
    v_last_time := v_positions.timestamp;
    
    -- Calculate distance using Haversine formula
    IF v_prev_lat IS NOT NULL AND v_prev_lng IS NOT NULL THEN
      v_distance_km := (
        6371 * acos(
          cos(radians(v_prev_lat)) * 
          cos(radians(v_positions.latitude)) * 
          cos(radians(v_positions.longitude) - radians(v_prev_lng)) + 
          sin(radians(v_prev_lat)) * 
          sin(radians(v_positions.latitude))
        )
      );
      v_total_distance := v_total_distance + v_distance_km;
    END IF;
    
    v_prev_lat := v_positions.latitude;
    v_prev_lng := v_positions.longitude;
    v_prev_time := v_positions.timestamp;
  END LOOP;
  
  -- Calculate duration in minutes
  IF v_first_time IS NOT NULL AND v_last_time IS NOT NULL THEN
    v_duration_minutes := EXTRACT(EPOCH FROM (v_last_time - v_first_time)) / 60;
  ELSE
    v_duration_minutes := 0;
  END IF;
  
  -- Upsert summary
  INSERT INTO trip_summary (
    trip_id,
    total_distance_km,
    total_duration_minutes,
    max_speed_kmh,
    avg_speed_kmh,
    position_count,
    last_position_at,
    calculated_at
  )
  VALUES (
    p_trip_id,
    ROUND(v_total_distance, 2),
    v_duration_minutes,
    ROUND(v_max_speed, 2),
    CASE WHEN v_position_count > 0 THEN ROUND(v_total_speed / v_position_count, 2) ELSE 0 END,
    v_position_count,
    v_last_time,
    NOW()
  )
  ON CONFLICT (trip_id) DO UPDATE SET
    total_distance_km = ROUND(v_total_distance, 2),
    total_duration_minutes = v_duration_minutes,
    max_speed_kmh = ROUND(v_max_speed, 2),
    avg_speed_kmh = CASE WHEN v_position_count > 0 THEN ROUND(v_total_speed / v_position_count, 2) ELSE 0 END,
    position_count = v_position_count,
    last_position_at = v_last_time,
    calculated_at = NOW();
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalculate summary on position changes
CREATE OR REPLACE FUNCTION trigger_recalculate_trip_summary()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_trip_summary(OLD.trip_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_trip_summary(NEW.trip_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS driver_positions_summary_trigger ON driver_positions;

-- Create trigger
CREATE TRIGGER driver_positions_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON driver_positions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_trip_summary();

-- ========================================
-- PART 6: REPORTING VIEWS & MATERIALIZED VIEWS
-- ========================================

-- Base trip report view
CREATE OR REPLACE VIEW trip_report_view AS
SELECT 
  t.id AS trip_id,
  t.status,
  t.scheduled_start_time,
  t.actual_start_time,
  t.actual_end_time,
  r.name AS route_name,
  r.origin,
  r.destination,
  c.name AS company_name,
  u.name AS driver_name,
  u.email AS driver_email,
  ts.total_distance_km,
  ts.total_duration_minutes,
  ts.max_speed_kmh,
  ts.avg_speed_kmh,
  ts.position_count,
  (SELECT COUNT(*) FROM trip_passengers WHERE trip_id = t.id) AS passenger_count,
  t.created_at,
  t.updated_at
FROM trips t
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN companies c ON r.company_id = c.id
LEFT JOIN users u ON t.driver_id = u.id
LEFT JOIN trip_summary ts ON t.id = ts.trip_id;

-- Materialized view for faster analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mvw_trip_report AS
SELECT * FROM trip_report_view;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mvw_trip_report_id ON mvw_trip_report(trip_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_trip_report_mv()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mvw_trip_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule refresh every 1 minute using pg_cron
-- Note: pg_cron must be configured in your Supabase dashboard
DO $$
BEGIN
  -- Remove existing job if exists
  PERFORM cron.unschedule('refresh-trip-reports');
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist, continue
  NULL;
END $$;

SELECT cron.schedule(
  'refresh-trip-reports',
  '* * * * *', -- Every minute
  'SELECT refresh_trip_report_mv();'
);

-- ========================================
-- PART 7: ENABLE REALTIME (Instructions)
-- ========================================

-- IMPORTANT: Enable Realtime in Supabase Dashboard
-- Go to: Database > Replication > Enable realtime for 'driver_positions' table
-- This cannot be done via SQL migration alone

-- ========================================
-- END OF MIGRATION v7.4
-- ========================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
