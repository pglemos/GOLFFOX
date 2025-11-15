// Script para exibir o SQL de correção
const sql = `
-- =====================================================
-- Fix: Adicionar coluna updated_at em companies
-- =====================================================

-- 1. Adicionar coluna updated_at se não existir
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Atualizar valores existentes
UPDATE companies SET updated_at = created_at WHERE updated_at IS NULL;

-- 3. Corrigir o trigger para ser mais robusto
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se a coluna updated_at existe na tabela
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = TG_TABLE_SCHEMA 
    AND table_name = TG_TABLE_NAME 
    AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recriar o trigger
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON companies
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
`

console.log('📋 SQL DE CORREÇÃO PARA EXECUTAR NO SUPABASE:\n')
console.log('='.repeat(70))
console.log(sql)
console.log('='.repeat(70))
console.log('\n💡 INSTRUÇÕES:')
console.log('1. Acesse: https://supabase.com/dashboard')
console.log('2. Selecione seu projeto')
console.log('3. Vá em: SQL Editor (menu lateral)')
console.log('4. Cole o SQL acima')
console.log('5. Clique em "Run" ou pressione Ctrl+Enter')
console.log('\n✅ Após executar, rode: node scripts/auto-fix-and-test.js')

