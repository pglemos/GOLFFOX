-- ⚠️ DEPRECATED: This file contains legacy permissive policies
-- ⚠️ USE: lib/supabase/migration_v7_4_canonical.sql instead
-- ⚠️ The new migration includes canonical role-based RLS policies

-- Enable Row Level Security on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_passengers ENABLE ROW LEVEL SECURITY;

-- Users table policies (special case for signups)
CREATE POLICY "Users can view all users" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert themselves on signup" ON users
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (true);

CREATE POLICY "Users can delete their own profile" ON users
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- Companies table policies
CREATE POLICY "Authenticated users can view companies" ON companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert companies" ON companies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies" ON companies
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete companies" ON companies
  FOR DELETE TO authenticated USING (true);

-- Routes table policies
CREATE POLICY "Authenticated users can view routes" ON routes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert routes" ON routes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update routes" ON routes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete routes" ON routes
  FOR DELETE TO authenticated USING (true);

-- Vehicles table policies
CREATE POLICY "Authenticated users can view vehicles" ON vehicles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert vehicles" ON vehicles
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles" ON vehicles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicles" ON vehicles
  FOR DELETE TO authenticated USING (true);

-- Trips table policies
CREATE POLICY "Authenticated users can view trips" ON trips
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert trips" ON trips
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update trips" ON trips
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete trips" ON trips
  FOR DELETE TO authenticated USING (true);

-- Driver positions table policies
CREATE POLICY "Authenticated users can view driver positions" ON driver_positions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert driver positions" ON driver_positions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update driver positions" ON driver_positions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete driver positions" ON driver_positions
  FOR DELETE TO authenticated USING (true);

-- Trip passengers table policies
CREATE POLICY "Authenticated users can view trip passengers" ON trip_passengers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert trip passengers" ON trip_passengers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update trip passengers" ON trip_passengers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete trip passengers" ON trip_passengers
  FOR DELETE TO authenticated USING (true);
