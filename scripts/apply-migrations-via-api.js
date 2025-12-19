/**
 * Script para Aplicar Migrations via Supabase REST API
 * 
 * Usa a API REST do Supabase para executar SQL
 * Requer apenas NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */

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
  console.error('\nConfigure em apps/web/.env.local:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=[service-role-key]')
  process.exit(1)
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

const MIGRATIONS_TO_APPLY = [
  '20250115_event_store.sql',
  '20250116_missing_tables.sql'
]

/**
 * Executar SQL via Supabase REST API
 * 
 * NOTA: Supabase não expõe exec_sql diretamente via REST API por segurança.
 * Este script gera instruções detalhadas para aplicação manual.
 */
async function applyMigrationViaAPI(fileName) {
  const filePath = path.join(MIGRATIONS_DIR, fileName)
  
  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ Arquivo não encontrado: ${filePath}`)
    return { status: 'error', reason: 'file_not_found' }
  }

  const sql = fs.readFileSync(filePath, 'utf8')
  
  console.log(`\n📄 Migration: ${fileName}`)
  console.log(`   📏 Tamanho: ${(sql.length / 1024).toFixed(2)} KB`)
  console.log(`   📂 Arquivo: ${filePath}`)
  
  // Tentar executar via RPC (se disponível)
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ sql })
    })

    if (response.ok) {
      console.log(`   ✅ Aplicada via API`)
      return { status: 'applied' }
    } else {
      const error = await response.text()
      console.log(`   ⚠️  API não disponível: ${error.substring(0, 100)}`)
    }
  } catch (error) {
    // API não disponível, continuar com instruções manuais
    console.log(`   ⚠️  Execução via API não disponível`)
  }

  // Gerar instruções para aplicação manual
  console.log(`\n   📋 INSTRUÇÕES PARA APLICAÇÃO MANUAL:`)
  console.log(`   1. Acesse: https://supabase.com/dashboard`)
  console.log(`   2. Selecione projeto: ${SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')}`)
  console.log(`   3. Vá em SQL Editor`)
  console.log(`   4. Cole o conteúdo do arquivo abaixo`)
  console.log(`   5. Execute (Run)`)
  console.log(`\n   📄 Conteúdo (primeiras 500 caracteres):`)
  console.log(`   ${sql.substring(0, 500).replace(/\n/g, ' ')}...`)
  console.log(`\n   💡 Arquivo completo: ${filePath}\n`)

  return { status: 'manual_required', filePath }
}

/**
 * Verificar tabelas via API
 */
async function verifyTablesViaAPI() {
  const tables = [
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log'
  ]

  console.log('\n🔍 Verificando tabelas via API...\n')

  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      })

      if (response.ok || response.status === 200) {
        console.log(`   ✅ ${table} (existe)`)
      } else if (response.status === 404) {
        console.log(`   ❌ ${table} (não encontrada)`)
      } else {
        console.log(`   ⚠️  ${table} (status: ${response.status})`)
      }
    } catch (error) {
      console.log(`   ⚠️  ${table} (erro ao verificar: ${error.message})`)
    }
  }
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Aplicando Migrations via Supabase API\n')
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}\n`)

  const results = []

  for (const migration of MIGRATIONS_TO_APPLY) {
    const result = await applyMigrationViaAPI(migration)
    results.push({ migration, ...result })
  }

  // Verificar tabelas
  await verifyTablesViaAPI()

  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO')
  console.log('='.repeat(60) + '\n')

  const applied = results.filter(r => r.status === 'applied').length
  const manual = results.filter(r => r.status === 'manual_required').length
  const errors = results.filter(r => r.status === 'error').length

  console.log(`✅ Aplicadas via API: ${applied}`)
  console.log(`📋 Requerem aplicação manual: ${manual}`)
  console.log(`❌ Erros: ${errors}`)

  if (manual > 0) {
    console.log('\n💡 Para aplicar manualmente:')
    console.log('   1. Acesse Supabase Dashboard')
    console.log('   2. SQL Editor')
    console.log('   3. Execute cada migration listada acima')
    console.log('\n   Ou use: docs/MIGRATION_INSTRUCTIONS.md')
  }

  if (errors > 0) {
    process.exitCode = 1
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Erro:', error.message)
    process.exit(1)
  })
}

module.exports = { main, applyMigrationViaAPI }
