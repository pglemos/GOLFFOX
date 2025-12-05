-- ====================================================
-- GolfFox Transport Management System
-- Canonical RLS Policies Migration
-- Date: 2025-01-XX
-- ====================================================
-- This migration replaces basic RLS policies with canonical role-based policies
-- Policies follow the principle of least privilege per role

-- ====================================================
-- PART 1: DROP EXISTING BASIC POLICIES
-- ====================================================

-- Drop existing policies (idempotent)
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

-- ====================================================
-- PART 2: CANONICAL POLICIES FOR COMPANIES
-- ====================================================

-- Service role: Full access
CREATE POLICY "service_role_full_access_companies"
  ON public.companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin: Full access
CREATE POLICY "admin_full_access_companies"
  ON public.companies
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Operator: Read own company, update own company
CREATE POLICY "operator_read_own_company"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'operator' AND
    id = public.current_company_id()
  );

CREATE POLICY "operator_update_own_company"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    public.current_role() = 'operator' AND
    id = public.current_company_id()
  )
  WITH CHECK (
    public.current_role() = 'operator' AND
    id = public.current_company_id()
  );

-- Carrier: Read own company (if linked)
CREATE POLICY "carrier_read_own_company"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'carrier' AND
    id = public.current_company_id()
  );

-- ====================================================
-- PART 3: CANONICAL POLICIES FOR USERS
-- ====================================================

-- Service role: Full access
CREATE POLICY "service_role_full_access_users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin: Full access
CREATE POLICY "admin_full_access_users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Operator: Read users from own company
CREATE POLICY "operator_read_company_users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'operator' AND
    company_id = public.current_company_id()
  );

-- Carrier: Read users from own carrier
CREATE POLICY "carrier_read_carrier_users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'carrier' AND
    carrier_id = public.current_carrier_id()
  );

-- Driver: Read own profile, update own profile
CREATE POLICY "driver_read_own_profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'driver' AND
    id = auth.uid()
  );

CREATE POLICY "driver_update_own_profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    public.current_role() = 'driver' AND
    id = auth.uid()
  )
  WITH CHECK (
    public.current_role() = 'driver' AND
    id = auth.uid()
  );

-- Passenger: Read own profile
CREATE POLICY "passenger_read_own_profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'passenger' AND
    id = auth.uid()
  );

-- All authenticated: Read own profile (fallback)
CREATE POLICY "authenticated_read_own_profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ====================================================
-- PART 4: CANONICAL POLICIES FOR ROUTES
-- ====================================================

-- Service role: Full access
CREATE POLICY "service_role_full_access_routes"
  ON public.routes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin: Full access
CREATE POLICY "admin_full_access_routes"
  ON public.routes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Operator: Full access to own company routes
CREATE POLICY "operator_full_access_company_routes"
  ON public.routes
  FOR ALL
  TO authenticated
  USING (
    public.current_role() = 'operator' AND
    company_id = public.current_company_id()
  )
  WITH CHECK (
    public.current_role() = 'operator' AND
    company_id = public.current_company_id()
  );

-- Carrier: Read routes for own carrier
CREATE POLICY "carrier_read_carrier_routes"
  ON public.routes
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'carrier' AND
    carrier_id = public.current_carrier_id()
  );

-- Driver: Read routes for assigned trips
CREATE POLICY "driver_read_assigned_routes"
  ON public.routes
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'driver' AND
    id IN (
      SELECT route_id FROM public.trips
      WHERE driver_id = auth.uid()
    )
  );

-- Passenger: Read routes for assigned trips
CREATE POLICY "passenger_read_assigned_routes"
  ON public.routes
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'passenger' AND
    id IN (
      SELECT route_id FROM public.trips
      WHERE id IN (
        SELECT trip_id FROM public.trip_passengers
        WHERE passenger_id = auth.uid()
      )
    )
  );

-- ====================================================
-- PART 5: CANONICAL POLICIES FOR VEHICLES
-- ====================================================

-- Service role: Full access
CREATE POLICY "service_role_full_access_vehicles"
  ON public.vehicles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin: Full access
CREATE POLICY "admin_full_access_vehicles"
  ON public.vehicles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Operator: Full access to own company vehicles
CREATE POLICY "operator_full_access_company_vehicles"
  ON public.vehicles
  FOR ALL
  TO authenticated
  USING (
    public.current_role() = 'operator' AND
    company_id = public.current_company_id()
  )
  WITH CHECK (
    public.current_role() = 'operator' AND
    company_id = public.current_company_id()
  );

-- Carrier: Full access to own carrier vehicles
CREATE POLICY "carrier_full_access_carrier_vehicles"
  ON public.vehicles
  FOR ALL
  TO authenticated
  USING (
    public.current_role() = 'carrier' AND
    carrier_id = public.current_carrier_id()
  )
  WITH CHECK (
    public.current_role() = 'carrier' AND
    carrier_id = public.current_carrier_id()
  );

-- Driver: Read vehicles assigned to own trips
CREATE POLICY "driver_read_assigned_vehicles"
  ON public.vehicles
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'driver' AND
    id IN (
      SELECT vehicle_id FROM public.trips
      WHERE driver_id = auth.uid()
    )
  );

-- ====================================================
-- PART 6: CANONICAL POLICIES FOR TRIPS
-- ====================================================

-- Service role: Full access
CREATE POLICY "service_role_full_access_trips"
  ON public.trips
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin: Full access
CREATE POLICY "admin_full_access_trips"
  ON public.trips
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Operator: Full access to own company trips
CREATE POLICY "operator_full_access_company_trips"
  ON public.trips
  FOR ALL
  TO authenticated
  USING (
    public.current_role() = 'operator' AND
    route_id IN (
      SELECT id FROM public.routes
      WHERE company_id = public.current_company_id()
    )
  )
  WITH CHECK (
    public.current_role() = 'operator' AND
    route_id IN (
      SELECT id FROM public.routes
      WHERE company_id = public.current_company_id()
    )
  );

-- Carrier: Read trips for own carrier routes
CREATE POLICY "carrier_read_carrier_trips"
  ON public.trips
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'carrier' AND
    route_id IN (
      SELECT id FROM public.routes
      WHERE carrier_id = public.current_carrier_id()
    )
  );

-- Driver: Full access to own trips
CREATE POLICY "driver_full_access_own_trips"
  ON public.trips
  FOR ALL
  TO authenticated
  USING (
    public.current_role() = 'driver' AND
    driver_id = auth.uid()
  )
  WITH CHECK (
    public.current_role() = 'driver' AND
    driver_id = auth.uid()
  );

-- Passenger: Read assigned trips
CREATE POLICY "passenger_read_assigned_trips"
  ON public.trips
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'passenger' AND
    id IN (
      SELECT trip_id FROM public.trip_passengers
      WHERE passenger_id = auth.uid()
    )
  );

-- ====================================================
-- PART 7: CANONICAL POLICIES FOR COST CATEGORIES
-- ====================================================

-- Service role: Full access
CREATE POLICY "service_role_full_access_cost_categories"
  ON public.gf_cost_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- All authenticated: Read active categories
CREATE POLICY "authenticated_read_active_cost_categories"
  ON public.gf_cost_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admin: Full access
CREATE POLICY "admin_full_access_cost_categories"
  ON public.gf_cost_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================================================
-- PART 8: CANONICAL POLICIES FOR COSTS
-- ====================================================

-- Service role: Full access
CREATE POLICY "service_role_full_access_costs"
  ON public.gf_costs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin: Full access
CREATE POLICY "admin_full_access_costs"
  ON public.gf_costs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Operator: Full access to own company costs
CREATE POLICY "operator_full_access_company_costs"
  ON public.gf_costs
  FOR ALL
  TO authenticated
  USING (
    public.current_role() = 'operator' AND
    company_id = public.current_company_id()
  )
  WITH CHECK (
    public.current_role() = 'operator' AND
    company_id = public.current_company_id()
  );

-- Carrier: Read costs for own carrier
CREATE POLICY "carrier_read_carrier_costs"
  ON public.gf_costs
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'carrier' AND
    carrier_id = public.current_carrier_id()
  );

-- ====================================================
-- PART 9: CANONICAL POLICIES FOR DRIVER POSITIONS
-- ====================================================

-- Service role: Full access
CREATE POLICY "service_role_full_access_driver_positions"
  ON public.driver_positions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin: Full access
CREATE POLICY "admin_full_access_driver_positions"
  ON public.driver_positions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Driver: Insert own positions
CREATE POLICY "driver_insert_own_positions"
  ON public.driver_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_role() = 'driver' AND
    driver_id = auth.uid()
  );

-- Operator: Read positions for own company trips
CREATE POLICY "operator_read_company_trip_positions"
  ON public.driver_positions
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'operator' AND
    trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.routes r ON t.route_id = r.id
      WHERE r.company_id = public.current_company_id()
    )
  );

-- Carrier: Read positions for own carrier trips
CREATE POLICY "carrier_read_carrier_trip_positions"
  ON public.driver_positions
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'carrier' AND
    trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.routes r ON t.route_id = r.id
      WHERE r.carrier_id = public.current_carrier_id()
    )
  );

-- Driver: Read positions for own trips
CREATE POLICY "driver_read_own_trip_positions"
  ON public.driver_positions
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'driver' AND
    trip_id IN (
      SELECT id FROM public.trips
      WHERE driver_id = auth.uid()
    )
  );

-- ====================================================
-- END OF MIGRATION
-- ====================================================

