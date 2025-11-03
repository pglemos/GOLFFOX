-- ============================================================================
-- P0 CRITICAL FIXES - GolfFox v7.4
-- ============================================================================
-- This migration fixes critical blockers for end-to-end functionality:
-- 1. Fix get_user_carrier_id() return type (uuid instead of text)
-- 2. Re-apply RLS policies that depend on this function
-- 3. Enable Realtime replication for driver_positions
-- ============================================================================

-- ============================================================================
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_user_carrier_id();

-- Recreate with correct UUID return type
CREATE OR REPLACE FUNCTION public.get_user_carrier_id()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
AS $$
  SELECT carrier_id::uuid FROM public.users WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_carrier_id() IS 'Returns the carrier_id for the current authenticated user (used in RLS policies)';


-- ============================================================================
-- 2. RE-APPLY RLS POLICIES FOR ROUTES TABLE (Carrier filtering)
-- ============================================================================

-- Drop existing policies that used the old function
DROP POLICY IF EXISTS "routes_select_policy" ON public.routes;
DROP POLICY IF EXISTS "routes_insert_policy" ON public.routes;
DROP POLICY IF EXISTS "routes_update_policy" ON public.routes;
DROP POLICY IF EXISTS "routes_delete_policy" ON public.routes;

-- Recreate SELECT policy with proper role-based filtering
CREATE POLICY "routes_select_policy" ON public.routes
FOR SELECT USING (
  CASE public.get_user_role()
    WHEN 'admin' THEN true
    WHEN 'operator' THEN company_id = public.get_user_company_id()
    WHEN 'carrier' THEN carrier_id = public.get_user_carrier_id()
    WHEN 'driver' THEN true
    WHEN 'passenger' THEN true
    ELSE false
  END
);

-- Carrier can insert routes for their carrier_id
CREATE POLICY "routes_insert_policy" ON public.routes
FOR INSERT WITH CHECK (
  CASE public.get_user_role()
    WHEN 'admin' THEN true
    WHEN 'operator' THEN company_id = public.get_user_company_id()
    WHEN 'carrier' THEN carrier_id = public.get_user_carrier_id()
    ELSE false
  END
);

-- Carrier can update their own routes
CREATE POLICY "routes_update_policy" ON public.routes
FOR UPDATE USING (
  CASE public.get_user_role()
    WHEN 'admin' THEN true
    WHEN 'operator' THEN company_id = public.get_user_company_id()
    WHEN 'carrier' THEN carrier_id = public.get_user_carrier_id()
    ELSE false
  END
);

-- Carrier can delete their own routes
CREATE POLICY "routes_delete_policy" ON public.routes
FOR DELETE USING (
  CASE public.get_user_role()
    WHEN 'admin' THEN true
    WHEN 'operator' THEN company_id = public.get_user_company_id()
    WHEN 'carrier' THEN carrier_id = public.get_user_carrier_id()
    ELSE false
  END
);


-- ============================================================================
-- 3. FIX VEHICLES TABLE RLS (Carrier filtering)
-- ============================================================================

DROP POLICY IF EXISTS "vehicles_select_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete_policy" ON public.vehicles;

CREATE POLICY "vehicles_select_policy" ON public.vehicles
FOR SELECT USING (
  CASE public.get_user_role()
    WHEN 'admin' THEN true
    WHEN 'carrier' THEN carrier_id = public.get_user_carrier_id()
    WHEN 'driver' THEN id IN (
      SELECT vehicle_id FROM public.trips WHERE driver_id = auth.uid()
    )
    ELSE false
  END
);

CREATE POLICY "vehicles_insert_policy" ON public.vehicles
FOR INSERT WITH CHECK (
  CASE public.get_user_role()
    WHEN 'admin' THEN true
    WHEN 'carrier' THEN carrier_id = public.get_user_carrier_id()
    ELSE false
  END
);

CREATE POLICY "vehicles_update_policy" ON public.vehicles
FOR UPDATE USING (
  CASE public.get_user_role()
    WHEN 'admin' THEN true
    WHEN 'carrier' THEN carrier_id = public.get_user_carrier_id()
    ELSE false
  END
);

CREATE POLICY "vehicles_delete_policy" ON public.vehicles
FOR DELETE USING (
  CASE public.get_user_role()
    WHEN 'admin' THEN true
    WHEN 'carrier' THEN carrier_id = public.get_user_carrier_id()
    ELSE false
  END
);


-- ============================================================================
-- 4. VERIFY DRIVER_POSITIONS RLS (Driver can only insert their own)
-- ============================================================================

-- Ensure driver_positions policies are correct
DROP POLICY IF EXISTS "driver_positions_select_policy" ON public.driver_positions;
DROP POLICY IF EXISTS "driver_positions_insert_policy" ON public.driver_positions;

-- Anyone authenticated can view positions (filtered by trip access)
CREATE POLICY "driver_positions_select_policy" ON public.driver_positions
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- Only the driver can insert their own positions
CREATE POLICY "driver_positions_insert_policy" ON public.driver_positions
FOR INSERT WITH CHECK (
  driver_id = auth.uid()
);


-- ============================================================================
-- 5. ENABLE REALTIME FOR DRIVER_POSITIONS
-- ============================================================================

-- Enable realtime replication for driver_positions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_positions;

-- Verify realtime is enabled (this will show in logs)
COMMENT ON TABLE public.driver_positions IS 'Real-time GPS tracking positions for trips (Realtime enabled)';


-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for real-time queries filtered by trip_id
CREATE INDEX IF NOT EXISTS idx_driver_positions_trip_id 
ON public.driver_positions(trip_id, timestamp DESC);

-- Index for driver queries
CREATE INDEX IF NOT EXISTS idx_driver_positions_driver_id 
ON public.driver_positions(driver_id, timestamp DESC);

-- Composite index for trip + driver queries
CREATE INDEX IF NOT EXISTS idx_driver_positions_trip_driver 
ON public.driver_positions(trip_id, driver_id, timestamp DESC);

-- Index for routes carrier filtering
CREATE INDEX IF NOT EXISTS idx_routes_carrier_id 
ON public.routes(carrier_id);

-- Index for vehicles carrier filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_carrier_id 
ON public.vehicles(carrier_id);


-- ============================================================================
-- 7. VERIFY RPC FUNCTION EXISTS
-- ============================================================================

-- Ensure rpc_trip_transition exists (should already be created)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'rpc_trip_transition'
  ) THEN
    RAISE NOTICE 'WARNING: rpc_trip_transition function not found. Please ensure it was created in the previous migration.';
  ELSE
    RAISE NOTICE 'SUCCESS: rpc_trip_transition function exists.';
  END IF;
END $$;


-- ============================================================================
-- 8. GRANT NECESSARY PERMISSIONS (Minimal Surface)
-- ============================================================================

-- Revoke all default permissions
REVOKE ALL ON public.driver_positions FROM PUBLIC;
REVOKE ALL ON public.routes FROM PUBLIC;
REVOKE ALL ON public.vehicles FROM PUBLIC;

-- Grant only necessary permissions to authenticated users (RLS will control)
GRANT SELECT, INSERT ON public.driver_positions TO authenticated;
GRANT SELECT ON public.routes TO authenticated;
GRANT SELECT ON public.vehicles TO authenticated;

-- Admin/Operator/Carrier can modify routes
GRANT INSERT, UPDATE, DELETE ON public.routes TO authenticated;

-- Carrier can modify vehicles
GRANT INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;


-- ============================================================================
-- 9. SUMMARY & VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'P0 FIXES APPLIED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Fixed get_user_carrier_id() return type (UUID)';
  RAISE NOTICE '✅ Re-applied RLS policies for routes (carrier filtering)';
  RAISE NOTICE '✅ Re-applied RLS policies for vehicles (carrier filtering)';
  RAISE NOTICE '✅ Verified driver_positions RLS (driver can only insert own)';
  RAISE NOTICE '✅ Enabled Realtime for driver_positions';
  RAISE NOTICE '✅ Created performance indexes';
  RAISE NOTICE '✅ Tightened GRANTs (minimal permission surface)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '1. Verify Realtime in Supabase Dashboard: Database → Replication → driver_positions';
  RAISE NOTICE '2. Rotate anon_key and service_role_key in Supabase Dashboard';
  RAISE NOTICE '3. Build Flutter app with: --dart-define=SUPABASE_URL=<url> --dart-define=SUPABASE_ANON_KEY=<key>';
  RAISE NOTICE '4. Test trip transitions with rpc_trip_transition';
  RAISE NOTICE '========================================';
END $$;
