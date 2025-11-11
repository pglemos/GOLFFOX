/**
 * Script para criar empresa e operador operador@empresa.com
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY

const OPERATOR_EMAIL = 'operador@empresa.com'
const OPERATOR_PASSWORD = 'Operador123!@#'
const COMPANY_NAME = 'Empresa Operador'

console.log('🏢 CRIANDO EMPRESA E OPERADOR\n')
console.log('═══════════════════════════════════════\n')

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!')
  console.error('   Configure a variável SUPABASE_SERVICE_ROLE_KEY no ambiente\n')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createCompanyAndOperator() {
  try {
    // 1. Verificar se empresa já existe
    console.log('1️⃣  Verificando se empresa já existe...')
    const { data: existingCompany, error: companyCheckError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('name', COMPANY_NAME)
      .maybeSingle()
    
    if (companyCheckError && !companyCheckError.message.includes('does not exist')) {
      console.error('❌ Erro ao verificar empresa:', companyCheckError.message)
      process.exit(1)
    }
    
    let companyId
    if (existingCompany) {
      console.log(`✅ Empresa já existe: ${existingCompany.name} (${existingCompany.id})\n`)
      companyId = existingCompany.id
    } else {
      console.log('2️⃣  Criando empresa...')
      const { data: newCompany, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({
          name: COMPANY_NAME,
        })
        .select()
        .single()
      
      if (companyError) {
        console.error('❌ Erro ao criar empresa:', companyError.message)
        process.exit(1)
      }
      
      console.log(`✅ Empresa criada: ${newCompany.name} (${newCompany.id})\n`)
      companyId = newCompany.id
    }
    
    // 2. Verificar se usuário já existe no Supabase Auth
    console.log('3️⃣  Verificando se usuário já existe no Supabase Auth...')
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message)
      process.exit(1)
    }
    
    const existingAuthUser = authUsers.users.find(u => u.email === OPERATOR_EMAIL)
    
    let userId
    if (existingAuthUser) {
      console.log(`✅ Usuário já existe no Supabase Auth: ${existingAuthUser.id}\n`)
      userId = existingAuthUser.id
    } else {
      console.log('4️⃣  Criando usuário no Supabase Auth...')
      const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: OPERATOR_EMAIL,
        password: OPERATOR_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: 'Operador',
          role: 'operator',
        },
        app_metadata: {
          role: 'operator',
        }
      })
      
      if (createUserError) {
        console.error('❌ Erro ao criar usuário:', createUserError.message)
        process.exit(1)
      }
      
      if (!authData.user) {
        console.error('❌ Usuário não foi criado')
        process.exit(1)
      }
      
      console.log(`✅ Usuário criado no Supabase Auth: ${authData.user.id}\n`)
      userId = authData.user.id
    }
    
    // 3. Verificar/criar usuário na tabela users
    console.log('5️⃣  Verificando usuário na tabela users...')
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, company_id')
      .eq('id', userId)
      .maybeSingle()
    
    if (userCheckError && !userCheckError.message.includes('does not exist')) {
      console.error('❌ Erro ao verificar usuário:', userCheckError.message)
      process.exit(1)
    }
    
    if (existingUser) {
      console.log(`✅ Usuário já existe na tabela users`)
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Role: ${existingUser.role || 'Não definido'}`)
      console.log(`   Company ID: ${existingUser.company_id || 'Não vinculado'}\n`)
      
      // Atualizar company_id se necessário
      if (existingUser.company_id !== companyId) {
        console.log('6️⃣  Atualizando vínculo com empresa...')
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ company_id: companyId })
          .eq('id', userId)
        
        if (updateError) {
          console.error('❌ Erro ao atualizar vínculo:', updateError.message)
        } else {
          console.log('✅ Vínculo atualizado com sucesso\n')
        }
      }
    } else {
      console.log('6️⃣  Criando usuário na tabela users...')
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: OPERATOR_EMAIL,
          role: 'operator',
          company_id: companyId,
        })
        .select()
        .single()
      
      if (userError) {
        console.error('❌ Erro ao criar usuário na tabela:', userError.message)
        console.error('   Detalhes:', userError)
        process.exit(1)
      }
      
      console.log(`✅ Usuário criado na tabela users: ${newUser.id}\n`)
    }
    
    console.log('═══════════════════════════════════════')
    console.log('\n🎉 EMPRESA E OPERADOR CRIADOS COM SUCESSO!\n')
    console.log('📋 DETALHES:')
    console.log(`   Empresa: ${COMPANY_NAME}`)
    console.log(`   Company ID: ${companyId}`)
    console.log(`   Email: ${OPERATOR_EMAIL}`)
    console.log(`   Senha: ${OPERATOR_PASSWORD}`)
    console.log(`   Role: operator`)
    console.log(`   User ID: ${userId}\n`)
    console.log('🔗 TESTE O LOGIN:')
    console.log(`   URL: https://golffox.vercel.app/`)
    console.log(`   Email: ${OPERATOR_EMAIL}`)
    console.log(`   Senha: ${OPERATOR_PASSWORD}\n`)
    console.log('═══════════════════════════════════════\n')
    
  } catch (err) {
    console.error('\n❌ Erro inesperado:', err.message)
    console.error(err)
    process.exit(1)
  }
}

createCompanyAndOperator()

