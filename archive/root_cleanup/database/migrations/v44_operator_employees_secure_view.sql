-- Migration: v44_operator_employees_secure_view
-- View segura para funcionários do operador com RLS aplicado

-- ============================================
-- V_OPERATOR_EMPLOYEES_SECURE
-- View segura que filtra funcionários por company_ownership()
-- ============================================
CREATE OR REPLACE VIEW public.v_operator_employees_secure AS
SELECT 
  ec.id,
  ec.company_id,
  ec.name,
  ec.cpf,
  ec.email,
  ec.phone,
  ec.address,
  ec.latitude,
  ec.longitude,
  ec.is_active,
  ec.created_at,
  ec.updated_at
FROM public.gf_employee_company ec
WHERE public.company_ownership(ec.company_id);

COMMENT ON VIEW public.v_operator_employees_secure IS 'View segura de funcionários filtrada por RLS multi-tenant';

-- Garantir que a view tem RLS aplicado via função company_ownership
GRANT SELECT ON public.v_operator_employees_secure TO authenticated;

