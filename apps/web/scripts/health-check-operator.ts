/*
  Health Check - Operator Panel
  Usage: ts-node scripts/health-check-operator.ts
*/

// @ts-expect-error
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

function assertEnv(name: string) {
  if (!process.env[name]) throw new Error(`Env faltando: ${name}`)
}

async function main() {
  console.log('ðŸ”Ž Verificando variÃ¡veis de ambiente...')
  assertEnv('NEXT_PUBLIC_SUPABASE_URL')
  assertEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const supabase = createClient(url, anon)

  console.log('ðŸ”— Testando conexÃ£o com Supabase...')
  const { error: pingError } = await supabase.from('routes').select('id').limit(1)
  if (pingError) throw pingError

  console.log('ðŸ“Š Lendo views do operador (se existirem)...')
  const viewChecks = [
    'v_operator_dashboard_kpis',
    'v_operator_routes',
    'v_operator_alerts',
    'v_operator_costs',
    'v_operator_assigned_carriers',
    'v_operator_sla'
  ]

  for (const view of viewChecks) {
    const { data, error } = await supabase.from(view as any).select('*').limit(1)
    if (error) {
      console.warn(`âš  View ${view} indisponÃ­vel: ${error.message}`)
    } else {
      console.log(`âœ… View ${view}: OK (${data?.length || 0} linhas)`)    
    }
  }

  console.log('âœ… Health-check concluÃ­do com sucesso.')
}

main().catch((e) => {
  console.error('âŒ Health-check falhou:', e.message)
  process.exit(1)
})

