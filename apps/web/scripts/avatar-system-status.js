/**
 * Script de status do sistema de avatares
 * Executa verificação completa e retorna status
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

async function getStatus() {
  console.log('📊 STATUS DO SISTEMA DE AVATARES\n')

  // Bucket
  const { data: buckets } = await supabase.storage.listBuckets()
  const avataresBucket = buckets?.find(b => b.name === 'avatares')
  console.log(`✅ Bucket "avatares": ${avataresBucket ? 'EXISTE' : 'NÃO EXISTE'}`)
  if (avataresBucket) {
    console.log(`   - Público: ${avataresBucket.public}`)
    console.log(`   - Limite: ${avataresBucket.file_size_limit ? `${(avataresBucket.file_size_limit / 1024 / 1024).toFixed(2)}MB` : 'Sem limite'}`)
  }

  // Arquivos
  const { data: files } = await supabase.storage.from('avatares').list('', { limit: 100 })
  console.log(`\n📁 Arquivos no storage: ${files?.length || 0}`)

  // Usuários
  const { data: users } = await supabase
    .from('users')
    .select('id, email, name, avatar_url')
    .not('avatar_url', 'is', null)
  
  console.log(`\n👥 Usuários com avatar: ${users?.length || 0}`)
  
  if (users && users.length > 0) {
    console.log('\n📋 Detalhes:')
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || user.email}`)
      console.log(`      URL: ${user.avatar_url}`)
    })
  }

  console.log('\n✅ Sistema operacional!')
}

getStatus().catch(console.error)

