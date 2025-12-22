/**
 * Script para verificar se o arquivo de avatar existe no storage
 * e corrigir a URL no banco se necessário
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

async function verifyAvatarFile() {
  console.log('🔍 Verificando arquivo de avatar do Admin GolfFox...\n')

  const userId = '2cc5fc1b-f949-4f68-acc1-f6de490e2d88'

  // Buscar usuário
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
  console.log(`📝 Avatar URL atual: ${user.avatar_url}\n`)

  // Listar todos os arquivos no bucket avatares
  console.log('📂 Listando arquivos no bucket "avatares"...')
  const { data: files, error: filesError } = await supabase.storage
    .from('avatares')
    .list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (filesError) {
    console.error('❌ Erro ao listar arquivos:', filesError.message)
    return
  }

  console.log(`✅ ${files.length} arquivo(s) encontrado(s)\n`)

  // Procurar arquivo do usuário
  const userFiles = files.filter(f => f.name.includes(userId))
  console.log(`🔍 Arquivos do usuário encontrados: ${userFiles.length}`)
  
  userFiles.forEach((file, index) => {
    const { data: { publicUrl } } = supabase.storage
      .from('avatares')
      .getPublicUrl(file.name)
    console.log(`   ${index + 1}. ${file.name}`)
    console.log(`      URL: ${publicUrl}`)
    console.log(`      Tamanho: ${(file.metadata?.size / 1024).toFixed(2)}KB`)
    console.log(`      Criado: ${file.created_at}\n`)
  })

  // Se encontrou arquivo, atualizar URL no banco
  if (userFiles.length > 0) {
    const latestFile = userFiles[0] // Pegar o mais recente
    const { data: { publicUrl } } = supabase.storage
      .from('avatares')
      .getPublicUrl(latestFile.name)

    if (user.avatar_url !== publicUrl) {
      console.log(`🔧 Atualizando URL no banco...`)
      console.log(`   Antes: ${user.avatar_url}`)
      console.log(`   Depois: ${publicUrl}\n`)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        console.error(`❌ Erro ao atualizar:`, updateError.message)
      } else {
        console.log(`✅ URL atualizada com sucesso!`)
        console.log(`\n🌐 Teste a URL: ${publicUrl}`)
      }
    } else {
      console.log(`✅ URL já está correta!`)
    }
  } else {
    console.log(`⚠️  Nenhum arquivo encontrado para este usuário no bucket "avatares"`)
    console.log(`   O usuário precisa fazer upload de uma nova imagem.`)
  }
}

verifyAvatarFile().catch(console.error)

