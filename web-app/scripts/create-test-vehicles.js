/**
 * Script para criar veículos de teste
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

async function createTestVehicles() {
  console.log('🚗 Criando veículos de teste...')
  
  try {
    // Buscar empresa "Acme Corp" (pegar a primeira se houver múltiplas)
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', 'Acme Corp')
      .limit(1)
    
    if (companyError) throw companyError
    
    if (!companies || companies.length === 0) {
      console.error('❌ Empresa "Acme Corp" não encontrada')
      process.exit(1)
    }
    
    const company = companies[0]
    console.log(`✅ Empresa encontrada: ${company.name} (${company.id})`)
    
    // Lista de veículos de teste (usando placas únicas com timestamp)
    const timestamp = Date.now().toString().slice(-6)
    const vehicles = [
      { plate: `ABC-${timestamp.slice(0, 4)}`, model: 'Mercedes Sprinter', capacity: 20 },
      { plate: `DEF-${timestamp.slice(2, 6)}`, model: 'Volkswagen Crafter', capacity: 15 },
      { plate: `GHI-${timestamp.slice(1, 5)}`, model: 'Iveco Daily', capacity: 25 },
    ]
    
    // Verificar veículos existentes
    const { data: existing, error: checkError } = await supabase
      .from('vehicles')
      .select('plate')
      .eq('company_id', company.id)
      .in('plate', vehicles.map(v => v.plate))
    
    if (checkError) throw checkError
    
    const existingPlates = new Set(existing?.map(v => v.plate) || [])
    
    // Criar apenas veículos que não existem
    const toCreate = vehicles.filter(v => !existingPlates.has(v.plate))
    
    if (toCreate.length === 0) {
      console.log('✅ Todos os veículos de teste já existem')
      return
    }
    
    console.log(`📝 Criando ${toCreate.length} veículo(s)...`)
    
    const { data: created, error: createError } = await supabase
      .from('vehicles')
      .insert(
        toCreate.map(v => ({
          company_id: company.id,
          plate: v.plate,
          model: v.model,
          capacity: v.capacity,
          is_active: true,
        }))
      )
      .select('id, plate, model, capacity')
    
    if (createError) throw createError
    
    console.log(`✅ ${created.length} veículo(s) criado(s):`)
    created.forEach(v => {
      console.log(`   - ${v.model} (Placa: ${v.plate}, Capacidade: ${v.capacity})`)
    })
    
  } catch (error) {
    console.error('❌ Erro ao criar veículos:', error.message)
    process.exit(1)
  }
}

createTestVehicles()
  .then(() => {
    console.log('\n✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Falha:', error)
    process.exit(1)
  })

