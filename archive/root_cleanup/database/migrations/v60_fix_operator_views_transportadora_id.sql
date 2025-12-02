-- =========================================
-- Migration v60: Fix operator views para usar transportadora_id
-- =========================================
-- 
-- Esta migration atualiza as views do operador para usar transportadora_id
-- ao invés de carrier_id
--

-- View: V_OPERATOR_ROUTES_SECURE - Atualizada para transportadora_id
DROP VIEW IF EXISTS public.v_operator_routes_secure CASCADE;

CREATE OR REPLACE VIEW public.v_operator_routes_secure AS
SELECT
  r.id,
  r.name,
  r.company_id,
  r.transportadora_id,
  count(distinct t.id) as total_trips,
  count(distinct t.id) filter (where t.status = 'completed') as completed_trips,
  avg(extract(epoch from (t.completed_at - t.scheduled_at))/60) filter (where t.status = 'completed') as avg_delay_minutes,                                     
  c.name as transportadora_name
FROM routes r
LEFT JOIN trips t ON t.route_id = r.id
LEFT JOIN companies c ON c.id = r.transportadora_id
WHERE company_ownership(r.company_id)
GROUP BY r.id, r.name, r.company_id, r.transportadora_id, c.name;

-- Comentário para documentação
COMMENT ON VIEW public.v_operator_routes_secure IS 'Rotas do operador filtradas por company_ownership, usando transportadora_id';

