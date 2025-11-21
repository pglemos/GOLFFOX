/**
 * Script para verificar e aplicar migrações de transportadora
 * Verifica status atual e aplica via Supabase RPC ou fornece instruções manuais
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// Caminho correto: database está na raiz, não em apps/web
const projectRoot = path.resolve(__dirname, '../../..')

// Mapeamento de migrações (ordem de aplicação)
const migrations = [
  {
    name: 'v63_fix_gf_costs_transportadora_id',
    file: path.join(projectRoot, 'database/migrations/v63_fix_gf_costs_transportadora_id.sql'),
    description: 'Migra tabela gf_costs de carrier_id para transportadora_id',
    checkQuery: `SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gf_costs' 
      AND column_name = 'transportadora_id'`
  },
  {
    name: 'v62_fix_v_costs_secure_transportadora',
    file: path.join(projectRoot, 'database/migrations/v62_fix_v_costs_secure_transportadora.sql'),
    description: 'Corrige view v_costs_secure para usar transportadora_id',
    checkQuery: `SELECT table_name FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'v_costs_secure'`
  },
  {
    name: 'v64_fix_drivers_transportadora_id',
    file: path.join(projectRoot, 'database/migrations/v64_fix_drivers_transportadora_id.sql'),
    description: 'Migra tabela drivers de carrier_id para transportadora_id (se existir)',
    checkQuery: `SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'drivers'`
  }
]

async function checkMigrationStatus(migration) {
  try {
    if (migration.checkQuery) {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: migration.checkQuery 
      }).catch(() => ({ data: null, error: { code: '42883' } }))
      
      if (error && error.code === '42883') {
        // Função exec_sql não existe, usar query direta se possível
        // Para isso, precisaríamos de uma função específica ou acesso direto
        return { applied: null, error: 'Cannot check - exec_sql not available' }
      }
      
      if (error) {
        return { applied: false, error: error.message }
      }
      
      // Verificar se retornou dados
      const isApplied = data && Array.isArray(data) && data.length > 0
      return { applied: isApplied, error: null }
    }
    
    return { applied: null, error: 'No check query defined' }
  } catch (err) {
    return { applied: null, error: err.message }
  }
}

async function verifyAndApplyMigrations() {
  console.log('🔍 Verificando status das migrações de transportadora...\n')
  console.log(`📡 Conectando ao Supabase: ${SUPABASE_URL.replace(/\/\/.*@/, '//***@')}\n`)
  
  const results = []
  const sqlFiles = []
  
  for (const migration of migrations) {
    console.log(`\n📋 Verificando: ${migration.name}`)
    console.log(`   ${migration.description}`)
    
    // Verificar se arquivo existe
    if (!fs.existsSync(migration.file)) {
      console.error(`   ❌ Arquivo não encontrado: ${migration.file}`)
      results.push({ 
        migration: migration.name, 
        status: 'error', 
        error: 'Arquivo não encontrado' 
      })
      continue
    }
    
    const sql = fs.readFileSync(migration.file, 'utf8')
    sqlFiles.push({ migration: migration.name, sql, file: migration.file })
    
    // Tentar verificar status (pode falhar se exec_sql não existir)
    const status = await checkMigrationStatus(migration)
    
    if (status.error && status.error.includes('exec_sql not available')) {
      console.log(`   ⚠️  Não é possível verificar automaticamente (exec_sql não disponível)`)
      results.push({ 
        migration: migration.name, 
        status: 'unknown', 
        requiresManual: true,
        sql 
      })
    } else if (status.applied) {
      console.log(`   ✅ Migração já aplicada`)
      results.push({ 
        migration: migration.name, 
        status: 'applied' 
      })
    } else {
      console.log(`   ⚠️  Migração não aplicada ou status desconhecido`)
      results.push({ 
        migration: migration.name, 
        status: 'pending', 
        requiresManual: true,
        sql 
      })
    }
  }
  
  console.log('\n📊 RESUMO DO STATUS\n')
  
  const applied = results.filter(r => r.status === 'applied')
  const pending = results.filter(r => r.status === 'pending')
  const unknown = results.filter(r => r.status === 'unknown')
  const errors = results.filter(r => r.status === 'error')
  
  if (applied.length > 0) {
    console.log(`✅ Já aplicadas: ${applied.length}/${results.length}`)
    applied.forEach(r => console.log(`   ✅ ${r.migration}`))
  }
  
  if (pending.length > 0 || unknown.length > 0) {
    console.log(`\n📝 Migrações pendentes ou desconhecidas: ${pending.length + unknown.length}/${results.length}`)
    pending.forEach(r => console.log(`   📝 ${r.migration} - Pendente`))
    unknown.forEach(r => console.log(`   ❓ ${r.migration} - Status desconhecido`))
    
    console.log('\n📋 INSTRUÇÕES PARA APLICAÇÃO MANUAL:')
    console.log('   1. Acesse: https://supabase.com/dashboard')
    console.log('   2. Selecione seu projeto')
    console.log('   3. Navegue até: SQL Editor')
    console.log('   4. Execute cada arquivo SQL na ordem abaixo:')
    console.log('')
    
    let fileIndex = 1
    for (const result of [...pending, ...unknown]) {
      if (result.requiresManual) {
        const migration = migrations.find(m => m.name === result.migration)
        if (migration) {
          console.log(`   ${fileIndex}. ${migration.name}`)
          console.log(`      Arquivo: database/migrations/${path.basename(migration.file)}`)
          console.log(`      Descrição: ${migration.description}`)
          console.log('')
          fileIndex++
        }
      }
    }
    
    console.log('   💡 Dica: Copie e cole o conteúdo de cada arquivo SQL acima no SQL Editor')
    console.log('   💡 Ordem importante: v63 → v62 → v64')
  }
  
  if (errors.length > 0) {
    console.log(`\n❌ Erros: ${errors.length}/${results.length}`)
    errors.forEach(r => console.log(`   ❌ ${r.migration}: ${r.error}`))
  }
  
  // Se todas já foram aplicadas
  if (applied.length === results.length && errors.length === 0) {
    console.log('\n✅ Todas as migrações já foram aplicadas!')
    console.log('\n🔍 Execute o diagnóstico para verificar:')
    console.log('   node apps/web/scripts/diagnose-supabase.js')
  } else if (pending.length === 0 && unknown.length > 0) {
    console.log('\n⚠️  Não foi possível verificar o status de algumas migrações.')
    console.log('   Verifique manualmente e aplique se necessário.')
  }
  
  return results
}

// Executar
verifyAndApplyMigrations()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Erro fatal:', err)
    process.exit(1)
  })

