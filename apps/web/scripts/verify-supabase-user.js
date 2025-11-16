#!/usr/bin/env node

/**
 * Script para verificar usuário no Supabase
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU'

const TEST_EMAIL = 'golffox@admin.com'
const TEST_PASSWORD = 'senha123'

console.log('\n╔════════════════════════════════════════════════════════════════════╗')
console.log('║ 🔍 VERIFICAÇÃO DE USUÁRIO NO SUPABASE                             ║')
console.log('╚════════════════════════════════════════════════════════════════════╝\n')

async function main() {
  try {
    console.log('📋 Credenciais de teste:')
    console.log(`   Email: ${TEST_EMAIL}`)
    console.log(`   Senha: ${TEST_PASSWORD}\n`)

    // 1. Verificar conexão com Supabase
    console.log('1️⃣  Verificando conexão com Supabase...')
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Testar conexão
    const { data: testConnection, error: connError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)
    
    if (connError) {
      console.log('   ❌ Erro de conexão:', connError.message)
      return
    }
    console.log('   ✅ Conexão estabelecida\n')

    // 2. Buscar usuário no auth.users
    console.log('2️⃣  Buscando usuário na tabela auth.users...')
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.log('   ❌ Erro:', authError.message)
    } else {
      const user = authUser.users.find(u => u.email === TEST_EMAIL)
      if (user) {
        console.log('   ✅ Usuário encontrado!')
        console.log('   ID:', user.id)
        console.log('   Email:', user.email)
        console.log('   Email confirmado:', user.email_confirmed_at ? 'Sim' : 'Não')
        console.log('   Criado em:', user.created_at)
        console.log('   Último login:', user.last_sign_in_at || 'Nunca')
      } else {
        console.log('   ⚠️  Usuário NÃO encontrado em auth.users')
        console.log('   Total de usuários:', authUser.users.length)
        console.log('   Usuários disponíveis:')
        authUser.users.forEach(u => {
          console.log(`     - ${u.email} (${u.id})`)
        })
      }
    }
    console.log('')

    // 3. Buscar usuário na tabela public.users
    console.log('3️⃣  Buscando usuário na tabela public.users...')
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', TEST_EMAIL)
    
    if (publicError) {
      console.log('   ❌ Erro:', publicError.message)
    } else if (publicUsers && publicUsers.length > 0) {
      const user = publicUsers[0]
      console.log('   ✅ Usuário encontrado!')
      console.log('   ID:', user.id)
      console.log('   Email:', user.email)
      console.log('   Nome:', user.name)
      console.log('   Role:', user.role)
      console.log('   Ativo:', user.active ? 'Sim' : 'Não')
    } else {
      console.log('   ⚠️  Usuário NÃO encontrado em public.users')
    }
    console.log('')

    // 4. Testar autenticação com signInWithPassword
    console.log('4️⃣  Testando autenticação com signInWithPassword...')
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    
    if (signInError) {
      console.log('   ❌ Erro de autenticação:', signInError.message)
      console.log('   Código:', signInError.status)
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('\n   💡 Possíveis causas:')
        console.log('      1. Senha incorreta')
        console.log('      2. Usuário não existe em auth.users')
        console.log('      3. Email não confirmado')
        console.log('      4. Usuário desabilitado')
      }
    } else {
      console.log('   ✅ Autenticação bem-sucedida!')
      console.log('   User ID:', signInData.user.id)
      console.log('   Email:', signInData.user.email)
      console.log('   Token:', signInData.session.access_token.substring(0, 50) + '...')
    }
    console.log('')

    // 5. Se usuário não existe, sugerir criação
    if (!authUser.users.find(u => u.email === TEST_EMAIL)) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('⚠️  ATENÇÃO: Usuário não existe em auth.users')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      console.log('💡 Para criar o usuário, execute:\n')
      console.log('   1. Acesse: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/auth/users')
      console.log('   2. Clique em "Add user" > "Create new user"')
      console.log(`   3. Email: ${TEST_EMAIL}`)
      console.log(`   4. Password: ${TEST_PASSWORD}`)
      console.log('   5. Marque "Auto Confirm User"\n')
      
      console.log('   OU execute via SQL:\n')
      console.log(`   -- Criar usuário no auth`)
      console.log(`   INSERT INTO auth.users (`)
      console.log(`     instance_id,`)
      console.log(`     id,`)
      console.log(`     email,`)
      console.log(`     encrypted_password,`)
      console.log(`     email_confirmed_at,`)
      console.log(`     raw_app_meta_data,`)
      console.log(`     raw_user_meta_data,`)
      console.log(`     created_at,`)
      console.log(`     updated_at,`)
      console.log(`     role`)
      console.log(`   ) VALUES (`)
      console.log(`     '00000000-0000-0000-0000-000000000000',`)
      console.log(`     gen_random_uuid(),`)
      console.log(`     '${TEST_EMAIL}',`)
      console.log(`     crypt('${TEST_PASSWORD}', gen_salt('bf')),`)
      console.log(`     NOW(),`)
      console.log(`     '{"provider":"email","providers":["email"]}',`)
      console.log(`     '{}',`)
      console.log(`     NOW(),`)
      console.log(`     NOW(),`)
      console.log(`     'authenticated'`)
      console.log(`   );\n`)
    }

    console.log('╔════════════════════════════════════════════════════════════════════╗')
    console.log('║ ✅ VERIFICAÇÃO CONCLUÍDA                                          ║')
    console.log('╚════════════════════════════════════════════════════════════════════╝\n')

  } catch (err) {
    console.error('❌ Erro:', err.message)
    console.error(err)
  }
}

main()

