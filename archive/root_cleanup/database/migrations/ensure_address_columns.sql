-- Script para garantir que as colunas de endereço existem na tabela users
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas de endereço se não existirem
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS address_zip_code TEXT,
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state TEXT;

-- Adicionar comentários
COMMENT ON COLUMN users.cpf IS 'CPF do usuário';
COMMENT ON COLUMN users.address_zip_code IS 'CEP do endereço';
COMMENT ON COLUMN users.address_street IS 'Rua/Logradouro';
COMMENT ON COLUMN users.address_number IS 'Número do endereço';
COMMENT ON COLUMN users.address_neighborhood IS 'Bairro';
COMMENT ON COLUMN users.address_complement IS 'Complemento do endereço';
COMMENT ON COLUMN users.address_city IS 'Cidade';
COMMENT ON COLUMN users.address_state IS 'Estado (UF)';

-- Criar índice para CPF
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);

-- Verificar que as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE 'address%' 
  OR column_name = 'cpf'
ORDER BY column_name;
