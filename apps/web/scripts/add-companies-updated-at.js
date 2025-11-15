require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addUpdatedAtColumn() {
  console.log('🔧 Adicionando coluna updated_at na tabela companies...\n')

  try {
    // Tentar executar SQL via RPC (se disponível) ou instruir manualmente
    const sql = `
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      UPDATE companies SET updated_at = created_at WHERE updated_at IS NULL;
    `

    // Como não temos acesso direto ao SQL, vamos tentar via uma função RPC
    // Se não funcionar, vamos apenas instruir o usuário
    console.log('⚠️ Não é possível executar ALTER TABLE diretamente via Supabase JS.')
    console.log('📋 Execute este SQL no Supabase Dashboard (SQL Editor):\n')
    console.log(sql)
    console.log('\n💡 Ou execute via psql conectando ao seu banco Supabase.\n')

    // Verificar se a coluna foi adicionada (após execução manual)
    const { data: company } = await supabase.from('companies').select('*').limit(1).single()
    if (company && 'updated_at' in company) {
      console.log('✅ Coluna updated_at existe!')
    } else {
      console.log('❌ Coluna updated_at ainda não existe. Execute o SQL acima.')
    }
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

addUpdatedAtColumn().catch(console.error)

