/**
 * Script para criar empresa diretamente via Supabase Admin
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

async function createCompany() {
  console.log('🏢 Criando empresa de teste...')
  
  try {
    // Verificar empresas existentes
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5)
    
    if (checkError) {
      console.error('❌ Erro ao verificar empresas:', checkError)
    } else {
      console.log(`📋 Empresas existentes: ${existing?.length || 0}`)
      if (existing && existing.length > 0) {
        existing.forEach(c => console.log(`   - ${c.name} (${c.id})`))
      }
    }
    
    // Criar nova empresa
    const companyData = {
      name: 'Empresa Teste - GolfFox',
      cnpj: '12.345.678/0001-90',
      address: 'Rua Teste, 123 - São Paulo, SP - CEP 01234-567',
      phone: '(11) 98765-4321',
      email: 'contato@empresateste.com.br',
      is_active: true
    }
    
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single()
    
    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        console.log('⚠️ Empresa já existe, buscando...')
        const { data: found } = await supabase
          .from('companies')
          .select('*')
          .eq('name', companyData.name)
          .single()
        
        if (found) {
          console.log(`✅ Empresa encontrada: ${found.name} (${found.id})`)
          return found
        }
      }
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

createCompany()
  .then(() => {
    console.log('\n✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Falha:', error)
    process.exit(1)
  })

