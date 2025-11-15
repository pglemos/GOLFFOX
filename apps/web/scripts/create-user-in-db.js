/**
 * Script para criar usuário na tabela users do banco de dados
 * Este script cria o usuário na tabela users se ele não existir
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY

const TEST_EMAIL = process.env.TEST_EMAIL || 'golffox@admin.com'

console.log('🔧 CRIANDO USUÁRIO NA TABELA USERS\n')
console.log('═══════════════════════════════════════\n')

async function createUserInDatabase() {
  try {
    // Usar service role key para bypass RLS (necessário para criar usuário)
    if (!SUPABASE_SERVICE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!')
      console.error('   É necessário usar a service role key para criar usuários na tabela users')
      console.error('   Configure a variável SUPABASE_SERVICE_ROLE_KEY no ambiente\n')
      process.exit(1)
    }
    
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    // 1. Verificar se usuário existe no Supabase Auth
    console.log('1️⃣  Verificando usuário no Supabase Auth...')
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Erro ao listar usuários:', authError.message)
      process.exit(1)
    }
    
    const authUser = authUsers.users.find(u => u.email === TEST_EMAIL)
    
    if (!authUser) {
      console.error(`❌ Usuário ${TEST_EMAIL} não encontrado no Supabase Auth!`)
      console.error('   Crie o usuário primeiro no Supabase Auth antes de executar este script\n')
      process.exit(1)
    }
    
    console.log(`✅ Usuário encontrado no Supabase Auth: ${authUser.id}\n`)
    
    // 2. Verificar se usuário já existe na tabela users
    console.log('2️⃣  Verificando se usuário existe na tabela users...')
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', authUser.id)
      .maybeSingle()
    
    if (checkError && !checkError.message.includes('does not exist')) {
      console.error('❌ Erro ao verificar usuário:', checkError.message)
      process.exit(1)
    }
    
    if (existingUser) {
      console.log(`✅ Usuário já existe na tabela users: ${existingUser.id}`)
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Role: ${existingUser.role || 'Não definido'}\n`)
      console.log('═══════════════════════════════════════')
      console.log('\n🎉 USUÁRIO JÁ EXISTE!\n')
      console.log('═══════════════════════════════════════\n')
      return
    }
    
    // 3. Criar usuário na tabela users
    console.log('3️⃣  Criando usuário na tabela users...')
    
    // Determinar role baseado no email
    let role = 'admin'
    if (TEST_EMAIL.includes('operator')) {
      role = 'operator'
    } else if (TEST_EMAIL.includes('carrier')) {
      role = 'carrier'
    } else if (TEST_EMAIL.includes('driver')) {
      role = 'driver'
    }
    
    // Verificar se existe uma company (necessário para alguns roles)
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1)
      .maybeSingle()
    
    const userData = {
      id: authUser.id,
      email: authUser.email,
      role: role,
    }
    
    // Adicionar company_id se existir e o role for operator
    if (companies && (role === 'operator' || role === 'admin')) {
      userData.company_id = companies.id
    }
    
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Erro ao criar usuário:', createError.message)
      console.error('   Detalhes:', createError)
      process.exit(1)
    }
    
    console.log(`✅ Usuário criado na tabela users: ${newUser.id}`)
    console.log(`   Email: ${newUser.email}`)
    console.log(`   Role: ${newUser.role}`)
    if (newUser.company_id) {
      console.log(`   Company ID: ${newUser.company_id}`)
    }
    console.log('')
    
    console.log('═══════════════════════════════════════')
    console.log('\n🎉 USUÁRIO CRIADO COM SUCESSO!\n')
    console.log('✅ Usuário existe no Supabase Auth')
    console.log('✅ Usuário existe na tabela users')
    console.log(`✅ Role: ${newUser.role}`)
    console.log('\n📝 PRÓXIMOS PASSOS:')
    console.log('   1. Teste o login novamente')
    console.log('   2. Verifique se o login funciona corretamente')
    console.log('   3. Verifique se não há loop de redirecionamento')
    console.log('\n═══════════════════════════════════════\n')
    
  } catch (err) {
    console.error('\n❌ Erro inesperado:', err.message)
    console.error(err)
    process.exit(1)
  }
}

createUserInDatabase()

