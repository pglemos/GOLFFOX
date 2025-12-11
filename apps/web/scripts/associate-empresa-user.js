/**
 * Script: Associar Operador a Empresa
 * Associa o usuário operador@empresa.com a uma empresa existente ou cria uma nova
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não definida')
  console.log('Defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function associateOperatorToCompany() {
  try {
    console.log('🔍 Buscando usuário operador@empresa.com...\n')
    
    // 1. Buscar usuário pelo email
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError)
      return
    }
    
    const operatorUser = authUsers.users.find(u => u.email === 'operador@empresa.com')
    
    if (!operatorUser) {
      console.error('❌ Usuário operador@empresa.com não encontrado no Supabase Auth')
      console.log('💡 Dica: Crie o usuário primeiro no Supabase ou use outro email')
      return
    }
    
    console.log(`✅ Usuário encontrado: ${operatorUser.email} (ID: ${operatorUser.id})\n`)
    
    // 2. Verificar se já existe mapeamento
    const { data: existingMapping } = await supabaseAdmin
      .from('gf_user_company_map')
      .select('*')
      .eq('user_id', operatorUser.id)
      .single()
    
    if (existingMapping) {
      console.log('✅ Mapeamento já existe!')
      console.log(`   Empresa ID: ${existingMapping.company_id}\n`)
      
      // Buscar nome da empresa
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('name')
        .eq('id', existingMapping.company_id)
        .single()
      
      if (company) {
        console.log(`   Nome da empresa: ${company.name}`)
      }
      return
    }
    
    // 3. Buscar ou criar empresa
    console.log('🔍 Buscando empresa existente...\n')
    
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
    
    if (companiesError) {
      console.error('❌ Erro ao buscar empresas:', companiesError)
      return
    }
    
    let companyId
    
    if (companies && companies.length > 0) {
      companyId = companies[0].id
      console.log(`✅ Usando empresa existente: ${companies[0].name} (ID: ${companyId})\n`)
    } else {
      console.log('📝 Criando nova empresa...\n')
      
      const { data: newCompany, error: createError } = await supabaseAdmin
        .from('companies')
        .insert({
          name: 'Empresa Operador',
          is_active: true,
          role: 'operator'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Erro ao criar empresa:', createError)
        return
      }
      
      companyId = newCompany.id
      console.log(`✅ Empresa criada: ${newCompany.name} (ID: ${companyId})\n`)
    }
    
    // 4. Criar mapeamento
    console.log('🔗 Criando mapeamento operador ↔ empresa...\n')
    
    const { data: mapping, error: mapError } = await supabaseAdmin
      .from('gf_user_company_map')
      .insert({
        user_id: operatorUser.id,
        company_id: companyId
      })
      .select()
      .single()
    
    if (mapError) {
      console.error('❌ Erro ao criar mapeamento:', mapError)
      return
    }
    
    console.log('✅ Mapeamento criado com sucesso!')
    console.log(`   User ID: ${mapping.user_id}`)
    console.log(`   Company ID: ${mapping.company_id}\n`)
    
    // 5. Atualizar perfil do usuário
    console.log('📝 Atualizando perfil do usuário...\n')
    
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: operatorUser.id,
        email: operatorUser.email,
        role: 'operator',
        company_id: companyId,
        is_active: true
      }, {
        onConflict: 'id'
      })
    
    if (profileError) {
      console.warn('⚠️ Aviso ao atualizar perfil:', profileError.message)
    } else {
      console.log('✅ Perfil atualizado!\n')
    }
    
    // 6. Verificar se funciona
    console.log('🧪 Verificando se a view v_my_companies retorna a empresa...\n')
    
    // Usar o token do usuário para testar a view
    const { data: { session } } = await supabaseAdmin.auth.signInWithPassword({
      email: 'operador@empresa.com',
      password: 'senha123' // Assumindo que a senha é esta
    })
    
    if (session) {
      const supabaseUser = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      })
      
      const { data: myCompanies, error: viewError } = await supabaseUser
        .from('v_my_companies')
        .select('*')
      
      if (viewError) {
        console.warn('⚠️ Erro ao testar view (pode ser normal se RLS estiver ativo):', viewError.message)
      } else {
        console.log(`✅ View retorna ${myCompanies?.length || 0} empresa(s)`)
        if (myCompanies && myCompanies.length > 0) {
          console.log(`   Empresa: ${myCompanies[0].name}`)
        }
      }
    } else {
      console.warn('⚠️ Não foi possível fazer login para testar a view')
    }
    
    console.log('\n✅ Processo concluído!')
    console.log('💡 Agora o operador deve conseguir ver empresas ao fazer login')
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

associateOperatorToCompany()

