/**
 * Script para Verificar/Criar Usuários de Teste
 * 
 * Verifica se os usuários de teste existem no banco e têm roles corretos
 * 
 * Uso:
 *   node scripts/verify-test-users.js
 * 
 * Requisitos:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Tentar carregar .env
const envPaths = [
  path.join(__dirname, '..', 'apps', 'web', '.env.local'),
  path.join(__dirname, '..', 'apps', 'web', '.env'),
  path.join(__dirname, '..', '.env.local'),
  path.join(__dirname, '..', '.env')
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath })
    break
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Usuários de teste esperados
const TEST_USERS = [
  { email: 'golffox@admin.com', role: 'admin', name: 'Admin GolfFox' },
  { email: 'teste@empresa.com', role: 'empresa', name: 'Teste Empresa' },
  { email: 'teste@transportadora.com', role: 'operador', name: 'Teste Transportadora' },
]

/**
 * Verificar usuário
 */
async function verifyUser(testUser) {
  console.log(`\n🔍 Verificando: ${testUser.email}`)
  
  try {
    // Verificar em auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error(`   ❌ Erro ao buscar em auth.users: ${authError.message}`)
      return { exists: false, hasCorrectRole: false, error: authError.message }
    }
    
    const authUser = authUsers?.users?.find(u => u.email === testUser.email)
    
    if (!authUser) {
      console.log(`   ⚠️  Usuário não encontrado em auth.users`)
      console.log(`   💡 Ação necessária: Criar usuário no Supabase Auth`)
      return { exists: false, hasCorrectRole: false, needsCreation: true }
    }
    
    console.log(`   ✅ Existe em auth.users (ID: ${authUser.id})`)
    
    // Verificar em public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('id, email, role, name, company_id, transportadora_id')
      .eq('id', authUser.id)
      .maybeSingle()
    
    if (publicError) {
      console.error(`   ❌ Erro ao buscar em public.users: ${publicError.message}`)
      return { exists: true, hasCorrectRole: false, error: publicError.message }
    }
    
    if (!publicUser) {
      console.log(`   ⚠️  Usuário não encontrado em public.users`)
      console.log(`   💡 Ação necessária: Criar registro em public.users`)
      return { exists: true, hasCorrectRole: false, needsUserTableEntry: true }
    }
    
    console.log(`   ✅ Existe em public.users`)
    console.log(`   📋 Role atual: ${publicUser.role || '(não definido)'}`)
    console.log(`   📋 Role esperado: ${testUser.role}`)
    
    const hasCorrectRole = publicUser.role === testUser.role
    
    if (!hasCorrectRole) {
      console.log(`   ⚠️  Role incorreto!`)
      console.log(`   💡 Ação necessária: Atualizar role para '${testUser.role}'`)
    } else {
      console.log(`   ✅ Role correto`)
    }
    
    return {
      exists: true,
      hasCorrectRole,
      authUserId: authUser.id,
      publicUser,
      needsRoleUpdate: !hasCorrectRole
    }
    
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`)
    return { exists: false, hasCorrectRole: false, error: error.message }
  }
}

/**
 * Main
 */
async function main() {
  console.log('🔍 Verificando Usuários de Teste\n')
  console.log('='.repeat(60))
  
  const results = []
  
  for (const testUser of TEST_USERS) {
    const result = await verifyUser(testUser)
    results.push({ testUser, ...result })
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO')
  console.log('='.repeat(60) + '\n')
  
  const allExist = results.every(r => r.exists)
  const allHaveCorrectRole = results.every(r => r.hasCorrectRole)
  
  console.log(`✅ Usuários existem: ${results.filter(r => r.exists).length}/${results.length}`)
  console.log(`✅ Roles corretos: ${results.filter(r => r.hasCorrectRole).length}/${results.length}`)
  
  if (!allExist || !allHaveCorrectRole) {
    console.log('\n⚠️  AÇÕES NECESSÁRIAS:\n')
    
    results.forEach(({ testUser, exists, hasCorrectRole, needsCreation, needsUserTableEntry, needsRoleUpdate }) => {
      if (!exists) {
        console.log(`1. Criar usuário: ${testUser.email}`)
        console.log(`   - Criar em Supabase Auth (Authentication → Users → Add User)`)
        console.log(`   - Criar registro em public.users com role='${testUser.role}'`)
      } else if (needsUserTableEntry) {
        console.log(`2. Criar registro em public.users para: ${testUser.email}`)
        console.log(`   SQL: INSERT INTO users (id, email, role, name) VALUES ('${testUser.authUserId}', '${testUser.email}', '${testUser.role}', '${testUser.name}')`)
      } else if (needsRoleUpdate) {
        console.log(`3. Atualizar role para: ${testUser.email}`)
        console.log(`   SQL: UPDATE users SET role='${testUser.role}' WHERE email='${testUser.email}'`)
      }
    })
    
    console.log('\n💡 Ver: docs/MIGRATIONS_APLICAR_URGENTE.md para mais detalhes')
    process.exitCode = 1
  } else {
    console.log('\n✅ Todos os usuários de teste estão configurados corretamente!')
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Erro:', error.message)
    process.exit(1)
  })
}

module.exports = { verifyUser }

