-- ========================================
-- Fix trip_summary trigger to check if trip exists
-- ========================================

-- Corrigir função do trigger para verificar se o trip existe antes de calcular summary
CREATE OR REPLACE FUNCTION public.recalculate_trip_summary_on_position()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE 
  v_trip uuid;
  v_trip_exists boolean;
BEGIN
  v_trip := COALESCE(NEW.trip_id, OLD.trip_id);
  
  IF v_trip IS NOT NULL THEN
    -- Verificar se o trip ainda existe antes de calcular summary
    -- Isso evita erro de foreign key quando o trip foi excluído
    SELECT EXISTS(SELECT 1 FROM public.trips WHERE id = v_trip) INTO v_trip_exists;
    
    IF v_trip_exists THEN
      PERFORM public.calculate_trip_summary(v_trip);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END; $$;

