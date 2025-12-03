-- ====================================================
-- GolfFox Transport Management System
-- Missing Schema Migration (Inferred from Codebase)
-- Date: 2025-12-03
-- ====================================================

-- ====================================================
-- PART 1: MISSING TABLES
-- ====================================================

-- Driver Positions (High frequency updates)
CREATE TABLE IF NOT EXISTS public.driver_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_positions_trip_id ON public.driver_positions(trip_id);
CREATE INDEX IF NOT EXISTS idx_driver_positions_timestamp ON public.driver_positions(timestamp DESC);

-- Route Stops (Points along a route)
CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  name TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius_m INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON public.route_stops(route_id);

-- Incidents (Alerts)
CREATE TABLE IF NOT EXISTS public.gf_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'investigating')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_company_id ON public.gf_incidents(company_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.gf_incidents(status);

-- Service Requests (Socorro/Assistance)
CREATE TABLE IF NOT EXISTS public.gf_service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL, -- 'socorro', 'manutencao', etc
  priority TEXT CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
  status TEXT DEFAULT 'open',
  payload JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_empresa_id ON public.gf_service_requests(empresa_id);

-- Trip Passengers (Manifest)
CREATE TABLE IF NOT EXISTS public.trip_passengers (
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarded', 'no_show', 'cancelled')),
  boarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (trip_id, passenger_id)
);

-- Trip Events (Audit/Log)
CREATE TABLE IF NOT EXISTS public.trip_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_events_trip_id ON public.trip_events(trip_id);

-- Checklists
CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklists_trip_id ON public.checklists(trip_id);

-- ====================================================
-- PART 2: MISSING VIEWS
-- ====================================================

-- View: vehicle_positions (Latest position per vehicle for Realtime)
-- Note: This is a simplified view. In production, consider a materialized view or a separate table updated by triggers.
CREATE OR REPLACE VIEW public.vehicle_positions AS
SELECT DISTINCT ON (t.vehicle_id)
  dp.id,
  t.vehicle_id,
  v.plate as license_plate,
  u.name as driver_name,
  dp.lat as latitude,
  dp.lng as longitude,
  CASE 
    WHEN dp.speed > 0.83 THEN 'active' -- > 3km/h
    ELSE 'active' -- Simplified, logic should be more complex
  END as status,
  dp.speed,
  dp.heading,
  dp.timestamp as updated_at,
  t.route_id,
  r.name as route_name,
  0 as passenger_count,
  v.capacity
FROM driver_positions dp
JOIN trips t ON dp.trip_id = t.id
JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN users u ON t.driver_id = u.id
LEFT JOIN routes r ON t.route_id = r.id
WHERE t.status = 'inProgress'
ORDER BY t.vehicle_id, dp.timestamp DESC;

-- View: profiles (User + Metadata wrapper)
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
  id,
  email,
  name,
  role,
  company_id,
  carrier_id,
  created_at,
  updated_at
FROM users;

-- View: v_costs_secure (Secure view for costs export)
CREATE OR REPLACE VIEW public.v_costs_secure AS
SELECT 
  c.id,
  c.company_id,
  comp.name as company_name,
  c.cost_date as date,
  cat.name as group_name, -- Assuming category is group for now
  cat.name as category,
  cat.description as subcategory,
  r.name as route_name,
  v.plate as vehicle_plate,
  u.email as driver_email,
  c.amount,
  c.qty,
  c.unit,
  c.source,
  c.notes,
  c.route_id,
  c.vehicle_id,
  c.driver_id,
  c.cost_category_id
FROM gf_costs c
JOIN companies comp ON c.company_id = comp.id
JOIN gf_cost_categories cat ON c.cost_category_id = cat.id
LEFT JOIN routes r ON c.route_id = r.id
LEFT JOIN vehicles v ON c.vehicle_id = v.id
LEFT JOIN users u ON c.driver_id = u.id;

-- ====================================================
-- PART 3: RLS POLICIES FOR NEW TABLES
-- ====================================================

ALTER TABLE public.driver_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- Driver Positions: Service role full access, drivers can insert, others read via trips
CREATE POLICY "Service role full access on driver_positions" ON public.driver_positions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Drivers can insert their positions" ON public.driver_positions FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Users can read positions for their company trips" ON public.driver_positions FOR SELECT TO authenticated USING (
  trip_id IN (SELECT id FROM trips WHERE route_id IN (SELECT id FROM routes WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())))
);

-- Route Stops: Read access for company users
CREATE POLICY "Service role full access on route_stops" ON public.route_stops FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can read stops for their company routes" ON public.route_stops FOR SELECT TO authenticated USING (
  route_id IN (SELECT id FROM routes WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid()))
);

-- Incidents: Company users can read/create
CREATE POLICY "Service role full access on gf_incidents" ON public.gf_incidents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can read incidents for their company" ON public.gf_incidents FOR SELECT TO authenticated USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "Users can create incidents for their company" ON public.gf_incidents FOR INSERT TO authenticated WITH CHECK (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

-- Service Requests: Company users can read/create
CREATE POLICY "Service role full access on gf_service_requests" ON public.gf_service_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can read requests for their company" ON public.gf_service_requests FOR SELECT TO authenticated USING (
  empresa_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

-- ====================================================
-- PART 4: RPCs
-- ====================================================

-- RPC: Trip Transition (Placeholder)
CREATE OR REPLACE FUNCTION public.rpc_trip_transition(
  p_trip UUID,
  p_new_status TEXT,
  p_description TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_force BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip trips%ROWTYPE;
BEGIN
  SELECT * INTO v_trip FROM trips WHERE id = p_trip;
  
  IF v_trip.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trip not found');
  END IF;

  UPDATE trips SET status = p_new_status, updated_at = NOW() WHERE id = p_trip;
  
  -- Log event
  INSERT INTO trip_events (trip_id, event_type, payload)
  VALUES (p_trip, 'status_change', jsonb_build_object('old', v_trip.status, 'new', p_new_status, 'desc', p_description, 'lat', p_lat, 'lng', p_lng));

  RETURN jsonb_build_object('success', true, 'status', p_new_status);
END;
$$;
