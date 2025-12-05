-- ====================================================
-- GolfFox Transport Management System
-- Improve RPC Trip Transition with Concurrency Control
-- Date: 2025-01-XX
-- ====================================================
-- This migration improves the rpc_trip_transition function with:
-- - SELECT FOR UPDATE for concurrency control
-- - State transition validation
-- - Role-based permission checks
-- - Force mode for admin/operator reopen
-- - Automatic timestamp updates

-- ====================================================
-- PART 1: DROP EXISTING FUNCTION
-- ====================================================

DROP FUNCTION IF EXISTS public.rpc_trip_transition(UUID, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN);

-- ====================================================
-- PART 2: IMPROVED RPC FUNCTION
-- ====================================================

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
  v_can_transition BOOLEAN := false;
  v_transition_valid BOOLEAN := false;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  v_user_role := public.current_role();
  v_is_admin := public.is_admin();
  v_is_operator := (v_user_role = 'operator');
  v_is_carrier := (v_user_role = 'carrier');
  v_is_driver := (v_user_role = 'driver');

  -- Validate new status
  IF p_new_status NOT IN ('scheduled', 'inProgress', 'completed', 'cancelled') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid status: ' || p_new_status,
      'code', 'invalid_status'
    );
  END IF;

  -- ✅ CRITICAL: SELECT FOR UPDATE locks the row to prevent race conditions
  -- This ensures only one transaction can modify the trip at a time
  SELECT * INTO v_trip
  FROM public.trips
  WHERE id = p_trip_id
  FOR UPDATE;

  -- Check if trip exists
  IF v_trip.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Trip not found',
      'code', 'trip_not_found'
    );
  END IF;

  v_current_status := v_trip.status;

  -- If status hasn't changed, return success (idempotent)
  IF v_current_status = p_new_status THEN
    RETURN jsonb_build_object(
      'success', true,
      'status', p_new_status,
      'message', 'Status already set',
      'trip_id', p_trip_id
    );
  END IF;

  -- ✅ Validate state transitions
  -- Valid transitions:
  -- - scheduled → inProgress (Driver starts)
  -- - inProgress → completed (Driver completes)
  -- - inProgress → cancelled (Admin/Operator/Carrier cancels)
  -- - scheduled → cancelled (Admin/Operator/Carrier cancels)
  -- - completed → inProgress (Admin/Operator reopen with force=true)

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

  -- ✅ Check permissions based on role and transition type
  -- Drivers can only start/complete their own trips
  IF v_is_driver THEN
    IF v_trip.driver_id != v_user_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Driver can only modify own trips',
        'code', 'permission_denied'
      );
    END IF;
    
    -- Drivers can start scheduled trips or complete inProgress trips
    IF NOT (
      (v_current_status = 'scheduled' AND p_new_status = 'inProgress') OR
      (v_current_status = 'inProgress' AND p_new_status = 'completed')
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Driver can only start or complete trips',
        'code', 'permission_denied'
      );
    END IF;
  END IF;

  -- Admin/Operator/Carrier can cancel trips
  IF p_new_status = 'cancelled' THEN
    IF NOT (v_is_admin OR v_is_operator OR v_is_carrier) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Only admin, operator, or carrier can cancel trips',
        'code', 'permission_denied'
      );
    END IF;
  END IF;

  -- Force mode (reopen completed trip) - only admin/operator/carrier
  IF p_force AND v_current_status = 'completed' AND p_new_status = 'inProgress' THEN
    IF NOT (v_is_admin OR v_is_operator OR v_is_carrier) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Only admin, operator, or carrier can force reopen trips',
        'code', 'permission_denied'
      );
    END IF;
  END IF;

  -- ✅ Update trip status and timestamps
  UPDATE public.trips
  SET
    status = p_new_status,
    updated_at = NOW(),
    -- Set actual_start_time when transitioning to inProgress
    actual_start_time = CASE
      WHEN p_new_status = 'inProgress' AND actual_start_time IS NULL THEN NOW()
      ELSE actual_start_time
    END,
    -- Set actual_end_time when transitioning to completed or cancelled
    actual_end_time = CASE
      WHEN p_new_status IN ('completed', 'cancelled') AND actual_end_time IS NULL THEN NOW()
      ELSE actual_end_time
    END,
    -- Update start coordinates if provided and transitioning to inProgress
    start_latitude = CASE
      WHEN p_new_status = 'inProgress' AND p_lat IS NOT NULL THEN p_lat
      ELSE start_latitude
    END,
    start_longitude = CASE
      WHEN p_new_status = 'inProgress' AND p_lng IS NOT NULL THEN p_lng
      ELSE start_longitude
    END,
    -- Update end coordinates if provided and transitioning to completed/cancelled
    end_latitude = CASE
      WHEN p_new_status IN ('completed', 'cancelled') AND p_lat IS NOT NULL THEN p_lat
      ELSE end_latitude
    END,
    end_longitude = CASE
      WHEN p_new_status IN ('completed', 'cancelled') AND p_lng IS NOT NULL THEN p_lng
      ELSE end_longitude
    END
  WHERE id = p_trip_id;

  -- ✅ Log event to trip_events for audit trail
  INSERT INTO public.trip_events (
    trip_id,
    event_type,
    payload
  ) VALUES (
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

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'status', p_new_status,
    'trip_id', p_trip_id,
    'previous_status', v_current_status,
    'message', 'Trip status updated successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return failure
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', 'internal_error'
    );
END;
$$;

-- ====================================================
-- PART 3: COMMENTS FOR DOCUMENTATION
-- ====================================================

COMMENT ON FUNCTION public.rpc_trip_transition(UUID, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN) IS 
'Transition trip status with concurrency control, state validation, and role-based permissions. 
Valid transitions:
- scheduled → inProgress (Driver starts)
- scheduled → cancelled (Admin/Operator/Carrier cancels)
- inProgress → completed (Driver completes)
- inProgress → cancelled (Admin/Operator/Carrier cancels)
- completed → inProgress (Admin/Operator/Carrier reopen with force=true)

Uses SELECT FOR UPDATE to prevent race conditions.';

-- ====================================================
-- END OF MIGRATION
-- ====================================================

