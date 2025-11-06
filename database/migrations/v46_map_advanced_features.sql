-- Migration: v46_map_advanced_features
-- Views e funcionalidades avançadas para o mapa admin

-- ============================================
-- V_VEHICLE_DENSITY
-- Agregação de densidade de veículos por hora (últimas 24h)
-- ============================================
CREATE OR REPLACE VIEW public.v_vehicle_density AS
SELECT 
  ROUND(lat::numeric, 4) AS lat,
  ROUND(lng::numeric, 4) AS lng,
  COUNT(*) AS vehicle_count,
  DATE_TRUNC('hour', timestamp) AS hour_bucket,
  MAX(timestamp) AS last_seen
FROM public.driver_positions
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY 
  ROUND(lat::numeric, 4),
  ROUND(lng::numeric, 4),
  DATE_TRUNC('hour', timestamp)
HAVING COUNT(*) >= 2 -- Mínimo de 2 veículos para aparecer no heatmap
ORDER BY hour_bucket DESC, vehicle_count DESC;

COMMENT ON VIEW public.v_vehicle_density IS 
  'Densidade de veículos agregada por hora nas últimas 24h para heatmap.';

-- RLS para v_vehicle_density
ALTER VIEW public.v_vehicle_density OWNER TO postgres;

-- Revogar acesso público
REVOKE ALL ON public.v_vehicle_density FROM PUBLIC;

-- Permitir acesso para usuários autenticados
GRANT SELECT ON public.v_vehicle_density TO authenticated;

-- ============================================
-- Função para calcular distância de ponto à linha (Haversine)
-- Usada para detectar desvio de rota
-- ============================================
CREATE OR REPLACE FUNCTION public.distance_point_to_line(
  point_lat double precision,
  point_lng double precision,
  line_start_lat double precision,
  line_start_lng double precision,
  line_end_lat double precision,
  line_end_lng double precision
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  -- Raio da Terra em metros
  R constant double precision := 6371000.0;
  
  -- Converter para radianos
  lat1 double precision := radians(point_lat);
  lng1 double precision := radians(point_lng);
  lat2 double precision := radians(line_start_lat);
  lng2 double precision := radians(line_start_lng);
  lat3 double precision := radians(line_end_lat);
  lng3 double precision := radians(line_end_lng);
  
  -- Calcular distâncias
  d12 double precision;
  d13 double precision;
  d23 double precision;
  
  -- Calcular ângulos
  angle double precision;
  
  -- Distância perpendicular
  distance double precision;
BEGIN
  -- Calcular distância entre ponto e início da linha
  d12 := ACOS(
    SIN(lat1) * SIN(lat2) + 
    COS(lat1) * COS(lat2) * COS(lng2 - lng1)
  ) * R;
  
  -- Calcular distância entre ponto e fim da linha
  d13 := ACOS(
    SIN(lat1) * SIN(lat3) + 
    COS(lat1) * COS(lat3) * COS(lng3 - lng1)
  ) * R;
  
  -- Calcular distância entre início e fim da linha
  d23 := ACOS(
    SIN(lat2) * SIN(lat3) + 
    COS(lat2) * COS(lat3) * COS(lng3 - lng2)
  ) * R;
  
  -- Se a linha é muito curta, retornar distância até o ponto mais próximo
  IF d23 < 10 THEN
    RETURN LEAST(d12, d13);
  END IF;
  
  -- Calcular ângulo usando lei dos cossenos
  angle := ACOS(
    (d12 * d12 + d23 * d23 - d13 * d13) / (2 * d12 * d23)
  );
  
  -- Calcular distância perpendicular
  distance := d12 * SIN(angle);
  
  -- Se o ponto está fora do segmento, retornar distância até a extremidade mais próxima
  IF angle > PI() / 2 OR (d12 * COS(angle)) > d23 THEN
    RETURN LEAST(d12, d13);
  END IF;
  
  RETURN distance;
END;
$$;

COMMENT ON FUNCTION public.distance_point_to_line IS 
  'Calcula distância em metros de um ponto a um segmento de linha (usando Haversine).';

-- Permitir execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.distance_point_to_line TO authenticated;

