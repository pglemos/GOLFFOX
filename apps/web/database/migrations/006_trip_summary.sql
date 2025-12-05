-- ====================================================
-- GolfFox Transport Management System
-- Trip Summary Implementation
-- Date: 2025-01-XX
-- ====================================================
-- This migration creates:
-- - trip_summary table for calculated trip metrics
-- - calculate_trip_summary function using Haversine formula
-- - Trigger to automatically recalculate summary on position changes

-- ====================================================
-- PART 1: CREATE TRIP_SUMMARY TABLE
-- ====================================================

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

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_trip_summary_trip_id ON public.trip_summary(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_summary_calculated_at ON public.trip_summary(calculated_at DESC);

-- Enable RLS
ALTER TABLE public.trip_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_summary
CREATE POLICY "service_role_full_access_trip_summary"
  ON public.trip_summary
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "admin_full_access_trip_summary"
  ON public.trip_summary
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "operator_read_company_trip_summaries"
  ON public.trip_summary
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

CREATE POLICY "carrier_read_carrier_trip_summaries"
  ON public.trip_summary
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

CREATE POLICY "driver_read_own_trip_summaries"
  ON public.trip_summary
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'driver' AND
    trip_id IN (
      SELECT id FROM public.trips
      WHERE driver_id = auth.uid()
    )
  );

CREATE POLICY "passenger_read_assigned_trip_summaries"
  ON public.trip_summary
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'passenger' AND
    trip_id IN (
      SELECT trip_id FROM public.trip_passengers
      WHERE passenger_id = auth.uid()
    )
  );

-- ====================================================
-- PART 2: HAVERSINE FUNCTION
-- ====================================================

-- Function to calculate distance between two GPS coordinates using Haversine formula
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
  R NUMERIC := 6371; -- Earth radius in kilometers
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a NUMERIC;
  c NUMERIC;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat / 2) * sin(dlat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon / 2) * sin(dlon / 2);
  
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  -- Return distance in kilometers
  RETURN ROUND(R * c, 2);
END;
$$;

-- ====================================================
-- PART 3: CALCULATE TRIP SUMMARY FUNCTION
-- ====================================================

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
  v_prev_lat DOUBLE PRECISION;
  v_prev_lng DOUBLE PRECISION;
  v_prev_timestamp TIMESTAMPTZ;
  v_segment_distance NUMERIC;
  v_segment_duration INTEGER;
BEGIN
  -- Get position count and timestamps
  SELECT 
    COUNT(*),
    MIN(timestamp),
    MAX(timestamp)
  INTO
    v_position_count,
    v_first_position_at,
    v_last_position_at
  FROM public.driver_positions
  WHERE trip_id = p_trip_id;

  -- If no positions, create empty summary
  IF v_position_count = 0 THEN
    INSERT INTO public.trip_summary (
      trip_id,
      total_distance_km,
      total_duration_minutes,
      max_speed_kmh,
      avg_speed_kmh,
      position_count,
      last_position_at,
      calculated_at
    ) VALUES (
      p_trip_id,
      0,
      0,
      0,
      0,
      0,
      NULL,
      NOW()
    )
    ON CONFLICT (trip_id) DO UPDATE SET
      total_distance_km = 0,
      total_duration_minutes = 0,
      max_speed_kmh = 0,
      avg_speed_kmh = 0,
      position_count = 0,
      last_position_at = NULL,
      calculated_at = NOW(),
      updated_at = NOW();
    RETURN;
  END IF;

  -- Calculate total duration in minutes
  IF v_first_position_at IS NOT NULL AND v_last_position_at IS NOT NULL THEN
    v_total_duration := EXTRACT(EPOCH FROM (v_last_position_at - v_first_position_at)) / 60;
  END IF;

  -- Calculate total distance and speeds using window functions
  -- This is more efficient than iterating through positions
  WITH position_pairs AS (
    SELECT 
      lat,
      lng,
      speed,
      timestamp,
      LAG(lat) OVER (ORDER BY timestamp) as prev_lat,
      LAG(lng) OVER (ORDER BY timestamp) as prev_lng,
      LAG(timestamp) OVER (ORDER BY timestamp) as prev_timestamp
    FROM public.driver_positions
    WHERE trip_id = p_trip_id
    ORDER BY timestamp ASC
  ),
  distances AS (
    SELECT 
      CASE 
        WHEN prev_lat IS NOT NULL AND prev_lng IS NOT NULL THEN
          public.haversine_distance(prev_lat, prev_lng, lat, lng)
        ELSE 0
      END as segment_distance,
      speed,
      timestamp - prev_timestamp as segment_duration
    FROM position_pairs
    WHERE prev_lat IS NOT NULL AND prev_lng IS NOT NULL
  )
  SELECT 
    COALESCE(SUM(segment_distance), 0),
    COALESCE(MAX(speed), 0),
    COALESCE(AVG(speed), 0)
  INTO
    v_total_distance,
    v_max_speed,
    v_avg_speed
  FROM distances;

  -- Convert speed from m/s to km/h if needed (assuming speed is already in km/h)
  -- If speed is stored in m/s, multiply by 3.6
  -- Adjust based on your actual data format

  -- Upsert summary
  INSERT INTO public.trip_summary (
    trip_id,
    total_distance_km,
    total_duration_minutes,
    max_speed_kmh,
    avg_speed_kmh,
    position_count,
    last_position_at,
    calculated_at
  ) VALUES (
    p_trip_id,
    v_total_distance,
    v_total_duration,
    v_max_speed,
    v_avg_speed,
    v_position_count,
    v_last_position_at,
    NOW()
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

-- ====================================================
-- PART 4: TRIGGER FUNCTION
-- ====================================================

CREATE OR REPLACE FUNCTION public.trigger_recalculate_trip_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recalculate summary for the affected trip
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_trip_summary(OLD.trip_id);
    RETURN OLD;
  ELSE
    PERFORM public.calculate_trip_summary(NEW.trip_id);
    RETURN NEW;
  END IF;
END;
$$;

-- ====================================================
-- PART 5: CREATE TRIGGER
-- ====================================================

DROP TRIGGER IF EXISTS trg_driver_positions_recalc_summary ON public.driver_positions;

CREATE TRIGGER trg_driver_positions_recalc_summary
  AFTER INSERT OR UPDATE OR DELETE ON public.driver_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_trip_summary();

-- ====================================================
-- PART 6: COMMENTS FOR DOCUMENTATION
-- ====================================================

COMMENT ON TABLE public.trip_summary IS 'Calculated summary metrics for trips based on driver positions';
COMMENT ON FUNCTION public.haversine_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) IS 'Calculate distance between two GPS coordinates using Haversine formula (returns kilometers)';
COMMENT ON FUNCTION public.calculate_trip_summary(UUID) IS 'Calculate and store trip summary metrics (distance, duration, speeds) based on driver positions';
COMMENT ON FUNCTION public.trigger_recalculate_trip_summary() IS 'Trigger function to automatically recalculate trip summary when driver positions change';

-- ====================================================
-- END OF MIGRATION
-- ====================================================

