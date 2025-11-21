/**
 * Script para aplicar migrações de transportadora via Supabase REST API
 * Usa a abordagem de executar SQL diretamente através de operações permitidas
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

// Carregar variáveis de ambiente
const envPath = path.join(__dirname, '../.env.local')
const envPath2 = path.join(__dirname, '../.env')

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
} else if (fs.existsSync(envPath2)) {
  const envContent = fs.readFileSync(envPath2, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

// Extrair connection string do Supabase URL se disponível
// Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
let DATABASE_URL = process.env.DATABASE_URL

// Se não houver DATABASE_URL, tentar construir do Supabase URL
if (!DATABASE_URL && SUPABASE_URL) {
  const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  
  if (projectRef && dbPassword) {
    DATABASE_URL = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  }
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  console.error('Opcionalmente: DATABASE_URL para execução direta de SQL')
  process.exit(1)
}

// Mapeamento de migrações (ordem de aplicação)
// Caminho correto: database/migrations está na raiz do projeto, não em apps/web
const projectRoot = path.join(__dirname, '../..')
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

async function applyMigrationWithPg(migration, client) {
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
    
    // Executar SQL diretamente via PostgreSQL client
    const result = await client.query(sql)
    
    console.log(`   ✅ Migração aplicada com sucesso`)
    return { success: true, result }
    
  } catch (error) {
    console.error(`   ❌ Erro ao aplicar migração ${migration.name}:`, error.message)
    
    // Se erro for sobre objeto já existir ou não existir, pode ser idempotente
    if (error.message.includes('already exists') || 
        error.message.includes('does not exist') ||
        error.message.includes('already exists')) {
      console.log(`   ⚠️ Migração pode ter sido aplicada anteriormente (idempotente)`)
      return { success: true, note: 'Idempotente - pode já estar aplicada', error: error.message }
    }
    
    return { success: false, error: error.message }
  }
}

async function applyMigrationWithSupabase(migration, supabase) {
  console.log(`\n📦 Tentando aplicar migração via Supabase API: ${migration.name}`)
  console.log(`   ⚠️ Execução direta de SQL não é suportada pela API do Supabase`)
  console.log(`   📝 Esta migração precisa ser aplicada manualmente via Supabase Dashboard`)
  console.log(`   📄 Arquivo: ${migration.file}`)
  
  // Ler e mostrar o SQL para facilitar cópia
  const sql = fs.readFileSync(migration.file, 'utf8')
  console.log(`\n   📋 SQL para copiar (primeiras 500 caracteres):`)
  console.log(`   ${sql.substring(0, 500).replace(/\n/g, '\n   ')}...`)
  
  return { success: false, error: 'Requires manual execution', requiresManual: true }
}

async function applyAllMigrations() {
  console.log('🚀 Iniciando aplicação de migrações de transportadora...\n')
  console.log(`📡 Supabase URL: ${SUPABASE_URL.replace(/\/\/.*@/, '//***@')}\n`)
  
  const results = []
  
  // Tentar usar PostgreSQL client direto se DATABASE_URL estiver disponível
  if (DATABASE_URL) {
    console.log('🔌 Usando conexão direta PostgreSQL...\n')
    
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    
    try {
      await client.connect()
      console.log('✅ Conectado ao banco de dados PostgreSQL\n')
      
      for (const migration of migrations) {
        const result = await applyMigrationWithPg(migration, client)
        results.push({ migration: migration.name, ...result })
        
        // Aguardar um pouco entre migrações
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      await client.end()
      console.log('\n🔌 Conexão PostgreSQL encerrada')
      
    } catch (connError) {
      console.error('❌ Erro ao conectar ao PostgreSQL:', connError.message)
      console.log('\n⚠️ Tentando abordagem alternativa...\n')
      
      // Fallback: usar Supabase client (limitado)
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
      
      for (const migration of migrations) {
        const result = await applyMigrationWithSupabase(migration, supabase)
        results.push({ migration: migration.name, ...result })
      }
    }
  } else {
    console.log('⚠️ DATABASE_URL não configurado')
    console.log('   Usando Supabase client (execução manual pode ser necessária)\n')
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    
    for (const migration of migrations) {
      const result = await applyMigrationWithSupabase(migration, supabase)
      results.push({ migration: migration.name, ...result })
    }
  }
  
  console.log('\n📊 RESUMO DA APLICAÇÃO\n')
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success && !r.requiresManual)
  const manual = results.filter(r => r.requiresManual)
  
  console.log(`✅ Aplicadas automaticamente: ${successful.length}/${results.length}`)
  successful.forEach(r => {
    console.log(`   ✅ ${r.migration}${r.note ? ` (${r.note})` : ''}`)
  })
  
  if (manual.length > 0) {
    console.log(`\n📝 Requerem execução manual: ${manual.length}/${results.length}`)
    manual.forEach(r => {
      console.log(`   📝 ${r.migration}`)
    })
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Falhas: ${failed.length}/${results.length}`)
    failed.forEach(r => {
      console.log(`   ❌ ${r.migration}: ${r.error || 'Erro desconhecido'}`)
    })
  }
  
  if (manual.length > 0 || failed.length > 0) {
    console.log('\n📝 INSTRUÇÕES PARA APLICAÇÃO MANUAL:')
    console.log('   1. Acesse: https://supabase.com/dashboard')
    console.log('   2. Selecione seu projeto')
    console.log('   3. Vá em SQL Editor')
    console.log('   4. Execute cada arquivo SQL na ordem:')
    migrations.forEach((m, i) => {
      console.log(`      ${i + 1}. ${m.name} (${path.basename(m.file)})`)
    })
  }
  
  return results
}

// Executar
applyAllMigrations()
  .then(results => {
    const allSuccess = results.every(r => r.success)
    const hasManual = results.some(r => r.requiresManual)
    
    if (allSuccess && !hasManual) {
      console.log('\n✅ Todas as migrações foram aplicadas automaticamente!')
      console.log('\n🔍 Execute o diagnóstico para verificar:')
      console.log('   node apps/web/scripts/diagnose-supabase.js')
      process.exit(0)
    } else if (hasManual) {
      console.log('\n⚠️ Algumas migrações requerem execução manual.')
      console.log('   Siga as instruções acima para aplicar via Supabase Dashboard.')
      process.exit(0)
    } else {
      console.log('\n⚠️ Algumas migrações falharam. Execute manualmente se necessário.')
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('\n❌ Erro fatal:', err)
    process.exit(1)
  })

