/**
 * Script para listar TODOS os arquivos no bucket avatares, incluindo subpastas
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

async function listAllFiles(path = '', depth = 0) {
  const indent = '  '.repeat(depth)
  const { data: items, error } = await supabase.storage
    .from('avatares')
    .list(path, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    })

  if (error) {
    console.error(`${indent}❌ Erro ao listar ${path}:`, error.message)
    return
  }

  for (const item of items) {
    if (item.id === null) {
      // É uma pasta
      console.log(`${indent}📁 ${item.name}/`)
      await listAllFiles(path ? `${path}/${item.name}` : item.name, depth + 1)
    } else {
      // É um arquivo
      const fullPath = path ? `${path}/${item.name}` : item.name
      const { data: { publicUrl } } = supabase.storage
        .from('avatares')
        .getPublicUrl(fullPath)
      console.log(`${indent}📄 ${item.name}`)
      console.log(`${indent}   Caminho: ${fullPath}`)
      console.log(`${indent}   URL: ${publicUrl}`)
      console.log(`${indent}   Tamanho: ${(item.metadata?.size / 1024).toFixed(2)}KB`)
      console.log('')
    }
  }
}

async function main() {
  console.log('📂 Listando TODOS os arquivos no bucket "avatares"...\n')
  await listAllFiles()
  console.log('✅ Listagem completa!')
}

main().catch(console.error)

