require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

// Tentar executar SQL diretamente usando pg (se disponível)
// Como alternativa, vamos criar uma função SQL que pode ser chamada via RPC

async function createFixFunction() {
  console.log('🔧 Criando função SQL para corrigir companies...\n')

  // SQL para criar função que adiciona a coluna
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION fix_companies_updated_at()
    RETURNS void AS $$
    BEGIN
      -- Adicionar coluna se não existir
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'updated_at'
      ) THEN
        ALTER TABLE companies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        UPDATE companies SET updated_at = created_at WHERE updated_at IS NULL;
        RAISE NOTICE 'Coluna updated_at adicionada com sucesso';
      ELSE
        RAISE NOTICE 'Coluna updated_at já existe';
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `

  console.log('📋 Para executar a correção, execute este SQL no Supabase Dashboard:')
  console.log('\n' + createFunctionSQL)
  console.log('\nDepois execute:')
  console.log('SELECT fix_companies_updated_at();')
  console.log('\nOu execute diretamente:')
  console.log('\nALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();')
  console.log('UPDATE companies SET updated_at = created_at WHERE updated_at IS NULL;')
}

createFixFunction().catch(console.error)

