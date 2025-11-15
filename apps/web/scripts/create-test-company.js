/**
 * Script para criar uma empresa de teste
 * Executa via Node.js diretamente
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function createTestCompany() {
  console.log('🏢 Criando empresa de teste...')
  
  try {
    // Verificar se já existe uma empresa
    const { data: existing } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1)
    
    if (existing && existing.length > 0) {
      console.log(`✅ Empresa já existe: ${existing[0].name} (${existing[0].id})`)
      return existing[0]
    }
    
    // Criar nova empresa
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: 'Empresa Teste - GolfFox',
        cnpj: '12.345.678/0001-90',
        address: 'Rua Teste, 123 - São Paulo, SP - CEP 01234-567',
        phone: '(11) 98765-4321',
        email: 'contato@empresateste.com.br',
        is_active: true
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erro ao criar empresa:', error)
      throw error
    }
    
    console.log(`✅ Empresa criada com sucesso!`)
    console.log(`   ID: ${data.id}`)
    console.log(`   Nome: ${data.name}`)
    console.log(`   CNPJ: ${data.cnpj}`)
    console.log(`   Endereço: ${data.address}`)
    
    return data
  } catch (error) {
    console.error('❌ Erro:', error.message)
    throw error
  }
}

createTestCompany()
  .then(() => {
    console.log('\n✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Falha:', error)
    process.exit(1)
  })

