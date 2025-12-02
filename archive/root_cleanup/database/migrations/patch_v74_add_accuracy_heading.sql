-- Patch v7.4: adiciona colunas de telemetria ausentes em driver_positions
-- Execute após migration_complete_v74.sql, se seu projeto não tiver essas colunas.

ALTER TABLE IF EXISTS public.driver_positions
  ADD COLUMN IF NOT EXISTS accuracy double precision;

ALTER TABLE IF EXISTS public.driver_positions
  ADD COLUMN IF NOT EXISTS heading double precision;

-- Opcional: comentários para documentação
COMMENT ON COLUMN public.driver_positions.accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN public.driver_positions.heading IS 'Heading in degrees [0..360]';

