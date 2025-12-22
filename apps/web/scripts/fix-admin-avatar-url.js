/**
 * Script para corrigir a URL do avatar do Admin GolfFox
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

async function fixAdminAvatar() {
  console.log('🔧 Corrigindo URL do avatar do Admin GolfFox...\n')

  const userId = '2cc5fc1b-f949-4f68-acc1-f6de490e2d88'
  const filePath = 'avatares/2cc5fc1b-f949-4f68-acc1-f6de490e2d88-1766438953588.png'

  // Gerar URL pública correta
  const { data: { publicUrl } } = supabase.storage
    .from('avatares')
    .getPublicUrl(filePath)

  console.log(`📝 URL correta: ${publicUrl}\n`)

  // Atualizar no banco
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name, avatar_url')
    .eq('id', userId)
    .maybeSingle()

  if (userError || !user) {
    console.error('❌ Erro ao buscar usuário:', userError?.message)
    return
  }

  console.log(`👤 Usuário: ${user.name || user.email}`)
  console.log(`📝 URL atual: ${user.avatar_url}\n`)

  if (user.avatar_url !== publicUrl) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      console.error(`❌ Erro ao atualizar:`, updateError.message)
    } else {
      console.log(`✅ URL atualizada com sucesso!`)
      console.log(`\n🌐 Nova URL: ${publicUrl}`)
      console.log(`\n🧪 Teste a URL no navegador para verificar se a imagem carrega.`)
    }
  } else {
    console.log(`✅ URL já está correta!`)
  }
}

fixAdminAvatar().catch(console.error)

