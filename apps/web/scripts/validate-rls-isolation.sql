-- Script de Validação RLS - Isolamento entre Empresas
-- Verifica se as políticas RLS estão funcionando corretamente
-- Operator deve ver apenas sua empresa
-- Admin deve ver todas as empresas

-- ============================================
-- 1. Verificar isolamento entre empresas para Operator
-- ============================================
-- Simular usuário operator de uma empresa específica
-- SET ROLE anon;
-- SET request.jwt.claims = '{"sub": "operator-user-id", "role": "operator"}';
-- 
-- SELECT COUNT(*) FROM v_operator_routes_secure; -- >0
-- SELECT COUNT(*) FROM v_operator_routes_secure 
-- WHERE company_id <> current_setting('request.jwt.claims', true)::json->>'company_id'; -- 0

-- ============================================
-- 2. Verificar função is_admin()
-- ============================================
SELECT public.is_admin(); -- deve retornar true se for admin

-- ============================================
-- 3. Verificar views _secure
-- ============================================
-- Verificar se views _secure existem
SELECT COUNT(*) FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE '%_secure';

-- ============================================
-- 4. Verificar RLS ativo nas tabelas sensíveis
-- ============================================
SELECT tablename, 
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'routes', 'trips', 'vehicles', 'users', 'companies',
    'gf_alerts', 'gf_service_requests', 'gf_assistance_requests',
    'gf_employee_company', 'gf_invoices', 'gf_invoice_lines',
    'gf_report_schedules', 'gf_report_history', 'gf_audit_log',
    'gf_vehicle_maintenance', 'gf_vehicle_checklists', 'gf_driver_documents'
  )
ORDER BY tablename;

-- ============================================
-- 5. Verificar políticas RLS por tabela
-- ============================================
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'routes', 'trips', 'vehicles', 'users', 'companies',
    'gf_alerts', 'gf_service_requests', 'gf_assistance_requests',
    'gf_employee_company', 'gf_invoices', 'gf_invoice_lines',
    'gf_report_schedules', 'gf_report_history', 'gf_audit_log',
    'gf_vehicle_maintenance', 'gf_vehicle_checklists', 'gf_driver_documents'
  )
ORDER BY tablename, policyname;

-- ============================================
-- 6. Verificar isolamento de dados
-- ============================================
-- Verificar se há dados de empresas diferentes para o mesmo usuário
-- (Isso deve retornar 0 se RLS estiver funcionando corretamente)
SELECT u.id, u.email, COUNT(DISTINCT r.company_id) as company_count
FROM public.users u
JOIN public.routes r ON r.company_id IN (
  SELECT company_id FROM public.gf_user_company_map WHERE user_id = u.id
)
WHERE u.role = 'operator'
GROUP BY u.id, u.email
HAVING COUNT(DISTINCT r.company_id) > 1;

-- ============================================
-- 7. Verificar view v_employees_safe
-- ============================================
-- Verificar se view existe e se CPF está mascarado corretamente
SELECT COUNT(*) FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'v_employees_safe';

-- Testar máscara de CPF
SELECT id, email, name, role, cpf_masked, cpf_visible
FROM public.v_employees_safe
LIMIT 5;

-- ============================================
-- 8. Verificar função mask_cpf
-- ============================================
SELECT public.mask_cpf('12345678901'); -- deve retornar XXX.XXX.XXX-01

-- ============================================
-- 9. Verificar trigger de sanitização de logs
-- ============================================
SELECT tgname, tgtype, tgenabled
FROM pg_trigger 
WHERE tgname = 'sanitize_audit_log_pii'
  AND tgrelid = 'public.gf_audit_log'::regclass;

COMMENT ON SCRIPT IS 
  'Script de validação RLS para verificar isolamento entre empresas e proteção de PII.';

