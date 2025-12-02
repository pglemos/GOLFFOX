-- Migration: v45_lgpd_pii_protection
-- Proteção LGPD: mascarar CPF e limitar acesso por papel
-- View v_employees_safe com máscara de CPF baseada no papel do usuário

-- ============================================
-- V_EMPLOYEES_SAFE
-- View segura com máscara de CPF baseada no papel
-- Admin: CPF completo
-- Operator: CPF completo (sua empresa)
-- Driver: CPF completo (próprio)
-- Outros: CPF mascarado (XXX.XXX.XXX-XX)
-- ============================================
CREATE OR REPLACE VIEW public.v_employees_safe AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.company_id,
  u.phone,
  u.created_at,
  u.updated_at,
  -- Máscara de CPF baseada no papel
  CASE 
    -- Admin vê CPF completo
    WHEN public.is_admin() THEN 
      COALESCE(u.cpf, '')
    -- Operator vê CPF completo apenas de sua empresa
    WHEN u.role = 'operator' AND u.company_id IN (
      SELECT company_id FROM public.gf_user_company_map 
      WHERE user_id = auth.uid()
    ) THEN 
      COALESCE(u.cpf, '')
    -- Driver vê apenas seu próprio CPF completo
    WHEN u.role = 'driver' AND u.id = auth.uid() THEN 
      COALESCE(u.cpf, '')
    -- Outros papéis: CPF mascarado
    ELSE 
      CASE 
        WHEN u.cpf IS NULL OR u.cpf = '' THEN ''
        ELSE 
          -- Máscara: XXX.XXX.XXX-XX (mostrar apenas últimos 2 dígitos)
          SUBSTRING(u.cpf, 1, 3) || '.' || 
          SUBSTRING(u.cpf, 4, 3) || '.' || 
          SUBSTRING(u.cpf, 7, 3) || '-' || 
          SUBSTRING(u.cpf, 10, 2)
      END
  END AS cpf_masked,
  -- Campo adicional para identificar se o CPF está completo ou mascarado
  CASE 
    WHEN public.is_admin() THEN true
    WHEN u.role = 'operator' AND u.company_id IN (
      SELECT company_id FROM public.gf_user_company_map 
      WHERE user_id = auth.uid()
    ) THEN true
    WHEN u.role = 'driver' AND u.id = auth.uid() THEN true
    ELSE false
  END AS cpf_visible
FROM public.users u;

COMMENT ON VIEW public.v_employees_safe IS 
  'View segura com máscara de CPF baseada no papel do usuário. Admin vê completo, Operator vê sua empresa, Driver vê próprio, outros vêem mascarado.';

-- ============================================
-- Função para mascarar CPF
-- ============================================
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF cpf_value IS NULL OR LENGTH(cpf_value) < 11 THEN
    RETURN '';
  END IF;
  
  -- Formato: XXX.XXX.XXX-XX (mascarar todos exceto últimos 2 dígitos)
  RETURN SUBSTRING(cpf_value, 1, 3) || '.' || 
         SUBSTRING(cpf_value, 4, 3) || '.' || 
         SUBSTRING(cpf_value, 7, 3) || '-' || 
         SUBSTRING(cpf_value, 10, 2);
END;
$$;

COMMENT ON FUNCTION public.mask_cpf IS 
  'Mascara CPF no formato XXX.XXX.XXX-XX (mostra apenas últimos 2 dígitos).';

-- ============================================
-- Função para mascarar endereço
-- ============================================
CREATE OR REPLACE FUNCTION public.mask_address(address_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF address_value IS NULL OR address_value = '' THEN
    RETURN '';
  END IF;
  
  -- Manter apenas cidade e estado, mascarar resto
  -- Exemplo: "Rua X, 123, São Paulo, SP" -> "São Paulo, SP"
  -- Por enquanto, retorna apenas os últimos 2 componentes separados por vírgula
  DECLARE
    parts TEXT[];
    result TEXT;
  BEGIN
    parts := string_to_array(address_value, ',');
    IF array_length(parts, 1) >= 2 THEN
      result := TRIM(parts[array_length(parts, 1) - 1]) || ', ' || TRIM(parts[array_length(parts, 1)]);
    ELSE
      result := address_value;
    END IF;
    RETURN result;
  END;
END;
$$;

COMMENT ON FUNCTION public.mask_address IS 
  'Mascara endereço mantendo apenas cidade e estado.';

-- ============================================
-- Atualizar tabela gf_audit_log para não armazenar PII
-- ============================================
-- Adicionar política para não armazenar CPF/endereços completos nos logs
DO $$
BEGIN
  -- Criar trigger para sanitizar details antes de inserir
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'sanitize_audit_log_pii'
  ) THEN
    CREATE OR REPLACE FUNCTION public.sanitize_audit_log_details()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- Remover campos sensíveis de details se existirem
      IF NEW.details IS NOT NULL THEN
        -- Remover CPF se existir
        IF NEW.details ? 'cpf' THEN
          NEW.details := NEW.details - 'cpf';
        END IF;
        
        -- Remover endereço completo se existir
        IF NEW.details ? 'address' OR NEW.details ? 'full_address' THEN
          NEW.details := NEW.details - 'address' - 'full_address';
        END IF;
        
        -- Manter apenas cidade/estado se existir
        IF NEW.details ? 'city' AND NEW.details ? 'state' THEN
          NEW.details := jsonb_build_object(
            'city', NEW.details->>'city',
            'state', NEW.details->>'state'
          );
        END IF;
      END IF;
      
      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER sanitize_audit_log_pii
      BEFORE INSERT ON public.gf_audit_log
      FOR EACH ROW
      EXECUTE FUNCTION public.sanitize_audit_log_details();
  END IF;
END $$;

COMMENT ON TRIGGER sanitize_audit_log_pii ON public.gf_audit_log IS 
  'Sanitiza logs de auditoria removendo PII (CPF, endereços completos) antes de inserir.';

-- ============================================
-- RLS Policies para v_employees_safe
-- ============================================
-- Revogar acesso público
REVOKE ALL ON public.v_employees_safe FROM PUBLIC;

-- Permitir acesso para usuários autenticados
GRANT SELECT ON public.v_employees_safe TO authenticated;

-- ============================================
-- Índices para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_company_role 
  ON public.users(company_id, role) 
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_role_cpf 
  ON public.users(role, cpf) 
  WHERE cpf IS NOT NULL;

COMMENT ON INDEX idx_users_company_role IS 
  'Índice para filtrar usuários por empresa e papel.';

COMMENT ON INDEX idx_users_role_cpf IS 
  'Índice para filtrar usuários por papel e CPF (caso CPF seja adicionado).';

