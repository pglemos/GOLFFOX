-- SQL para adicionar colunas faltantes na tabela carriers
-- Execute este script no SQL Editor do Supabase Dashboard

-- Campos Bancários
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_agency TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_account_type TEXT DEFAULT 'corrente';
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cnpj';

-- Campos do Representante Legal (Dados)
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_name TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_cpf TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_rg TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_email TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_rep_phone TEXT;

-- Nota: A CNH (documento) é salva na tabela 'carrier_documents', então não precisa de coluna aqui.
