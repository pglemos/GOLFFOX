#!/usr/bin/env node

/**
 * Script para verificar schema da tabela users
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A'

const USER_EMAIL = 'golffox@admin.com'

console.log('\n╔════════════════════════════════════════════════════════════════════╗')
console.log('║ 🔍 VERIFICANDO SCHEMA DA TABELA USERS                             ║')
console.log('╚════════════════════════════════════════════════════════════════════╝\n')

async function main() {
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    console.log('1️⃣  Buscando usuário de teste...')
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', USER_EMAIL)
      .single()
    
    if (userError) {
      console.log('   ❌ Erro:', userError.message)
      return
    }
    
    console.log('   ✅ Usuário encontrado!')
    console.log('')
    
    console.log('2️⃣  Estrutura da tabela users:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const columns = Object.keys(user)
    columns.forEach((col, index) => {
      const value = user[col]
      const type = typeof value
      const displayValue = value === null ? 'null' 
        : type === 'string' && value.length > 50 ? value.substring(0, 50) + '...'
        : value === true ? 'true'
        : value === false ? 'false'
        : value
      
      console.log(`   ${index + 1}. ${col}`)
      console.log(`      Tipo: ${type}`)
      console.log(`      Valor: ${displayValue}`)
      console.log('')
    })
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log('3️⃣  Dados completos do usuário:')
    console.log(JSON.stringify(user, null, 2))
    console.log('')
    
    console.log('╔════════════════════════════════════════════════════════════════════╗')
    console.log('║ ✅ SCHEMA VERIFICADO                                              ║')
    console.log('╚════════════════════════════════════════════════════════════════════╝\n')
    
  } catch (err) {
    console.error('❌ Erro:', err.message)
    console.error(err)
  }
}

main()

