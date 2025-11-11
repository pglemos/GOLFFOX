#!/usr/bin/env node
/**
 * Script para executar migrations do banco de dados
 * Usa o Supabase client para executar SQL
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Carregar variáveis de ambiente
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  console.log('⚠️ dotenv não disponível, usando variáveis de ambiente do sistema')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas')
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function executeMigration(migrationFile) {
  console.log(`\n📄 Executando migration: ${path.basename(migrationFile)}`)
  
  try {
    const sql = fs.readFileSync(migrationFile, 'utf8')
    
    // Executar SQL usando rpc ou query direto
    // Nota: Supabase JS client não suporta execução direta de SQL multi-statement
    // Vamos usar a abordagem de executar via REST API
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    })
    
    if (!response.ok) {
      // Se a função RPC não existir, tentar executar via SQL Editor
      // Para isso, precisamos usar o método alternativo: dividir em statements
      console.log('⚠️ Método RPC não disponível, tentando método alternativo...')
      
      // Dividir SQL em statements individuais
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      let successCount = 0
      let errorCount = 0
      
      for (const statement of statements) {
        try {
          // Para statements que criam tabelas/índices, usar supabase.rpc ou query builder
          // Mas como não temos uma função exec_sql, vamos usar uma abordagem diferente
          // Na prática, para Supabase, é melhor executar migrations via SQL Editor
          console.log(`  ⚠️ Não é possível executar SQL diretamente via JS client`)
          console.log(`  📝 Por favor, execute a migration manualmente no Supabase SQL Editor`)
          console.log(`  📄 Arquivo: ${migrationFile}`)
          return { success: false, error: 'Migration precisa ser executada manualmente' }
        } catch (error) {
          console.error(`  ❌ Erro ao executar statement:`, error.message)
          errorCount++
        }
      }
      
      return { 
        success: errorCount === 0, 
        successCount, 
        errorCount,
        error: errorCount > 0 ? `${errorCount} erros encontrados` : null
      }
    }
    
    const result = await response.json()
    console.log('  ✅ Migration executada com sucesso')
    return { success: true, result }
    
  } catch (error) {
    console.error(`  ❌ Erro ao executar migration:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runMigrations() {
  console.log('🚀 Iniciando execução de migrations...')
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
    console.log('\n⚠️ ATENÇÃO: Algumas migrations falharam!')
    console.log('📝 Para executar migrations manualmente:')
    console.log('   1. Acesse o Supabase Dashboard')
    console.log('   2. Vá para SQL Editor')
    console.log('   3. Copie o conteúdo do arquivo de migration')
    console.log('   4. Execute no SQL Editor')
    console.log('\n📄 Arquivos de migration:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - database/migrations/${r.file}`)
    })
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

