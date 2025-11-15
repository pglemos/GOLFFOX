/**
 * Script para testar RLS da tabela users
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY

const TEST_EMAIL = process.env.TEST_EMAIL || 'golffox@admin.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'senha123'

console.log('🔍 TESTANDO RLS DA TABELA USERS\n')
console.log('═══════════════════════════════════════\n')

async function testRLS() {
  try {
    // 1. Testar com service role (bypass RLS)
    console.log('1️⃣  Testando com SERVICE ROLE KEY (bypass RLS)...\n')
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('email', TEST_EMAIL)
      .maybeSingle()
    
    if (adminError) {
      console.error('❌ Erro com service role:', adminError.message)
    } else if (adminUsers) {
      console.log(`✅ Usuário encontrado com service role: ${adminUsers.id}`)
      console.log(`   Email: ${adminUsers.email}`)
      console.log(`   Role: ${adminUsers.role || 'Não definido'}\n`)
    } else {
      console.log('❌ Usuário não encontrado mesmo com service role\n')
    }
    
    // 2. Testar com anon key (sem autenticação)
    console.log('2️⃣  Testando com ANON KEY (sem autenticação)...\n')
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    const { data: anonUsers, error: anonError } = await supabaseAnon
      .from('users')
      .select('id, email, role')
      .eq('email', TEST_EMAIL)
      .maybeSingle()
    
    if (anonError) {
      console.log(`❌ Erro com anon key: ${anonError.message}`)
      console.log(`   Código: ${anonError.code || 'N/A'}\n`)
    } else if (anonUsers) {
      console.log(`✅ Usuário encontrado com anon key: ${anonUsers.id}\n`)
    } else {
      console.log('⚠️  Usuário não encontrado com anon key (RLS bloqueando?)\n')
    }
    
    // 3. Testar com anon key APÓS autenticação
    console.log('3️⃣  Testando com ANON KEY APÓS AUTENTICAÇÃO...\n')
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    
    if (authError) {
      console.error('❌ Erro ao autenticar:', authError.message)
      return
    }
    
    console.log(`✅ Autenticado: ${authData.user.id}\n`)
    
    // Agora tentar buscar usuário
    const { data: authUsers, error: authUsersError } = await supabaseAnon
      .from('users')
      .select('id, email, role')
      .eq('email', TEST_EMAIL)
      .maybeSingle()
    
    if (authUsersError) {
      console.log(`❌ Erro ao buscar usuário após auth: ${authUsersError.message}`)
      console.log(`   Código: ${authUsersError.code || 'N/A'}\n`)
    } else if (authUsers) {
      console.log(`✅ Usuário encontrado após autenticação: ${authUsers.id}`)
      console.log(`   Email: ${authUsers.email}`)
      console.log(`   Role: ${authUsers.role || 'Não definido'}\n`)
    } else {
      console.log('❌ Usuário não encontrado mesmo após autenticação\n')
    }
    
    // 4. Verificar políticas RLS
    console.log('4️⃣  Verificando políticas RLS...\n')
    const { data: policies, error: policiesError } = await supabaseAdmin.rpc('pg_policies', {
      schemaname: 'public',
      tablename: 'users'
    }).catch(() => ({ data: null, error: { message: 'Função não disponível' } }))
    
    if (policiesError) {
      // Tentar query direta
      const { data: policiesData, error: policiesQueryError } = await supabaseAdmin
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'users')
        .catch(() => ({ data: null, error: { message: 'Tabela não acessível' } }))
      
      if (policiesQueryError) {
        console.log('⚠️  Não foi possível verificar políticas RLS diretamente')
        console.log('   Verifique manualmente no Supabase Dashboard\n')
      } else {
        console.log(`✅ ${policiesData?.length || 0} política(s) RLS encontrada(s)\n`)
      }
    } else {
      console.log(`✅ ${policies?.length || 0} política(s) RLS encontrada(s)\n`)
    }
    
    // Limpar
    await supabaseAnon.auth.signOut()
    
    console.log('═══════════════════════════════════════')
    console.log('\n📊 CONCLUSÃO:\n')
    
    if (adminUsers && !authUsers) {
      console.log('⚠️  PROBLEMA IDENTIFICADO: RLS está bloqueando acesso!')
      console.log('   - Usuário existe (verificado com service role)')
      console.log('   - RLS está bloqueando acesso com anon key')
      console.log('   - É necessário ajustar as políticas RLS da tabela users\n')
      console.log('🔧 SOLUÇÃO:')
      console.log('   1. Acesse o Supabase Dashboard')
      console.log('   2. Vá em Authentication > Policies')
      console.log('   3. Verifique/ajuste as políticas da tabela users')
      console.log('   4. Certifique-se de que usuários autenticados podem ler seus próprios dados\n')
    } else if (adminUsers && authUsers) {
      console.log('✅ TUDO FUNCIONANDO CORRETAMENTE!')
      console.log('   - Usuário existe na tabela')
      console.log('   - RLS permite acesso após autenticação')
      console.log('   - Login deve funcionar corretamente\n')
    } else {
      console.log('❌ Usuário não encontrado na tabela users')
      console.log('   Execute: node scripts/create-user-in-db.js\n')
    }
    
    console.log('═══════════════════════════════════════\n')
    
  } catch (err) {
    console.error('\n❌ Erro:', err.message)
    console.error(err)
    process.exit(1)
  }
}

testRLS()

