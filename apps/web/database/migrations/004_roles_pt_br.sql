-- Migration: Atualização de Roles para PT-BR
-- GolfFox - Correção do Modelo de Domínio
-- Data: 2025-12-10

-- ============================================
-- 1. Remover constraint antiga
-- ============================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- ============================================
-- 2. Migrar roles de inglês para português
-- ============================================

-- operator → empresa (Empresa Contratante)
UPDATE users SET role = 'empresa' WHERE role = 'operator';

-- carrier → operador (Gestor da Transportadora)
UPDATE users SET role = 'operador' WHERE role = 'carrier';

-- driver → motorista
UPDATE users SET role = 'motorista' WHERE role = 'driver';

-- passenger → passageiro
UPDATE users SET role = 'passageiro' WHERE role = 'passenger';

-- ============================================
-- 3. Adicionar nova constraint com roles PT-BR
-- ============================================
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'empresa', 'operador', 'motorista', 'passageiro'));

-- ============================================
-- 4. Atualizar RLS policies (se existirem)
-- ============================================

-- Exemplo: Atualizar policies que referenciam 'operator'
-- DROP POLICY IF EXISTS "operator_access" ON tabela;
-- CREATE POLICY "empresa_access" ON tabela ...

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- SELECT role, COUNT(*) FROM users GROUP BY role;
