#!/usr/bin/env node
/**
 * Script para executar migrations usando Supabase client
 * Executa SQL via Supabase REST API
 */

const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  console.log('⚠️ dotenv não disponível, usando variáveis de ambiente do sistema')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
const databaseUrl = process.env.DATABASE_URL

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas')
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

async function executeMigrationViaSupabase(migrationFile) {
  console.log(`\n📄 Executando migration: ${path.basename(migrationFile)}`)
  
  try {
    const sql = fs.readFileSync(migrationFile, 'utf8')
    
    // Dividir SQL em statements (separados por ;)
    // Remover comentários e linhas vazias
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Filtrar comentários e linhas vazias
        const trimmed = s.trim()
        return trimmed.length > 0 && 
               !trimmed.startsWith('--') && 
               !trimmed.startsWith('/*') &&
               trimmed !== ''
      })
      .map(s => s + ';') // Adicionar ; de volta
    
    console.log(`  📝 Encontrados ${statements.length} statements para executar`)
    
    // Usar Supabase REST API para executar SQL
    // Nota: Supabase não tem endpoint direto para executar SQL arbitrário via REST
    // Precisamos usar o SQL Editor ou uma função RPC
    
    // Alternativa: usar fetch para executar via Supabase Management API
    // Mas isso requer autenticação especial
    
    // Melhor alternativa: instruir usuário a executar manualmente
    console.log('  ⚠️  Supabase não permite execução de SQL arbitrário via REST API')
    console.log('  📝 Por favor, execute a migration manualmente:')
    console.log(`     1. Acesse: ${supabaseUrl.replace('/rest/v1', '')}/project/_/sql`)
    console.log(`     2. Cole o conteúdo do arquivo: ${migrationFile}`)
    console.log(`     3. Execute no SQL Editor`)
    
    return { 
      success: false, 
      error: 'Execução manual necessária',
      manual: true,
      file: migrationFile
    }
  } catch (error) {
    console.error(`  ❌ Erro ao processar migration:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runMigrations() {
  console.log('🚀 Preparando execução de migrations...')
  console.log(`📦 Supabase URL: ${supabaseUrl}`)
  
  const migrationsDir = path.join(__dirname, '..', 'database', 'migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Diretório de migrations não encontrado: ${migrationsDir}`)
    process.exit(1)
  }
  
  // Listar arquivos de migration em ordem
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => path.join(migrationsDir, file))
  
  if (migrationFiles.length === 0) {
    console.log('⚠️ Nenhuma migration encontrada')
    process.exit(0)
  }
  
  console.log(`\n📋 Encontradas ${migrationFiles.length} migration(s):`)
  migrationFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${path.basename(file)}`)
  })
  
  // Tentar executar cada migration
  const results = []
  for (const migrationFile of migrationFiles) {
    const result = await executeMigrationViaSupabase(migrationFile)
    results.push({ file: path.basename(migrationFile), ...result })
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DE MIGRATIONS')
  console.log('='.repeat(60))
  
  const manual = results.filter(r => r.manual).length
  const failed = results.filter(r => !r.success && !r.manual).length
  
  if (manual > 0) {
    console.log('\n⚠️  ATENÇÃO: Execução manual necessária')
    console.log('\n📝 Para executar as migrations:')
    console.log('   1. Acesse o Supabase Dashboard')
    console.log('   2. Vá para SQL Editor')
    console.log('   3. Execute o conteúdo de cada arquivo de migration')
    console.log('\n📄 Arquivos de migration:')
    results.filter(r => r.manual).forEach(r => {
      console.log(`   - database/migrations/${r.file}`)
    })
    
    // Mostrar conteúdo da primeira migration como exemplo
    if (results.length > 0 && results[0].manual) {
      console.log('\n📋 Conteúdo da primeira migration (001_initial_schema.sql):')
      console.log('─'.repeat(60))
      try {
        const content = fs.readFileSync(
          path.join(migrationsDir, results[0].file), 
          'utf8'
        )
        // Mostrar primeiras 20 linhas
        const lines = content.split('\n').slice(0, 20)
        console.log(lines.join('\n'))
        console.log('   ... (arquivo completo em database/migrations/001_initial_schema.sql)')
      } catch (e) {
        console.log('   (erro ao ler arquivo)')
      }
      console.log('─'.repeat(60))
    }
  }
  
  if (failed > 0) {
    console.log(`\n❌ Falhas: ${failed}`)
    process.exit(1)
  }
  
  console.log('\n✅ Migrations processadas (execução manual necessária)')
  console.log('\n💡 Dica: Após executar as migrations manualmente, execute:')
  console.log('   node scripts/setup-test-environment.js')
  process.exit(0)
}

// Executar
runMigrations().catch(error => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})

