#!/usr/bin/env node
/**
 * Script para executar migrations usando DATABASE_URL
 * Usa pg para executar SQL diretamente
 */

const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  console.log('⚠️ dotenv não disponível, usando variáveis de ambiente do sistema')
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ Erro: DATABASE_URL não configurado')
  console.error('Configure DATABASE_URL no .env.local')
  process.exit(1)
}

async function executeMigration(migrationFile) {
  console.log(`\n📄 Executando migration: ${path.basename(migrationFile)}`)
  
  try {
    const sql = fs.readFileSync(migrationFile, 'utf8')
    
    // Usar pg para executar SQL
    const { Client } = require('pg')
    const client = new Client({ connectionString: databaseUrl })
    
    try {
      await client.connect()
      console.log('✅ Conectado ao banco de dados')
      
      // Executar SQL (pode conter múltiplos statements)
      await client.query(sql)
      console.log('✅ Migration executada com sucesso')
      
      await client.end()
      return { success: true }
    } catch (pgError) {
      await client.end().catch(() => {})
      throw pgError
    }
  } catch (error) {
    console.error(`  ❌ Erro ao executar migration:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runMigrations() {
  console.log('🚀 Iniciando execução de migrations...')
  console.log(`📦 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`)
  
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
  
  // Executar cada migration
  const results = []
  for (const migrationFile of migrationFiles) {
    const result = await executeMigration(migrationFile)
    results.push({ file: path.basename(migrationFile), ...result })
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DE MIGRATIONS')
  console.log('='.repeat(60))
  
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  results.forEach(result => {
    if (result.success) {
      console.log(`  ✅ ${result.file}`)
    } else {
      console.log(`  ❌ ${result.file}: ${result.error || 'Erro desconhecido'}`)
    }
  })
  
  console.log('\n' + '='.repeat(60))
  console.log(`✅ Sucesso: ${successful}`)
  console.log(`❌ Falhas: ${failed}`)
  console.log('='.repeat(60))
  
  if (failed > 0) {
    console.log('\n⚠️ Algumas migrations falharam!')
    process.exit(1)
  }
  
  console.log('\n🎉 Todas as migrations foram executadas com sucesso!')
  process.exit(0)
}

// Executar
runMigrations().catch(error => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})

