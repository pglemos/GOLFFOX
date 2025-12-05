-- ====================================================
-- GolfFox Transport Management System
-- Validation Script - Post Migration
-- Date: 2025-01-XX
-- ====================================================
-- Execute este script após aplicar as migrations para validar
-- que tudo foi aplicado corretamente

-- ====================================================
-- PART 1: VALIDATE HELPER FUNCTIONS
-- ====================================================

DO $$
DECLARE
  v_count INTEGER;
  v_missing TEXT[] := ARRAY[]::TEXT[];
  v_expected TEXT[] := ARRAY['is_admin', 'current_role', 'current_company_id', 'current_carrier_id', 'get_user_by_id_for_login'];
  v_func TEXT;
BEGIN
  RAISE NOTICE '=== VALIDATING HELPER FUNCTIONS ===';
  
  FOREACH v_func IN ARRAY v_expected
  LOOP
    SELECT COUNT(*) INTO v_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = v_func;
    
    IF v_count = 0 THEN
      v_missing := array_append(v_missing, v_func);
      RAISE NOTICE '❌ MISSING: %', v_func;
    ELSE
      RAISE NOTICE '✅ FOUND: %', v_func;
    END IF;
  END LOOP;
  
  IF array_length(v_missing, 1) > 0 THEN
    RAISE WARNING 'Missing helper functions: %', array_to_string(v_missing, ', ');
  ELSE
    RAISE NOTICE '✅ All helper functions present';
  END IF;
END $$;

-- ====================================================
-- PART 2: VALIDATE RLS POLICIES
-- ====================================================

DO $$
DECLARE
  v_policy_count INTEGER;
  v_table_count INTEGER;
BEGIN
  RAISE NOTICE '=== VALIDATING RLS POLICIES ===';
  
  SELECT COUNT(DISTINCT tablename) INTO v_table_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE 'Tables with policies: %', v_table_count;
  RAISE NOTICE 'Total policies: %', v_policy_count;
  
  IF v_policy_count < 30 THEN
    RAISE WARNING 'Expected at least 30 policies, found %', v_policy_count;
  ELSE
    RAISE NOTICE '✅ RLS policies count OK';
  END IF;
END $$;

-- ====================================================
-- PART 3: VALIDATE RPC FUNCTIONS
-- ====================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '=== VALIDATING RPC FUNCTIONS ===';
  
  SELECT COUNT(*) INTO v_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = 'rpc_trip_transition';
  
  IF v_count = 0 THEN
    RAISE WARNING '❌ rpc_trip_transition NOT FOUND';
  ELSE
    RAISE NOTICE '✅ rpc_trip_transition found';
  END IF;
END $$;

-- ====================================================
-- PART 4: VALIDATE TRIP SUMMARY
-- ====================================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_function_exists BOOLEAN;
  v_trigger_exists BOOLEAN;
BEGIN
  RAISE NOTICE '=== VALIDATING TRIP SUMMARY ===';
  
  -- Check table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trip_summary'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    RAISE NOTICE '✅ trip_summary table exists';
  ELSE
    RAISE WARNING '❌ trip_summary table NOT FOUND';
  END IF;
  
  -- Check function
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'calculate_trip_summary'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    RAISE NOTICE '✅ calculate_trip_summary function exists';
  ELSE
    RAISE WARNING '❌ calculate_trip_summary function NOT FOUND';
  END IF;
  
  -- Check haversine function
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'haversine_distance'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    RAISE NOTICE '✅ haversine_distance function exists';
  ELSE
    RAISE WARNING '❌ haversine_distance function NOT FOUND';
  END IF;
  
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND trigger_name = 'trg_driver_positions_recalc_summary'
  ) INTO v_trigger_exists;
  
  IF v_trigger_exists THEN
    RAISE NOTICE '✅ trg_driver_positions_recalc_summary trigger exists';
  ELSE
    RAISE WARNING '❌ trg_driver_positions_recalc_summary trigger NOT FOUND';
  END IF;
END $$;

-- ====================================================
-- PART 5: VALIDATE gf_user_company_map
-- ====================================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== VALIDATING gf_user_company_map ===';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gf_user_company_map'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    RAISE NOTICE '✅ gf_user_company_map table exists';
    
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gf_user_company_map';
    
    RAISE NOTICE 'RLS policies on gf_user_company_map: %', v_policy_count;
    
    IF v_policy_count < 4 THEN
      RAISE WARNING 'Expected at least 4 policies, found %', v_policy_count;
    END IF;
  ELSE
    RAISE WARNING '❌ gf_user_company_map table NOT FOUND';
  END IF;
END $$;

-- ====================================================
-- PART 6: VALIDATE RLS ENABLED ON CRITICAL TABLES
-- ====================================================

DO $$
DECLARE
  v_tables TEXT[] := ARRAY['users', 'companies', 'routes', 'vehicles', 'trips', 'driver_positions', 'gf_costs', 'trip_summary', 'gf_user_company_map'];
  v_table TEXT;
  v_rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '=== VALIDATING RLS ENABLED ===';
  
  FOREACH v_table IN ARRAY v_tables
  LOOP
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class
    WHERE relname = v_table AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    IF v_rls_enabled THEN
      RAISE NOTICE '✅ RLS enabled on %', v_table;
    ELSE
      RAISE WARNING '❌ RLS NOT enabled on %', v_table;
    END IF;
  END LOOP;
END $$;

-- ====================================================
-- PART 7: SUMMARY
-- ====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VALIDATION COMPLETE ===';
  RAISE NOTICE 'Review the messages above for any warnings or errors.';
  RAISE NOTICE 'All checks marked with ✅ should be present.';
END $$;

