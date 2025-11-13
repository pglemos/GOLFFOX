/**
 * Script para criar motoristas de teste
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

async function createTestDrivers() {
  console.log('👨‍✈️ Criando motoristas de teste...')
  
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
    
    // Lista de motoristas de teste
    const drivers = [
      { name: 'Roberto Alves', cpf: '11122233344', email: 'roberto.alves@acme.com' },
      { name: 'Fernando Costa', cpf: '22233344455', email: 'fernando.costa@acme.com' },
      { name: 'Paulo Silva', cpf: '33344455566', email: 'paulo.silva@acme.com' },
    ]
    
    // Verificar motoristas existentes
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('cpf')
      .eq('role', 'driver')
      .in('cpf', drivers.map(d => d.cpf))
    
    if (checkError) throw checkError
    
    const existingCpfs = new Set(existing?.map(d => d.cpf) || [])
    
    // Criar apenas motoristas que não existem
    const toCreate = drivers.filter(d => !existingCpfs.has(d.cpf))
    
    if (toCreate.length === 0) {
      console.log('✅ Todos os motoristas de teste já existem')
      return
    }
    
    console.log(`📝 Criando ${toCreate.length} motorista(s)...`)
    
    const created = []
    
    for (const driver of toCreate) {
      try {
        // Criar usuário no Supabase Auth primeiro
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: driver.email,
          password: 'senha123', // Senha padrão para teste
          email_confirm: true,
          user_metadata: {
            name: driver.name,
            role: 'driver'
          }
        })
        
        if (authError) {
          // Se usuário já existe, tentar obter
          if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
            const { data: existingUser } = await supabase.auth.admin.getUserByEmail(driver.email)
            if (existingUser?.user) {
              // Atualizar na tabela users
              const { error: updateError } = await supabase
                .from('users')
                .upsert({
                  id: existingUser.user.id,
                  email: driver.email,
                  name: driver.name,
                  cpf: driver.cpf,
                  role: 'driver',
                  company_id: company.id,
                }, { onConflict: 'id' })
              
              if (!updateError) {
                created.push({ id: existingUser.user.id, name: driver.name, cpf: driver.cpf, email: driver.email })
                console.log(`   ✅ ${driver.name} (já existia, atualizado)`)
              }
            }
          }
          continue
        }
        
        if (!authData?.user) continue
        
        // Inserir na tabela users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: driver.email,
            name: driver.name,
            cpf: driver.cpf,
            role: 'driver',
            company_id: company.id,
          })
        
        if (userError) {
          console.error(`   ❌ Erro ao criar ${driver.name}:`, userError.message)
          continue
        }
        
        created.push({ id: authData.user.id, name: driver.name, cpf: driver.cpf, email: driver.email })
        console.log(`   ✅ ${driver.name} criado`)
      } catch (error) {
        console.error(`   ❌ Erro ao criar ${driver.name}:`, error.message)
      }
    }
    
    console.log(`\n✅ ${created.length} motorista(s) processado(s) com sucesso`)
    
  } catch (error) {
    console.error('❌ Erro ao criar motoristas:', error.message)
    process.exit(1)
  }
}

createTestDrivers()
  .then(() => {
    console.log('\n✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Falha:', error)
    process.exit(1)
  })

