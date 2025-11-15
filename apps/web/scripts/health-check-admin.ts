/**
 * Health Check Script para Admin
 * Verifica env vars, existência das views/tabelas principais, e conexão Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { getEnvVars, validateEnv } from '../lib/env'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    env: { status: 'pass' | 'fail'; message: string }
    supabaseConnection: { status: 'pass' | 'fail'; message: string }
    tables: { status: 'pass' | 'fail'; message: string; missing: string[] }
    views: { status: 'pass' | 'fail'; message: string; missing: string[] }
  }
  timestamp: string
}

const REQUIRED_TABLES = [
  'gf_cost_centers',
  'gf_invoices',
  'gf_invoice_lines',
  'gf_vehicle_maintenance',
  'gf_vehicle_checklists',
  'gf_driver_documents',
  'gf_incidents',
  'gf_audit_log',
]

const REQUIRED_VIEWS = [
  'v_admin_dashboard_kpis',
  'v_costs_breakdown',
  'v_reports_delays',
  'v_reports_occupancy',
  'v_reports_not_boarded',
  'v_reports_efficiency',
  'v_reports_driver_ranking',
]

async function checkSupabaseConnection(): Promise<{ status: 'pass' | 'fail'; message: string }> {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars()
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return { status: 'fail', message: 'Variáveis Supabase não configuradas' }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Teste simples: SELECT 1
    const { data, error } = await supabase.rpc('health_check', {})
    
    // Se a função não existir, tentar query simples
    if (error) {
      const { error: queryError } = await supabase.from('companies').select('id').limit(1)
      if (queryError) {
        return { status: 'fail', message: `Erro de conexão: ${queryError.message}` }
      }
    }

    return { status: 'pass', message: 'Conexão com Supabase OK' }
  } catch (error: any) {
    return { status: 'fail', message: `Erro ao conectar: ${error.message}` }
  }
}

async function checkTables(): Promise<{ status: 'pass' | 'fail'; message: string; missing: string[] }> {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars()
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return { status: 'fail', message: 'Supabase não configurado', missing: REQUIRED_TABLES }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const missing: string[] = []

    // Verificar cada tabela tentando fazer uma query simples
    for (const table of REQUIRED_TABLES) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1)
        if (error) {
          missing.push(table)
        }
      } catch {
        missing.push(table)
      }
    }

    if (missing.length === 0) {
      return { status: 'pass', message: 'Todas as tabelas existem', missing: [] }
    } else {
      return { 
        status: 'fail', 
        message: `${missing.length} tabela(s) faltando`, 
        missing 
      }
    }
  } catch (error: any) {
    return { status: 'fail', message: `Erro ao verificar tabelas: ${error.message}`, missing: REQUIRED_TABLES }
  }
}

async function checkViews(): Promise<{ status: 'pass' | 'fail'; message: string; missing: string[] }> {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars()
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return { status: 'fail', message: 'Supabase não configurado', missing: REQUIRED_VIEWS }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const missing: string[] = []

    // Verificar cada view tentando fazer uma query simples
    for (const view of REQUIRED_VIEWS) {
      try {
        const { error } = await supabase.from(view).select('*').limit(1)
        if (error) {
          missing.push(view)
        }
      } catch {
        missing.push(view)
      }
    }

    if (missing.length === 0) {
      return { status: 'pass', message: 'Todas as views existem', missing: [] }
    } else {
      return { 
        status: 'fail', 
        message: `${missing.length} view(s) faltando`, 
        missing 
      }
    }
  } catch (error: any) {
    return { status: 'fail', message: `Erro ao verificar views: ${error.message}`, missing: REQUIRED_VIEWS }
  }
}

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString()
  
  // Verificar env vars
  const envValidation = validateEnv()
  const envCheck = {
    status: envValidation.isValid ? 'pass' as const : 'fail' as const,
    message: envValidation.isValid 
      ? 'Todas as variáveis de ambiente válidas'
      : `${envValidation.missing.length} variável(is) faltando, ${envValidation.invalid.length} inválida(s)`
  }

  // Verificar conexão Supabase
  const supabaseCheck = await checkSupabaseConnection()

  // Verificar tabelas
  const tablesCheck = await checkTables()

  // Verificar views
  const viewsCheck = await checkViews()

  // Determinar status geral
  const allChecksPass = 
    envCheck.status === 'pass' &&
    supabaseCheck.status === 'pass' &&
    tablesCheck.status === 'pass' &&
    viewsCheck.status === 'pass'

  const hasFailures = 
    envCheck.status === 'fail' ||
    supabaseCheck.status === 'fail' ||
    tablesCheck.status === 'fail' ||
    viewsCheck.status === 'fail'

  const status = allChecksPass ? 'healthy' : hasFailures ? 'unhealthy' : 'degraded'

  return {
    status,
    checks: {
      env: envCheck,
      supabaseConnection: supabaseCheck,
      tables: tablesCheck,
      views: viewsCheck,
    },
    timestamp,
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runHealthCheck()
    .then((result) => {
      console.log('\n=== Health Check Admin ===\n')
      console.log(`Status: ${result.status.toUpperCase()}`)
      console.log(`Timestamp: ${result.timestamp}\n`)
      
      console.log('Checks:')
      console.log(`  ENV: ${result.checks.env.status.toUpperCase()} - ${result.checks.env.message}`)
      console.log(`  Supabase: ${result.checks.supabaseConnection.status.toUpperCase()} - ${result.checks.supabaseConnection.message}`)
      console.log(`  Tables: ${result.checks.tables.status.toUpperCase()} - ${result.checks.tables.message}`)
      if (result.checks.tables.missing.length > 0) {
        console.log(`    Missing: ${result.checks.tables.missing.join(', ')}`)
      }
      console.log(`  Views: ${result.checks.views.status.toUpperCase()} - ${result.checks.views.message}`)
      if (result.checks.views.missing.length > 0) {
        console.log(`    Missing: ${result.checks.views.missing.join(', ')}`)
      }
      
      process.exit(result.status === 'healthy' ? 0 : 1)
    })
    .catch((error) => {
      console.error('Erro ao executar health check:', error)
      process.exit(1)
    })
}

