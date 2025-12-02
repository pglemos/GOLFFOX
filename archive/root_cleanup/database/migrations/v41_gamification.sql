-- ========================================
-- GolfFox v41.0 - Gamification e Rankings
-- ========================================

-- Tabela: Pontuação de motoristas (gamificação)
CREATE TABLE IF NOT EXISTS public.gf_gamification_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_points INTEGER DEFAULT 0,
  punctuality_score INTEGER DEFAULT 0,
  fuel_efficiency_score INTEGER DEFAULT 0,
  route_completion_score INTEGER DEFAULT 0,
  safety_score INTEGER DEFAULT 0,
  ranking_position INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_gamification_scores_driver_id ON public.gf_gamification_scores(driver_id);
CREATE INDEX IF NOT EXISTS idx_gf_gamification_scores_period ON public.gf_gamification_scores(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_gf_gamification_scores_ranking ON public.gf_gamification_scores(ranking_position DESC);

-- View: Ranking de motoristas atual
CREATE OR REPLACE VIEW public.v_driver_ranking AS
SELECT 
  gs.driver_id,
  u.name AS driver_name,
  u.email AS driver_email,
  gs.total_points,
  gs.punctuality_score,
  gs.fuel_efficiency_score,
  gs.route_completion_score,
  gs.safety_score,
  gs.ranking_position,
  gs.period_start,
  gs.period_end,
  COUNT(DISTINCT t.id) AS trips_count
FROM public.gf_gamification_scores gs
JOIN public.users u ON gs.driver_id = u.id
LEFT JOIN public.trips t ON t.driver_id = gs.driver_id 
  AND t.scheduled_at BETWEEN gs.period_start AND gs.period_end
WHERE gs.period_start <= CURRENT_DATE 
  AND gs.period_end >= CURRENT_DATE
GROUP BY gs.driver_id, u.name, u.email, gs.total_points, gs.punctuality_score, 
  gs.fuel_efficiency_score, gs.route_completion_score, gs.safety_score, 
  gs.ranking_position, gs.period_start, gs.period_end
ORDER BY gs.total_points DESC, gs.ranking_position;

-- Function: Atualizar pontuação de motorista
CREATE OR REPLACE FUNCTION public.update_driver_score(
  p_driver_id UUID,
  p_points INTEGER,
  p_score_type TEXT -- 'punctuality', 'fuel_efficiency', 'route_completion', 'safety'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  v_current_month_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
BEGIN
  INSERT INTO public.gf_gamification_scores (
    driver_id, period_start, period_end, total_points, punctuality_score,
    fuel_efficiency_score, route_completion_score, safety_score
  )
  VALUES (
    p_driver_id, v_current_month_start, v_current_month_end,
    p_points, 
    CASE WHEN p_score_type = 'punctuality' THEN p_points ELSE 0 END,
    CASE WHEN p_score_type = 'fuel_efficiency' THEN p_points ELSE 0 END,
    CASE WHEN p_score_type = 'route_completion' THEN p_points ELSE 0 END,
    CASE WHEN p_score_type = 'safety' THEN p_points ELSE 0 END
  )
  ON CONFLICT (driver_id, period_start, period_end) DO UPDATE
  SET
    total_points = gf_gamification_scores.total_points + p_points,
    punctuality_score = CASE 
      WHEN p_score_type = 'punctuality' 
      THEN gf_gamification_scores.punctuality_score + p_points 
      ELSE gf_gamification_scores.punctuality_score 
    END,
    fuel_efficiency_score = CASE 
      WHEN p_score_type = 'fuel_efficiency' 
      THEN gf_gamification_scores.fuel_efficiency_score + p_points 
      ELSE gf_gamification_scores.fuel_efficiency_score 
    END,
    route_completion_score = CASE 
      WHEN p_score_type = 'route_completion' 
      THEN gf_gamification_scores.route_completion_score + p_points 
      ELSE gf_gamification_scores.route_completion_score 
    END,
    safety_score = CASE 
      WHEN p_score_type = 'safety' 
      THEN gf_gamification_scores.safety_score + p_points 
      ELSE gf_gamification_scores.safety_score 
    END,
    updated_at = NOW();
END;
$$;

-- Function: Calcular rankings do período atual
CREATE OR REPLACE FUNCTION public.calculate_monthly_rankings()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  v_current_month_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
BEGIN
  WITH ranked_scores AS (
    SELECT 
      driver_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC) AS position
    FROM public.gf_gamification_scores
    WHERE period_start = v_current_month_start
      AND period_end = v_current_month_end
  )
  UPDATE public.gf_gamification_scores gs
  SET ranking_position = rs.position
  FROM ranked_scores rs
  WHERE gs.driver_id = rs.driver_id
    AND gs.period_start = v_current_month_start
    AND gs.period_end = v_current_month_end;
END;
$$;

