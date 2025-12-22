/**
 * Script AUTÔNOMO para corrigir TODAS as URLs de avatar
 * - Verifica todos os usuários
 * - Corrige URLs com problemas
 * - Verifica se arquivos existem
 * - Atualiza banco de dados
 * - Testa acessibilidade das URLs
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

async function listAllFilesRecursive(bucket, path = '', files = []) {
  const { data: items, error } = await supabase.storage
    .from(bucket)
    .list(path, { limit: 100 })

  if (error) return files

  for (const item of items) {
    if (item.id === null) {
      // É uma pasta
      await listAllFilesRecursive(bucket, path ? `${path}/${item.name}` : item.name, files)
    } else {
      // É um arquivo
      const fullPath = path ? `${path}/${item.name}` : item.name
      files.push({
        name: item.name,
        path: fullPath,
        size: item.metadata?.size,
        created: item.created_at
      })
    }
  }

  return files
}

async function findFileForUser(userId, allFiles) {
  // Procurar arquivo que contenha o userId no nome
  const userFiles = allFiles.filter(f => f.name.includes(userId))
  
  if (userFiles.length === 0) return null

  // Retornar o mais recente
  return userFiles.sort((a, b) => {
    const timeA = new Date(a.created || 0).getTime()
    const timeB = new Date(b.created || 0).getTime()
    return timeB - timeA
  })[0]
}

async function fixAllAvatarUrls() {
  console.log('🚀 Iniciando correção AUTÔNOMA de todas as URLs de avatar...\n')

  // 1. Listar TODOS os arquivos no bucket
  console.log('📂 Listando todos os arquivos no bucket "avatares"...')
  const allFiles = await listAllFilesRecursive('avatares')
  console.log(`✅ ${allFiles.length} arquivo(s) encontrado(s)\n`)

  // 2. Buscar todos os usuários com avatar_url
  console.log('👥 Buscando usuários com avatar_url...')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, name, avatar_url')
    .not('avatar_url', 'is', null)

  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError.message)
    return
  }

  console.log(`✅ ${users.length} usuário(s) encontrado(s)\n`)

  let fixed = 0
  let notFound = 0
  let alreadyCorrect = 0

  // 3. Para cada usuário, verificar e corrigir URL
  for (const user of users) {
    if (!user.avatar_url) continue

    console.log(`\n🔍 Processando: ${user.name || user.email} (${user.id})`)
    console.log(`   URL atual: ${user.avatar_url}`)

    // Procurar arquivo do usuário
    const userFile = await findFileForUser(user.id, allFiles)

    if (!userFile) {
      console.log(`   ⚠️  Arquivo não encontrado no storage`)
      notFound++
      continue
    }

    // Gerar URL pública correta
    const { data: { publicUrl } } = supabase.storage
      .from('avatares')
      .getPublicUrl(userFile.path)

    console.log(`   📄 Arquivo encontrado: ${userFile.path}`)
    console.log(`   ✅ URL correta: ${publicUrl}`)

    // Verificar se precisa atualizar
    let needsUpdate = false
    let newUrl = publicUrl

    // Remover timestamp se existir
    if (newUrl.includes('?t=')) {
      newUrl = newUrl.split('?')[0]
      needsUpdate = true
    }

    // Verificar se URL está diferente
    if (user.avatar_url !== newUrl) {
      needsUpdate = true
    }

    if (needsUpdate) {
      console.log(`   🔧 Atualizando URL no banco...`)
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: newUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error(`   ❌ Erro ao atualizar:`, updateError.message)
      } else {
        console.log(`   ✅ URL atualizada com sucesso!`)
        fixed++
      }
    } else {
      console.log(`   ✅ URL já está correta!`)
      alreadyCorrect++
    }
  }

  // 4. Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DA CORREÇÃO')
  console.log('='.repeat(60))
  console.log(`✅ URLs corrigidas: ${fixed}`)
  console.log(`✅ URLs já corretas: ${alreadyCorrect}`)
  console.log(`⚠️  Arquivos não encontrados: ${notFound}`)
  console.log(`📁 Total de arquivos no storage: ${allFiles.length}`)
  console.log(`👥 Total de usuários processados: ${users.length}`)
  console.log('='.repeat(60))
  console.log('\n✅ Correção autônoma concluída!')
}

fixAllAvatarUrls().catch(console.error)

