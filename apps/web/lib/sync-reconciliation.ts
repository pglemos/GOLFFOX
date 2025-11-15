/**
 * Mecanismo de reconciliação periódica para detectar e corrigir inconsistências
 */

import {
  getFailedSyncs,
  reprocessFailedSyncs,
  getSyncHistory,
  syncToSupabase,
  SyncOperation,
} from './supabase-sync'
import { supabase } from './supabase'

export interface ReconciliationResult {
  checked: number
  inconsistencies: number
  fixed: number
  errors: number
}

/**
 * Verifica inconsistências comparando dados locais com Supabase
 */
export async function checkInconsistencies(): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    checked: 0,
    inconsistencies: 0,
    fixed: 0,
    errors: 0,
  }

  try {
    // Verificar sincronizações falhas
    const failed = getFailedSyncs()
    result.checked += failed.length

    // Tentar reprocessar falhas
    const reprocessResult = await reprocessFailedSyncs()
    result.fixed += reprocessResult.succeeded
    result.errors += reprocessResult.failed

    // Verificar histórico recente para inconsistências
    const history = getSyncHistory()
    const recentHistory = history
      .filter((entry) => {
        const date = new Date(entry.createdAt)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return date > dayAgo && entry.result.success
      })
      .slice(-100) // Últimas 100 sincronizações bem-sucedidas

    for (const entry of recentHistory) {
      result.checked++

      try {
        // Verificar se o registro ainda existe no Supabase
        const tableMap: Record<string, string> = {
          vehicle: 'vehicles',
          driver: 'users',
          route: 'routes',
          maintenance: 'gf_vehicle_maintenance',
          checklist: 'gf_vehicle_checklists',
          document: 'gf_driver_documents',
        }

        const table = tableMap[entry.operation.resourceType]
        if (!table || !entry.operation.resourceId) continue

        const { data, error } = await supabase
          .from(table)
          .select('id')
          .eq('id', entry.operation.resourceId)
          .single()

        if (error && error.code !== 'PGRST116') {
          // Erro diferente de "não encontrado"
          result.inconsistencies++
          console.warn(
            `Inconsistência detectada para ${entry.operation.resourceType}:${entry.operation.resourceId}`,
            error
          )
        } else if (!data) {
          // Registro não encontrado - inconsistência
          result.inconsistencies++
          result.fixed++

          // Tentar recriar se for uma criação
          if (entry.operation.action === 'create') {
            try {
              await syncToSupabase(entry.operation)
            } catch (syncError) {
              result.errors++
              console.error('Erro ao corrigir inconsistência:', syncError)
            }
          }
        }
      } catch (error) {
        result.errors++
        console.error('Erro ao verificar inconsistência:', error)
      }
    }
  } catch (error) {
    console.error('Erro na reconciliação:', error)
    result.errors++
  }

  return result
}

/**
 * Executa reconciliação periódica
 */
export async function runPeriodicReconciliation(): Promise<ReconciliationResult> {
  console.log('[RECONCILIATION] Iniciando reconciliação periódica...')
  const result = await checkInconsistencies()
  console.log('[RECONCILIATION] Resultado:', result)
  return result
}

/**
 * Inicia reconciliação automática periódica
 */
export function startAutoReconciliation(intervalMinutes = 30): () => void {
  let intervalId: NodeJS.Timeout | null = null

  const run = async () => {
    try {
      await runPeriodicReconciliation()
    } catch (error) {
      console.error('Erro na reconciliação automática:', error)
    }
  }

  // Executar imediatamente
  run()

  // Agendar execução periódica
  intervalId = setInterval(run, intervalMinutes * 60 * 1000)

  // Retornar função para parar
  return () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

