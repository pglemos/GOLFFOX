#!/usr/bin/env node

/**
 * Script para ativar usuário no Supabase
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A'

const USER_EMAIL = 'golffox@admin.com'

console.log('\n╔════════════════════════════════════════════════════════════════════╗')
console.log('║ 🔧 ATIVANDO USUÁRIO NO SUPABASE                                   ║')
console.log('╚════════════════════════════════════════════════════════════════════╝\n')

async function main() {
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    console.log(`📧 Email: ${USER_EMAIL}\n`)
    
    console.log('1️⃣  Buscando usuário...')
    const { data: users, error: searchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', USER_EMAIL)
    
    if (searchError) {
      console.log('   ❌ Erro:', searchError.message)
      return
    }
    
    if (!users || users.length === 0) {
      console.log('   ❌ Usuário não encontrado')
      return
    }
    
    const user = users[0]
    console.log('   ✅ Usuário encontrado!')
    console.log('   ID:', user.id)
    console.log('   Nome:', user.name)
    console.log('   Role:', user.role)
    console.log('   Ativo:', user.active ? 'Sim' : 'Não')
    console.log('')
    
    if (user.active) {
      console.log('   ℹ️  Usuário já está ativo')
      return
    }
    
    console.log('2️⃣  Ativando usuário...')
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ active: true })
      .eq('id', user.id)
      .select()
    
    if (updateError) {
      console.log('   ❌ Erro:', updateError.message)
      return
    }
    
    console.log('   ✅ Usuário ativado com sucesso!')
    console.log('')
    
    console.log('3️⃣  Verificando atualização...')
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (verifyError) {
      console.log('   ❌ Erro:', verifyError.message)
      return
    }
    
    console.log('   ✅ Status atual:')
    console.log('   Ativo:', verifyUser.active ? 'Sim ✅' : 'Não ❌')
    console.log('')
    
    console.log('╔════════════════════════════════════════════════════════════════════╗')
    console.log('║ ✅ USUÁRIO ATIVADO COM SUCESSO                                    ║')
    console.log('╚════════════════════════════════════════════════════════════════════╝\n')
    
  } catch (err) {
    console.error('❌ Erro:', err.message)
    console.error(err)
  }
}

main()

