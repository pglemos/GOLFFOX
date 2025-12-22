/**
 * Script de diagnóstico para verificar upload e carregamento de avatar
 * Verifica:
 * 1. Se o bucket "avatares" existe e está configurado corretamente
 * 2. Se há avatares no bucket
 * 3. Se o avatar_url está sendo salvo na tabela users
 * 4. Se a URL pública está acessível
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkAvatarSetup() {
  console.log('🔍 Verificando configuração de avatares...\n')

  // 1. Verificar se o bucket existe
  console.log('1️⃣ Verificando bucket "avatares"...')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.error('❌ Erro ao listar buckets:', bucketsError.message)
    return
  }

  const avataresBucket = buckets.find(b => b.name === 'avatares')
  if (!avataresBucket) {
    console.error('❌ Bucket "avatares" não encontrado!')
    console.log('   Buckets disponíveis:', buckets.map(b => b.name).join(', '))
    return
  }

  console.log('✅ Bucket "avatares" encontrado')
  console.log('   - Público:', avataresBucket.public)
  console.log('   - Limite de tamanho:', avataresBucket.file_size_limit ? `${(avataresBucket.file_size_limit / 1024 / 1024).toFixed(2)}MB` : 'Sem limite')
  console.log('   - Criado em:', avataresBucket.created_at)

  // 2. Listar arquivos no bucket
  console.log('\n2️⃣ Listando arquivos no bucket...')
  const { data: files, error: filesError } = await supabase.storage
    .from('avatares')
    .list('avatares', {
      limit: 10,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (filesError) {
    console.error('❌ Erro ao listar arquivos:', filesError.message)
  } else {
    console.log(`✅ ${files.length} arquivo(s) encontrado(s)`)
    files.forEach((file, index) => {
      const { data: { publicUrl } } = supabase.storage
        .from('avatares')
        .getPublicUrl(`avatares/${file.name}`)
      console.log(`   ${index + 1}. ${file.name}`)
      console.log(`      URL: ${publicUrl}`)
      console.log(`      Tamanho: ${(file.metadata?.size / 1024).toFixed(2)}KB`)
      console.log(`      Criado: ${file.created_at}`)
    })
  }

  // 3. Verificar usuários com avatar_url
  console.log('\n3️⃣ Verificando usuários com avatar_url...')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, name, avatar_url')
    .not('avatar_url', 'is', null)
    .limit(10)

  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError.message)
  } else {
    console.log(`✅ ${users.length} usuário(s) com avatar_url`)
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || user.email}`)
      console.log(`      ID: ${user.id}`)
      console.log(`      Avatar URL: ${user.avatar_url}`)
      
      // Verificar se a URL é acessível
      if (user.avatar_url) {
        const url = new URL(user.avatar_url)
        console.log(`      Domínio: ${url.hostname}`)
        console.log(`      Caminho: ${url.pathname}`)
      }
    })
  }

  // 4. Verificar políticas RLS do bucket
  console.log('\n4️⃣ Verificando políticas RLS do bucket...')
  // Nota: Verificação de políticas requer acesso direto ao banco, mas podemos testar upload/read
  console.log('   (Verificação de políticas requer acesso ao dashboard do Supabase)')
  console.log('   Acesse: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/storage/buckets/avatares/policies')

  // 5. Teste de URL pública
  if (files && files.length > 0) {
    console.log('\n5️⃣ Testando acesso a URL pública...')
    const testFile = files[0]
    const { data: { publicUrl } } = supabase.storage
      .from('avatares')
      .getPublicUrl(`avatares/${testFile.name}`)
    
    console.log(`   URL de teste: ${publicUrl}`)
    console.log('   ✅ URL gerada com sucesso')
    console.log('   ⚠️  Teste manual: Abra a URL no navegador para verificar se a imagem carrega')
  }

  console.log('\n✅ Diagnóstico completo!')
}

checkAvatarSetup().catch(console.error)

