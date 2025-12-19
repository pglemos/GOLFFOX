/**
 * Script para Verificar Status das Migrations
 * 
 * Verifica quais migrations foram aplicadas e quais estão pendentes
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

/**
 * Listar migrations
 */
function getMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()
  
  return files.map(file => ({
    name: file,
    path: path.join(MIGRATIONS_DIR, file),
    size: fs.statSync(path.join(MIGRATIONS_DIR, file)).size
  }))
}

/**
 * Verificar tabelas no banco
 */
async function checkTables() {
  const { data, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    })
  
  if (error) {
    // Tentar método alternativo
    const { data: altData, error: altError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
    
    if (altError) {
      console.warn('⚠️  Não foi possível verificar tabelas:', altError.message)
      return []
    }
    
    return altData?.map(t => t.table_name) || []
  }
  
  return data || []
}

/**
 * Verificar migrations aplicadas
 */
async function getAppliedMigrations() {
  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version, applied_at')
      .order('applied_at')
    
    if (error) {
      return []
    }
    
    return data || []
  } catch (error) {
    return []
  }
}

/**
 * Verificar tabelas específicas mencionadas nas migrations
 */
async function checkSpecificTables() {
  const importantTables = [
    'gf_event_store',
    'gf_web_vitals',
    'gf_operational_alerts',
    'gf_audit_log',
    'driver_positions',
    'gf_vehicle_checklists',
    'passenger_checkins',
    'vehicle_checklists',
    'driver_locations',
    'driver_messages',
    'gf_costs',
    'gf_budgets',
    'users',
    'companies',
    'vehicles',
    'routes',
    'trips'
  ]
  
  const tables = await checkTables()
  const found = []
  const missing = []
  
  for (const table of importantTables) {
    if (tables.includes(table)) {
      found.push(table)
    } else {
      missing.push(table)
    }
  }
  
  return { found, missing, all: tables }
}

/**
 * Gerar relatório
 */
async function generateReport() {
  console.log('🔍 Verificando status das migrations...\n')
  
  const migrations = getMigrations()
  const applied = await getAppliedMigrations()
  const appliedNames = new Set(applied.map(m => m.version))
  const { found, missing, all } = await checkSpecificTables()
  
  console.log('='.repeat(70))
  console.log('📋 STATUS DAS MIGRATIONS')
  console.log('='.repeat(70) + '\n')
  
  console.log(`📄 Migrations encontradas: ${migrations.length}\n`)
  
  migrations.forEach((m, i) => {
    const status = appliedNames.has(m.name) ? '✅' : '⏳'
    const size = (m.size / 1024).toFixed(2)
    console.log(`   ${status} ${i + 1}. ${m.name} (${size} KB)`)
  })
  
  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMO')
  console.log('='.repeat(70) + '\n')
  
  const appliedCount = migrations.filter(m => appliedNames.has(m.name)).length
  const pendingCount = migrations.length - appliedCount
  
  console.log(`✅ Aplicadas: ${appliedCount}`)
  console.log(`⏳ Pendentes: ${pendingCount}`)
  console.log(`📄 Total: ${migrations.length}\n`)
  
  console.log('='.repeat(70))
  console.log('🗄️  TABELAS IMPORTANTES')
  console.log('='.repeat(70) + '\n')
  
  console.log(`✅ Encontradas: ${found.length}`)
  found.forEach(table => {
    console.log(`   ✅ ${table}`)
  })
  
  if (missing.length > 0) {
    console.log(`\n❌ Faltando: ${missing.length}`)
    missing.forEach(table => {
      console.log(`   ❌ ${table}`)
    })
  }
  
  console.log(`\n📊 Total de tabelas no banco: ${all.length}\n`)
  
  if (pendingCount > 0) {
    console.log('💡 Para aplicar migrations pendentes, execute:')
    console.log('   node scripts/apply-migrations.js\n')
  }
  
  console.log('='.repeat(70) + '\n')
}

// Executar
if (require.main === module) {
  generateReport()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Erro:', error)
      process.exit(1)
    })
}

module.exports = { generateReport, checkSpecificTables, getAppliedMigrations }
