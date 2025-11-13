/**
 * Script para criar funcionários de teste para a empresa "Acme Corp"
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

async function createTestEmployees() {
  console.log('👥 Criando funcionários de teste...')
  
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
    
    // Lista de funcionários de teste (com coordenadas aproximadas de São Paulo)
    const employees = [
      { name: 'João Silva', cpf: '12345678901', address: 'Rua A, 100 - Centro, São Paulo - SP', latitude: -23.5505, longitude: -46.6333 },
      { name: 'Maria Santos', cpf: '23456789012', address: 'Rua B, 200 - Jardim Paulista, São Paulo - SP', latitude: -23.5600, longitude: -46.6400 },
      { name: 'Pedro Oliveira', cpf: '34567890123', address: 'Rua C, 300 - Vila Madalena, São Paulo - SP', latitude: -23.5450, longitude: -46.6250 },
      { name: 'Ana Costa', cpf: '45678901234', address: 'Rua D, 400 - Pinheiros, São Paulo - SP', latitude: -23.5550, longitude: -46.6380 },
      { name: 'Carlos Souza', cpf: '56789012345', address: 'Rua E, 500 - Itaim Bibi, São Paulo - SP', latitude: -23.5400, longitude: -46.6300 },
    ]
    
    // Verificar funcionários existentes
    const { data: existing, error: checkError } = await supabase
      .from('gf_employee_company')
      .select('cpf')
      .eq('company_id', company.id)
    
    if (checkError) throw checkError
    
    const existingCpfs = new Set(existing?.map(e => e.cpf) || [])
    
    // Criar apenas funcionários que não existem
    const toCreate = employees.filter(emp => !existingCpfs.has(emp.cpf))
    
    // Atualizar funcionários existentes com coordenadas se não tiverem
    const toUpdate = employees.filter(emp => existingCpfs.has(emp.cpf))
    if (toUpdate.length > 0) {
      console.log(`📝 Atualizando ${toUpdate.length} funcionário(s) existente(s) com coordenadas...`)
      for (const emp of toUpdate) {
        const { error: updateError } = await supabase
          .from('gf_employee_company')
          .update({
            latitude: emp.latitude,
            longitude: emp.longitude,
          })
          .eq('company_id', company.id)
          .eq('cpf', emp.cpf)
        
        if (updateError) {
          console.warn(`⚠️ Erro ao atualizar ${emp.name}:`, updateError.message)
        } else {
          console.log(`   ✅ ${emp.name} atualizado`)
        }
      }
    }
    
    if (toCreate.length === 0) {
      console.log('✅ Todos os funcionários de teste já existem (e foram atualizados com coordenadas)')
      return
    }
    
    console.log(`📝 Criando ${toCreate.length} funcionário(s)...`)
    
    const { data: created, error: createError } = await supabase
      .from('gf_employee_company')
      .insert(
        toCreate.map(emp => ({
          company_id: company.id,
          name: emp.name,
          cpf: emp.cpf,
          address: emp.address,
          login_cpf: emp.cpf,
          is_active: true,
          latitude: emp.latitude,
          longitude: emp.longitude,
        }))
      )
      .select('id, name, cpf')
    
    if (createError) throw createError
    
    console.log(`✅ ${created.length} funcionário(s) criado(s):`)
    created.forEach(emp => {
      console.log(`   - ${emp.name} (CPF: ${emp.cpf})`)
    })
    
  } catch (error) {
    console.error('❌ Erro ao criar funcionários:', error.message)
    process.exit(1)
  }
}

createTestEmployees()
  .then(() => {
    console.log('\n✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Falha:', error)
    process.exit(1)
  })
