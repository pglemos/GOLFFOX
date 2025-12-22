/**
 * Script para corrigir URLs de avatar no banco de dados
 * Corrige:
 * 1. URLs com caminho duplicado (avatares/avatares/)
 * 2. URLs usando bucket errado (avatars vs avatares)
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function fixAvatarUrls() {
  console.log('🔧 Corrigindo URLs de avatar...\n')

  // Buscar todos os usuários com avatar_url
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, name, avatar_url')
    .not('avatar_url', 'is', null)

  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError.message)
    return
  }

  console.log(`📋 Encontrados ${users.length} usuário(s) com avatar_url\n`)

  for (const user of users) {
    if (!user.avatar_url) continue

    let newUrl = user.avatar_url
    let needsUpdate = false

    // Corrigir caminho duplicado: avatares/avatares/ -> avatares/
    if (newUrl.includes('/avatares/avatares/')) {
      newUrl = newUrl.replace('/avatares/avatares/', '/avatares/')
      needsUpdate = true
      console.log(`🔧 Corrigindo caminho duplicado para ${user.name || user.email}`)
    }

    // Corrigir bucket errado: avatars -> avatares
    if (newUrl.includes('/avatars/')) {
      newUrl = newUrl.replace('/avatars/', '/avatares/')
      needsUpdate = true
      console.log(`🔧 Corrigindo bucket errado para ${user.name || user.email}`)
    }

    // Remover timestamp da URL se existir (vamos salvar sem timestamp)
    if (newUrl.includes('?t=')) {
      newUrl = newUrl.split('?')[0]
      needsUpdate = true
    }

    if (needsUpdate) {
      console.log(`   Antes: ${user.avatar_url}`)
      console.log(`   Depois: ${newUrl}\n`)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: newUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error(`❌ Erro ao atualizar ${user.name || user.email}:`, updateError.message)
      } else {
        console.log(`✅ Atualizado: ${user.name || user.email}`)
      }
    } else {
      console.log(`✅ OK: ${user.name || user.email} - URL já está correta`)
    }
  }

  console.log('\n✅ Correção completa!')
}

fixAvatarUrls().catch(console.error)

