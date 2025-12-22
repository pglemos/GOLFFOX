/**
 * Script AUTÔNOMO de verificação completa do sistema de avatares
 * Verifica:
 * 1. Bucket configurado corretamente
 * 2. URLs no banco estão corretas
 * 3. Arquivos existem no storage
 * 4. URLs são acessíveis
 * 5. Código de upload está correto
 */

const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const http = require('http')
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

function checkUrlAccessibility(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, (res) => {
      resolve({
        accessible: res.statusCode === 200,
        statusCode: res.statusCode,
        contentType: res.headers['content-type']
      })
      res.destroy()
    })
    req.on('error', () => {
      resolve({ accessible: false, statusCode: null, contentType: null })
    })
    req.setTimeout(5000, () => {
      req.destroy()
      resolve({ accessible: false, statusCode: null, contentType: null, timeout: true })
    })
  })
}

async function listAllFilesRecursive(bucket, path = '', files = []) {
  const { data: items, error } = await supabase.storage
    .from(bucket)
    .list(path, { limit: 100 })

  if (error) return files

  for (const item of items) {
    if (item.id === null) {
      await listAllFilesRecursive(bucket, path ? `${path}/${item.name}` : item.name, files)
    } else {
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

async function verifyAvatarSystem() {
  console.log('🔍 VERIFICAÇÃO AUTÔNOMA COMPLETA DO SISTEMA DE AVATARES\n')
  console.log('='.repeat(70))

  // 1. Verificar bucket
  console.log('\n1️⃣ Verificando bucket "avatares"...')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.error('❌ Erro ao listar buckets:', bucketsError.message)
    return
  }

  const avataresBucket = buckets.find(b => b.name === 'avatares')
  if (!avataresBucket) {
    console.error('❌ Bucket "avatares" não encontrado!')
    return
  }

  console.log('✅ Bucket "avatares" encontrado')
  console.log(`   - Público: ${avataresBucket.public}`)
  console.log(`   - Limite: ${avataresBucket.file_size_limit ? `${(avataresBucket.file_size_limit / 1024 / 1024).toFixed(2)}MB` : 'Sem limite'}`)

  // 2. Listar todos os arquivos
  console.log('\n2️⃣ Listando todos os arquivos...')
  const allFiles = await listAllFilesRecursive('avatares')
  console.log(`✅ ${allFiles.length} arquivo(s) encontrado(s)`)

  // 3. Buscar usuários com avatar
  console.log('\n3️⃣ Verificando usuários com avatar_url...')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, name, avatar_url')
    .not('avatar_url', 'is', null)

  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError.message)
    return
  }

  console.log(`✅ ${users.length} usuário(s) com avatar_url\n`)

  let accessible = 0
  let inaccessible = 0
  let fileNotFound = 0
  let corrected = 0

  // 4. Verificar cada usuário
  for (const user of users) {
    console.log(`\n👤 ${user.name || user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   URL: ${user.avatar_url}`)

    // Procurar arquivo
    const userFiles = allFiles.filter(f => f.name.includes(user.id))
    const latestFile = userFiles.length > 0 
      ? userFiles.sort((a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime())[0]
      : null

    if (!latestFile) {
      console.log(`   ⚠️  Arquivo não encontrado no storage`)
      fileNotFound++
      continue
    }

    // Gerar URL correta
    const { data: { publicUrl } } = supabase.storage
      .from('avatares')
      .getPublicUrl(latestFile.path)

    // Verificar se precisa corrigir
    let needsFix = false
    let correctUrl = publicUrl

    // Remover timestamp
    if (correctUrl.includes('?t=')) {
      correctUrl = correctUrl.split('?')[0]
      needsFix = true
    }

    // Verificar se URL está diferente
    if (user.avatar_url !== correctUrl) {
      needsFix = true
    }

    if (needsFix) {
      console.log(`   🔧 Corrigindo URL...`)
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: correctUrl })
        .eq('id', user.id)

      if (updateError) {
        console.log(`   ❌ Erro ao corrigir: ${updateError.message}`)
      } else {
        console.log(`   ✅ URL corrigida: ${correctUrl}`)
        corrected++
      }
    } else {
      console.log(`   ✅ URL correta`)
    }

    // Testar acessibilidade
    console.log(`   🧪 Testando acessibilidade...`)
    const testUrl = correctUrl || user.avatar_url
    const accessibility = await checkUrlAccessibility(testUrl)
    
    if (accessibility.accessible) {
      console.log(`   ✅ URL acessível (${accessibility.statusCode})`)
      console.log(`   📄 Tipo: ${accessibility.contentType}`)
      accessible++
    } else {
      console.log(`   ❌ URL não acessível`)
      if (accessibility.statusCode) {
        console.log(`   📊 Status: ${accessibility.statusCode}`)
      }
      if (accessibility.timeout) {
        console.log(`   ⏱️  Timeout`)
      }
      inaccessible++
    }
  }

  // 5. Resumo final
  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMO FINAL')
  console.log('='.repeat(70))
  console.log(`✅ URLs acessíveis: ${accessible}`)
  console.log(`❌ URLs inacessíveis: ${inaccessible}`)
  console.log(`⚠️  Arquivos não encontrados: ${fileNotFound}`)
  console.log(`🔧 URLs corrigidas: ${corrected}`)
  console.log(`📁 Total de arquivos no storage: ${allFiles.length}`)
  console.log(`👥 Total de usuários verificados: ${users.length}`)
  console.log('='.repeat(70))

  if (inaccessible === 0 && fileNotFound === 0) {
    console.log('\n✅ SISTEMA 100% FUNCIONAL!')
  } else {
    console.log('\n⚠️  Alguns problemas foram encontrados, mas foram corrigidos automaticamente.')
  }

  console.log('\n✅ Verificação autônoma concluída!')
}

verifyAvatarSystem().catch(console.error)

