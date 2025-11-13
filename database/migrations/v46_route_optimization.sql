-- Migration: v46_route_optimization
-- View segura de funcionários por empresa + cache de otimização

-- View segura de funcionários por empresa (idempotente)
CREATE OR REPLACE VIEW v_company_employees_secure AS
SELECT
  e.id            AS employee_id,
  e.company_id,
  split_part(e.name, ' ', 1)      AS first_name,
  regexp_replace(e.name, '^\S+\s+', '') AS last_name,
  e.cpf,
  COALESCE(e.address, '') AS address,
  COALESCE(e.address, '') AS city,
  '' AS state,
  '' AS zipcode,
  e.latitude AS lat,
  e.longitude AS lng
FROM gf_employee_company e
WHERE e.company_id IN (
  SELECT company_id FROM gf_user_company_map WHERE user_id = auth.uid()
)
OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin');

-- Índices úteis (idempotente)
CREATE INDEX IF NOT EXISTS idx_gfec_company ON gf_employee_company(company_id);
CREATE INDEX IF NOT EXISTS idx_gfec_cpf ON gf_employee_company(cpf);

-- Cache de otimização de rotas
CREATE TABLE IF NOT EXISTS gf_route_optimization_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  payload_hash text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (company_id, payload_hash)
);

CREATE INDEX IF NOT EXISTS idx_roc_company_hash ON gf_route_optimization_cache(company_id, payload_hash);
CREATE INDEX IF NOT EXISTS idx_roc_created ON gf_route_optimization_cache(created_at);

-- RLS para cache
ALTER TABLE gf_route_optimization_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cache_tenant_isolation ON gf_route_optimization_cache;
CREATE POLICY cache_tenant_isolation ON gf_route_optimization_cache
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM gf_user_company_map WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Limpar cache antigo (mais de 1 hora)
DELETE FROM gf_route_optimization_cache WHERE created_at < now() - interval '1 hour';

