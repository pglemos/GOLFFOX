-- Script para criar views de relatórios
-- Ajustado para estrutura real das tabelas (trip_passengers tem apenas trip_id e passenger_id)

-- ============================================
-- V_REPORTS_DELAYS
-- Relatório de atrasos padronizado
-- ============================================
CREATE OR REPLACE VIEW public.v_reports_delays AS
SELECT 
  r.company_id,
  DATE(t.scheduled_at) AS trip_date,
  t.route_id,
  r.name AS route_name,
  t.driver_id,
  COALESCE(
    (SELECT name FROM public.users WHERE id = t.driver_id),
    (SELECT email FROM public.users WHERE id = t.driver_id),
    'Motorista não identificado'
  ) AS driver_name,
  DATE(t.scheduled_at) AS scheduled_time,
  COALESCE(t.started_at::time, t.scheduled_at::time) AS actual_time,
  CASE 
    WHEN t.started_at IS NULL THEN NULL
    ELSE EXTRACT(EPOCH FROM (t.started_at - t.scheduled_at)) / 60
  END AS delay_minutes,
  t.status
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '90 days'
  AND r.company_id IS NOT NULL
  AND t.scheduled_at IS NOT NULL;

COMMENT ON VIEW public.v_reports_delays IS 
  'Relatório de atrasos padronizado com company_id, trip_date, delay_minutes para filtros.';

-- ============================================
-- V_REPORTS_OCCUPANCY
-- Ocupação por horário padronizado
-- ============================================
CREATE OR REPLACE VIEW public.v_reports_occupancy AS
SELECT 
  r.company_id,
  t.route_id,
  r.name AS route_name,
  DATE(t.scheduled_at) AS trip_date,
  EXTRACT(HOUR FROM t.scheduled_at)::integer || ':00-' || (EXTRACT(HOUR FROM t.scheduled_at)::integer + 1) || ':00' AS time_slot,
  COUNT(DISTINCT tp.passenger_id) AS total_passengers,
  COALESCE(MAX(v.capacity), 0) AS capacity,
  CASE 
    WHEN COALESCE(MAX(v.capacity), 0) > 0 
    THEN ROUND((COUNT(DISTINCT tp.passenger_id)::NUMERIC / NULLIF(MAX(v.capacity), 0)) * 100, 2)
    ELSE 0
  END AS occupancy_rate
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
LEFT JOIN public.trip_passengers tp ON tp.trip_id = t.id
LEFT JOIN public.vehicles v ON t.vehicle_id = v.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '90 days'
  AND r.company_id IS NOT NULL
  AND t.scheduled_at IS NOT NULL
GROUP BY 
  r.company_id,
  t.route_id,
  r.name,
  DATE(t.scheduled_at),
  EXTRACT(HOUR FROM t.scheduled_at);

COMMENT ON VIEW public.v_reports_occupancy IS 
  'Ocupação por horário padronizado com company_id, trip_date, time_slot, occupancy_rate.';

-- ============================================
-- V_REPORTS_NOT_BOARDED
-- Passageiros não embarcados padronizado
-- Nota: Como trip_passengers não tem status, assumimos que todos os passageiros
-- que estão na tabela mas a viagem foi completada sem eles foram "não embarcados"
-- ============================================
CREATE OR REPLACE VIEW public.v_reports_not_boarded AS
SELECT 
  r.company_id,
  t.route_id,
  r.name AS route_name,
  tp.passenger_id,
  COALESCE(
    (SELECT name FROM public.users WHERE id = tp.passenger_id),
    (SELECT email FROM public.users WHERE id = tp.passenger_id),
    'Passageiro não identificado'
  ) AS passenger_name,
  DATE(t.scheduled_at) AS trip_date,
  COALESCE(t.scheduled_at::time, '00:00:00'::time) AS scheduled_time,
  CASE 
    WHEN t.status = 'completed' AND t.completed_at IS NOT NULL THEN 'Viagem completada sem passageiro'
    WHEN t.status = 'cancelled' THEN 'Viagem cancelada'
    WHEN t.scheduled_at < NOW() - INTERVAL '1 day' THEN 'Viagem antiga não completada'
    ELSE 'Não embarcado'
  END AS reason
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
LEFT JOIN public.trip_passengers tp ON tp.trip_id = t.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '90 days'
  AND r.company_id IS NOT NULL
  AND t.scheduled_at IS NOT NULL
  AND (
    -- Viagens completadas que podem ter tido passageiros não embarcados
    (t.status = 'completed' AND tp.passenger_id IS NOT NULL)
    OR
    -- Viagens canceladas
    (t.status = 'cancelled' AND tp.passenger_id IS NOT NULL)
  );

COMMENT ON VIEW public.v_reports_not_boarded IS 
  'Passageiros não embarcados padronizado com company_id, trip_date, reason.';

-- ============================================
-- V_REPORTS_EFFICIENCY
-- Eficiência de rotas padronizado
-- ============================================
CREATE OR REPLACE VIEW public.v_reports_efficiency AS
SELECT 
  r.company_id,
  t.route_id,
  r.name AS route_name,
  DATE_TRUNC('week', t.scheduled_at)::date AS period_start,
  (DATE_TRUNC('week', t.scheduled_at) + INTERVAL '6 days')::date AS period_end,
  COUNT(DISTINCT t.id) AS total_trips,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS completed_trips,
  CASE 
    WHEN COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') > 0
    THEN ROUND(
      (COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed')::NUMERIC / 
       NULLIF(COUNT(DISTINCT t.id), 0)) * 100,
      2
    )
    ELSE 0
  END AS efficiency_rate,
  AVG(
    EXTRACT(EPOCH FROM (t.completed_at - t.scheduled_at)) / 60
  ) FILTER (WHERE t.status = 'completed' AND t.completed_at IS NOT NULL AND t.scheduled_at IS NOT NULL) AS avg_delay
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '90 days'
  AND r.company_id IS NOT NULL
  AND t.scheduled_at IS NOT NULL
GROUP BY 
  r.company_id,
  t.route_id,
  r.name,
  DATE_TRUNC('week', t.scheduled_at);

COMMENT ON VIEW public.v_reports_efficiency IS 
  'Eficiência de rotas padronizado com company_id, period_start, period_end, efficiency_rate.';

-- ============================================
-- V_REPORTS_DRIVER_RANKING
-- Ranking de motoristas (pontualidade, rotas cumpridas, eficiência)
-- ============================================
CREATE OR REPLACE VIEW public.v_reports_driver_ranking AS
SELECT 
  r.company_id,
  t.driver_id,
  COALESCE(
    (SELECT name FROM public.users WHERE id = t.driver_id),
    (SELECT email FROM public.users WHERE id = t.driver_id),
    'Motorista não identificado'
  ) AS driver_name,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS routes_completed,
  CASE 
    WHEN COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') > 0
    THEN ROUND(
      (COUNT(DISTINCT t.id) FILTER (
        WHERE t.status = 'completed' 
        AND t.completed_at IS NOT NULL
        AND t.scheduled_at IS NOT NULL
        AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes'
      )::NUMERIC / 
      NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)) * 100,
      2
    )
    ELSE 0
  END AS punctuality_score,
  CASE 
    WHEN COUNT(DISTINCT t.id) > 0
    THEN ROUND(
      (COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed')::NUMERIC / 
       NULLIF(COUNT(DISTINCT t.id), 0)) * 100,
      2
    )
    ELSE 0
  END AS efficiency_score,
  (
    CASE 
      WHEN COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') > 0
      THEN ROUND(
        (COUNT(DISTINCT t.id) FILTER (
          WHERE t.status = 'completed' 
          AND t.completed_at IS NOT NULL
          AND t.scheduled_at IS NOT NULL
          AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes'
        )::NUMERIC / 
        NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)) * 100,
        2
      )
      ELSE 0
    END +
    CASE 
      WHEN COUNT(DISTINCT t.id) > 0
      THEN ROUND(
        (COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed')::NUMERIC / 
         NULLIF(COUNT(DISTINCT t.id), 0)) * 100,
        2
      )
      ELSE 0
    END
  ) / 2 AS total_score,
  ROW_NUMBER() OVER (
    PARTITION BY r.company_id 
    ORDER BY 
      (
        CASE 
          WHEN COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') > 0
          THEN ROUND(
            (COUNT(DISTINCT t.id) FILTER (
              WHERE t.status = 'completed' 
              AND t.completed_at IS NOT NULL
              AND t.scheduled_at IS NOT NULL
              AND t.completed_at <= t.scheduled_at + INTERVAL '5 minutes'
            )::NUMERIC / 
            NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)) * 100,
            2
          )
          ELSE 0
        END +
        CASE 
          WHEN COUNT(DISTINCT t.id) > 0
          THEN ROUND(
            (COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed')::NUMERIC / 
             NULLIF(COUNT(DISTINCT t.id), 0)) * 100,
            2
          )
          ELSE 0
        END
      ) / 2 DESC
  ) AS ranking
FROM public.trips t
JOIN public.routes r ON t.route_id = r.id
WHERE t.scheduled_at >= CURRENT_DATE - INTERVAL '90 days'
  AND r.company_id IS NOT NULL
  AND t.driver_id IS NOT NULL
  AND t.scheduled_at IS NOT NULL
GROUP BY 
  r.company_id,
  t.driver_id;

COMMENT ON VIEW public.v_reports_driver_ranking IS 
  'Ranking de motoristas padronizado com company_id, driver_id, routes_completed, scores, ranking.';

-- Verificar se as views foram criadas
SELECT 
  'v_reports_delays' AS view_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_reports_delays'
  ) THEN '✅ Criada' ELSE '❌ Não criada' END AS status
UNION ALL
SELECT 
  'v_reports_occupancy' AS view_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_reports_occupancy'
  ) THEN '✅ Criada' ELSE '❌ Não criada' END AS status
UNION ALL
SELECT 
  'v_reports_not_boarded' AS view_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_reports_not_boarded'
  ) THEN '✅ Criada' ELSE '❌ Não criada' END AS status
UNION ALL
SELECT 
  'v_reports_efficiency' AS view_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_reports_efficiency'
  ) THEN '✅ Criada' ELSE '❌ Não criada' END AS status
UNION ALL
SELECT 
  'v_reports_driver_ranking' AS view_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_reports_driver_ranking'
  ) THEN '✅ Criada' ELSE '❌ Não criada' END AS status;

