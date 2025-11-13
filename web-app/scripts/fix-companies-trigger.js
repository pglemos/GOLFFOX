require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixCompaniesTrigger() {
  console.log('🔧 Verificando e corrigindo trigger da tabela companies...\n')

  // Verificar se updated_at existe
  const { data: company } = await supabase.from('companies').select('*').limit(1).single()
  if (company) {
    console.log('Colunas atuais:', Object.keys(company))
    
    if (!('updated_at' in company)) {
      console.log('⚠️ Coluna updated_at não existe. Adicionando...')
      // Não podemos adicionar colunas via Supabase JS, precisamos fazer via SQL
      console.log('ℹ️ Execute este SQL no Supabase:')
      console.log('ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();')
    } else {
      console.log('✅ Coluna updated_at existe')
    }
  }

  // Testar update sem updated_at
  console.log('\n🧪 Testando update sem updated_at:')
  const { data: testCompany } = await supabase.from('companies').select('id').limit(1).single()
  if (testCompany) {
    const { error } = await supabase
      .from('companies')
      .update({ is_active: false })
      .eq('id', testCompany.id)
    
    if (error) {
      console.error('❌ Erro:', error.message)
      console.error('   Código:', error.code)
      if (error.message.includes('updated_at')) {
        console.log('\n💡 SOLUÇÃO: O trigger está tentando acessar updated_at que não existe.')
        console.log('   Opção 1: Adicionar coluna updated_at')
        console.log('   Opção 2: Desabilitar/remover o trigger')
      }
    } else {
      console.log('✅ Update funcionou!')
      // Reverter
      await supabase.from('companies').update({ is_active: true }).eq('id', testCompany.id)
    }
  }
}

fixCompaniesTrigger().catch(console.error)

