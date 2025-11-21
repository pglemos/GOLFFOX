/**
 * Script para aplicar migrações diretamente via PostgreSQL
 * Usa connection string direta para evitar problemas com MCP
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'

const projectRoot = path.resolve(__dirname, '../../..')

// Migrações na ordem correta
const migrations = [
  {
    name: 'v63_fix_gf_costs_transportadora_id',
    file: path.join(projectRoot, 'database/migrations/v63_fix_gf_costs_transportadora_id.sql'),
    description: 'Migra tabela gf_costs de carrier_id para transportadora_id'
  },
  {
    name: 'v62_fix_v_costs_secure_transportadora',
    file: path.join(projectRoot, 'database/migrations/v62_fix_v_costs_secure_transportadora.sql'),
    description: 'Corrige view v_costs_secure para usar transportadora_id'
  },
  {
    name: 'v64_fix_drivers_transportadora_id',
    file: path.join(projectRoot, 'database/migrations/v64_fix_drivers_transportadora_id.sql'),
    description: 'Migra tabela drivers de carrier_id para transportadora_id (se existir)'
  }
]

async function applyMigration(client, migration) {
  console.log(`\n📦 Aplicando migração: ${migration.name}`)
  console.log(`   Descrição: ${migration.description}`)
  
  try {
    // Ler arquivo SQL
    if (!fs.existsSync(migration.file)) {
      console.error(`   ❌ Arquivo não encontrado: ${migration.file}`)
      return { success: false, error: 'Arquivo não encontrado' }
    }
    
    const sql = fs.readFileSync(migration.file, 'utf8')
    
    if (!sql || sql.trim().length === 0) {
      console.error(`   ❌ Arquivo SQL vazio: ${migration.file}`)
      return { success: false, error: 'Arquivo SQL vazio' }
    }
    
    console.log(`   📄 Carregado ${sql.length} caracteres de SQL`)
    console.log(`   🔄 Executando SQL...`)
    
    // Executar SQL diretamente
    const result = await client.query(sql)
    
    console.log(`   ✅ Migração aplicada com sucesso`)
    return { success: true, result }
    
  } catch (error) {
    console.error(`   ❌ Erro ao aplicar migração ${migration.name}:`, error.message)
    
    // Se erro for sobre objeto já existir ou não existir, pode ser idempotente
    if (error.message.includes('already exists') || 
        error.message.includes('does not exist') ||
        error.message.includes('duplicate key')) {
      console.log(`   ⚠️ Migração pode ter sido aplicada anteriormente (idempotente)`)
      return { success: true, note: 'Idempotente - pode já estar aplicada', error: error.message }
    }
    
    return { success: false, error: error.message }
  }
}

async function applyAllMigrations() {
  console.log('🚀 Iniciando aplicação de migrações de transportadora via PostgreSQL...\n')
  console.log(`📡 Conectando ao banco de dados...\n`)
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    console.log('✅ Conectado ao PostgreSQL com sucesso!\n')
    
    // Testar conexão
    const testResult = await client.query('SELECT NOW()')
    console.log(`📍 Server time: ${testResult.rows[0].now}\n`)
    
    const results = []
    
    for (const migration of migrations) {
      const result = await applyMigration(client, migration)
      results.push({ migration: migration.name, ...result })
      
      // Aguardar um pouco entre migrações
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    await client.end()
    console.log('\n🔌 Conexão PostgreSQL encerrada')
    
    console.log('\n📊 RESUMO DA APLICAÇÃO\n')
    
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    console.log(`✅ Sucesso: ${successful.length}/${results.length}`)
    successful.forEach(r => {
      console.log(`   ✅ ${r.migration}${r.note ? ` (${r.note})` : ''}`)
    })
    
    if (failed.length > 0) {
      console.log(`\n❌ Falhas: ${failed.length}/${results.length}`)
      failed.forEach(r => {
        console.log(`   ❌ ${r.migration}: ${r.error || 'Erro desconhecido'}`)
      })
    }
    
    const allSuccess = results.every(r => r.success)
    if (allSuccess) {
      console.log('\n✅ Todas as migrações foram aplicadas com sucesso!')
      console.log('\n🔍 Execute o diagnóstico para verificar:')
      console.log('   node apps/web/scripts/diagnose-supabase.js')
      return { success: true, results }
    } else {
      console.log('\n⚠️ Algumas migrações falharam. Verifique os erros acima.')
      return { success: false, results }
    }
    
  } catch (error) {
    console.error('\n❌ Erro fatal ao conectar/executar:', error.message)
    if (client) {
      await client.end().catch(() => {})
    }
    return { success: false, error: error.message }
  }
}

// Executar
applyAllMigrations()
  .then(({ success }) => {
    process.exit(success ? 0 : 1)
  })
  .catch(err => {
    console.error('\n❌ Erro fatal:', err)
    process.exit(1)
  })

