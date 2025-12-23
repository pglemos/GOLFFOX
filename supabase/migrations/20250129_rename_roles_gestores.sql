-- Migration: Renomeação de Roles para Gestores
-- GolfFox - Padronização de Nomenclatura
-- Data: 2025-01-29

-- ============================================
-- 1. Backup dos dados atuais
-- ============================================
CREATE TABLE IF NOT EXISTS users_role_backup AS
SELECT id, role, email, name, created_at 
FROM users;

COMMENT ON TABLE users_role_backup IS 'Backup de segurança antes da migração de roles para gestores';

-- ============================================
-- 2. Migrar roles existentes
-- ============================================

-- empresa → gestor_empresa
UPDATE users SET role = 'gestor_empresa' WHERE role = 'empresa';

-- operador → gestor_transportadora
UPDATE users SET role = 'gestor_transportadora' WHERE role = 'operador';

-- transportadora → gestor_transportadora (consolidar)
UPDATE users SET role = 'gestor_transportadora' WHERE role = 'transportadora';

-- motorista → motorista (sem mudança)
-- passageiro → passageiro (sem mudança)
-- admin → admin (sem mudança)

-- ============================================
-- 3. Atualizar constraint
-- ============================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'admin',
    'gestor_empresa',
    'gestor_transportadora',
    'motorista',
    'passageiro'
  ));

-- ============================================
-- 4. Verificação
-- ============================================
-- Execute após a migration para verificar:
-- SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY role;
-- 
-- Resultado esperado:
-- admin | X
-- gestor_empresa | X
-- gestor_transportadora | X
-- motorista | X
-- passageiro | X
--
-- Não deve haver mais roles antigas (empresa, operador, transportadora)

