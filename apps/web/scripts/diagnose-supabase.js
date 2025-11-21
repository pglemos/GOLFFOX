/**
 * Script de Diagnóstico do Supabase
 * Analisa problemas comuns no banco de dados
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente do .env.local ou .env
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

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  console.error(`Procurou em: ${envPath} e ${envPath2}`)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// Log path
const LOG_PATH = path.join(__dirname, '../..', '.cursor', 'debug.log')
const SERVER_ENDPOINT = 'http://127.0.0.1:7242/ingest/802544c4-70d0-43c7-a57c-6692b28ca17d'

// Helper para log
function log(hypothesisId, message, data = {}) {
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    location: 'diagnose-supabase.js',
    message,
    data,
    sessionId: 'supabase-diagnosis',
    runId: 'diagnosis',
    hypothesisId
  }
  
  // Enviar para endpoint (usar node-fetch se disponível, senão usar fetch global)
  if (typeof fetch !== 'undefined') {
    fetch(SERVER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(() => {})
  }
  
  // Também escrever no arquivo
  try {
    fs.appendFileSync(LOG_PATH, JSON.stringify(logEntry) + '\n')
  } catch (err) {
    // Ignorar erro de escrita
  }
  
  console.log(`[${hypothesisId}] ${message}`, data)
}

async function diagnoseSupabase() {
  console.log('🔍 Iniciando diagnóstico do Supabase...\n')
  
  const issues = []
  
  // HIPÓTESE A: Tabelas críticas não existem
  log('A', 'Verificando existência de tabelas críticas')
  const criticalTables = ['users', 'companies', 'vehicles', 'routes', 'trips', 'carriers']
  for (const table of criticalTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.code === '42P01') {
          issues.push({ hypothesis: 'A', severity: 'critical', table, error: 'Tabela não existe' })
          log('A', `❌ Tabela ${table} não existe`, { error: error.message })
        } else {
          issues.push({ hypothesis: 'A', severity: 'warning', table, error: error.message })
          log('A', `⚠️ Erro ao acessar tabela ${table}`, { error: error.message, code: error.code })
        }
      } else {
        log('A', `✅ Tabela ${table} existe e é acessível`)
      }
    } catch (err) {
      issues.push({ hypothesis: 'A', severity: 'critical', table, error: err.message })
      log('A', `❌ Exceção ao verificar tabela ${table}`, { error: err.message })
    }
  }
  
  // HIPÓTESE B: Colunas críticas faltando ou renomeadas
  log('B', 'Verificando colunas críticas')
  try {
    // Verificar colunas críticas uma por uma
    const requiredColumns = ['id', 'email', 'role', 'company_id', 'transportadora_id']
    const missingColumns = []
    
    for (const col of requiredColumns) {
      try {
        const { error } = await supabase
          .from('users')
          .select(col)
          .limit(1)
        
        if (error && error.code === '42703') {
          missingColumns.push(col)
          log('B', `❌ Coluna ${col} não existe na tabela users`, { error: error.message })
        } else if (error) {
          log('B', `⚠️ Erro ao verificar coluna ${col}`, { error: error.message, code: error.code })
        } else {
          log('B', `✅ Coluna ${col} existe`)
        }
      } catch (err) {
        missingColumns.push(col)
        log('B', `❌ Exceção ao verificar coluna ${col}`, { error: err.message })
      }
    }
    
    // Verificar se carrier_id ainda existe (não deveria)
    try {
      const { error: carrierError } = await supabase
        .from('users')
        .select('carrier_id')
        .limit(1)
      
      if (carrierError && carrierError.code === '42703') {
        log('B', '✅ Coluna carrier_id não existe (migração completa)')
      } else if (!carrierError) {
        issues.push({ hypothesis: 'B', severity: 'warning', column: 'carrier_id', error: 'Coluna antiga ainda existe - migração incompleta' })
        log('B', '⚠️ Coluna carrier_id ainda existe (migração pode estar incompleta)', {})
      }
    } catch (err) {
      // Ignorar erros ao verificar coluna antiga
    }
    
    if (missingColumns.length > 0) {
      issues.push({ hypothesis: 'B', severity: 'critical', table: 'users', missingColumns, error: 'Colunas críticas não existem' })
      log('B', '❌ Colunas críticas faltando', { missingColumns })
    } else {
      log('B', '✅ Todas as colunas críticas existem')
    }
  } catch (err) {
    issues.push({ hypothesis: 'B', severity: 'critical', error: err.message })
    log('B', '❌ Exceção ao verificar colunas', { error: err.message })
  }
  
  // HIPÓTESE C: RLS Policies bloqueando queries
  log('C', 'Verificando políticas RLS')
  try {
    // Tentar fazer query sem service role (simulando usuário normal)
    const supabaseAnon = createClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    )
    
    const { data: rlsTest, error: rlsError } = await supabaseAnon
      .from('users')
      .select('id')
      .limit(1)
    
    if (rlsError && (rlsError.code === '42501' || rlsError.message?.includes('permission'))) {
      log('C', '⚠️ RLS pode estar bloqueando queries anônimas (esperado se RLS estiver ativo)')
    } else if (rlsError) {
      issues.push({ hypothesis: 'C', severity: 'warning', error: rlsError.message })
      log('C', '⚠️ Erro inesperado em teste RLS', { error: rlsError.message, code: rlsError.code })
    } else {
      log('C', '✅ Query anônima funcionou (RLS pode estar permissivo)')
    }
  } catch (err) {
    log('C', '⚠️ Erro ao testar RLS', { error: err.message })
  }
  
  // HIPÓTESE D: Constraints violadas
  log('D', 'Verificando constraints e índices')
  try {
    // Verificar constraint de role
    const { data: roleTest, error: roleError } = await supabase
      .from('users')
      .select('role')
      .limit(10)
    
    if (roleError) {
      issues.push({ hypothesis: 'D', severity: 'warning', error: roleError.message })
      log('D', '⚠️ Erro ao verificar roles', { error: roleError.message })
    } else {
      const invalidRoles = roleTest?.filter(u => !['admin', 'operador', 'transportadora', 'driver', 'passenger'].includes(u.role))
      if (invalidRoles && invalidRoles.length > 0) {
        issues.push({ hypothesis: 'D', severity: 'warning', issue: 'Roles inválidos encontrados', roles: invalidRoles })
        log('D', '⚠️ Roles inválidos encontrados', { invalidRoles })
      } else {
        log('D', '✅ Roles válidos')
      }
    }
  } catch (err) {
    log('D', '⚠️ Erro ao verificar constraints', { error: err.message })
  }
  
  // HIPÓTESE E: Funções RPC não existem ou com problemas
  log('E', 'Verificando funções RPC críticas')
  const criticalFunctions = [
    'get_user_transportadora_id',
    'current_transportadora_id',
    'get_user_carrier_id',
    'current_carrier_id',
    'rpc_transportadora_monthly_score',
    'gf_map_snapshot_full'
  ]
  
  for (const funcName of criticalFunctions) {
    try {
      // Tentar chamar função com parâmetros vazios (vai falhar mas mostra se existe)
      const { error } = await supabase.rpc(funcName, {}).catch(() => ({ error: { code: '42883' } }))
      
      if (error && error.code === '42883') {
        issues.push({ hypothesis: 'E', severity: 'warning', function: funcName, error: 'Função não existe' })
        log('E', `⚠️ Função RPC ${funcName} não existe ou não está acessível`, {})
      } else if (error && error.code === '42804') {
        log('E', `✅ Função ${funcName} existe (erro de tipo esperado)`)
      } else if (error) {
        log('E', `⚠️ Função ${funcName} retornou erro`, { error: error.message, code: error.code })
      } else {
        log('E', `✅ Função ${funcName} existe e é acessível`)
      }
    } catch (err) {
      // Se der erro de sintaxe, a função pode não existir
      if (err.message?.includes('function') && err.message?.includes('does not exist')) {
        issues.push({ hypothesis: 'E', severity: 'warning', function: funcName, error: 'Função não existe' })
        log('E', `❌ Função ${funcName} não existe`, {})
      }
    }
  }
  
  // HIPÓTESE F: Views não existem ou desatualizadas
  log('F', 'Verificando views críticas')
  const criticalViews = [
    'v_carrier_expiring_documents',
    'v_carrier_vehicle_costs_summary',
    'v_operator_routes_secure',
    'v_costs_secure'
  ]
  
  for (const viewName of criticalViews) {
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1)
      
      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        issues.push({ hypothesis: 'F', severity: 'warning', view: viewName, error: 'View não existe' })
        log('F', `❌ View ${viewName} não existe`, {})
      } else if (error && error.code === '42703') {
        issues.push({ hypothesis: 'F', severity: 'warning', view: viewName, error: 'View tem colunas inválidas' })
        log('F', `⚠️ View ${viewName} tem colunas inválidas`, { error: error.message })
      } else if (error) {
        log('F', `⚠️ View ${viewName} retornou erro`, { error: error.message, code: error.code })
      } else {
        log('F', `✅ View ${viewName} existe e é acessível`)
      }
    } catch (err) {
      issues.push({ hypothesis: 'F', severity: 'warning', view: viewName, error: err.message })
      log('F', `❌ Exceção ao verificar view ${viewName}`, { error: err.message })
    }
  }
  
  // Resumo
  console.log('\n📊 RESUMO DO DIAGNÓSTICO\n')
  console.log(`Total de problemas encontrados: ${issues.length}`)
  
  const critical = issues.filter(i => i.severity === 'critical')
  const warnings = issues.filter(i => i.severity === 'warning')
  
  console.log(`\n🔴 Críticos: ${critical.length}`)
  critical.forEach(issue => {
    console.log(`  - ${issue.table || issue.column || issue.function || issue.view || 'Geral'}: ${issue.error}`)
  })
  
  console.log(`\n⚠️ Avisos: ${warnings.length}`)
  warnings.forEach(issue => {
    console.log(`  - ${issue.table || issue.column || issue.function || issue.view || 'Geral'}: ${issue.error || issue.issue}`)
  })
  
  if (issues.length === 0) {
    console.log('\n✅ Nenhum problema encontrado!')
  }
  
  log('SUMMARY', 'Diagnóstico concluído', { totalIssues: issues.length, critical: critical.length, warnings: warnings.length })
  
  return { issues, critical, warnings }
}

// Executar diagnóstico
diagnoseSupabase()
  .then(() => {
    console.log('\n✅ Diagnóstico concluído. Verifique os logs em:', LOG_PATH)
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Erro fatal no diagnóstico:', err)
    process.exit(1)
  })

