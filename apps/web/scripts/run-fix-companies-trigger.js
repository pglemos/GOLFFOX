require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔧 Executando migration para corrigir companies.updated_at...\n')

  const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'fix_companies_updated_at.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  // Executar SQL via Supabase (usando rpc se disponível, ou executar diretamente)
  // Como não temos acesso direto ao SQL, vamos tentar adicionar a coluna via Supabase
  try {
    // Primeiro, verificar se a coluna existe
    const { data: company } = await supabase.from('companies').select('*').limit(1).single()
    
    if (company && !('updated_at' in company)) {
      console.log('⚠️ Coluna updated_at não existe. Execute este SQL no Supabase Dashboard:')
      console.log('\n' + sql + '\n')
      console.log('Ou execute via psql:')
      console.log(`psql ${supabaseUrl.replace('https://', '').replace('.supabase.co', '')} -f ${sqlPath}`)
    } else {
      console.log('✅ Coluna updated_at já existe ou migration não necessária')
    }
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

runMigration().catch(console.error)

