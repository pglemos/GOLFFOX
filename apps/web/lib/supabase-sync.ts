/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Serviço centralizado de sincronização com Supabase
 * Implementa retry com backoff exponencial, logging estruturado e fallback local
 */

import { supabase } from './supabase'
import { SupabaseClient } from '@supabase/supabase-js'

export interface SyncOperation {
  id?: string
  resourceType: string
  resourceId: string
  action: 'create' | 'update' | 'delete'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
}

export interface SyncResult {
  success: boolean
  attempts: number
  error?: {
    code: number
    message: string
    body: any
    timestamp: string
  }
  syncedAt?: string
}

export interface SyncHistoryEntry {
  id: string
  operation: SyncOperation
  result: SyncResult
  createdAt: string
  retryCount: number
  lastAttemptAt: string
}

const MAX_RETRIES = 5
const INITIAL_RETRY_DELAY = 1000 // 1 segundo
const SYNC_HISTORY_KEY = 'gf_sync_history'
const FAILED_SYNC_KEY = 'gf_failed_syncs'

/**
 * Armazena histórico de sincronização localmente
 */
function saveSyncHistory(entry: SyncHistoryEntry): void {
  try {
    const history = getSyncHistory()
    history.push(entry)
    // Manter apenas últimos 1000 registros
    if (history.length > 1000) {
      history.shift()
    }
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Erro ao salvar histórico de sincronização:', error)
  }
}

/**
 * Recupera histórico de sincronização
 */
export function getSyncHistory(): SyncHistoryEntry[] {
  try {
    const stored = localStorage.getItem(SYNC_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Erro ao recuperar histórico de sincronização:', error)
    return []
  }
}

/**
 * Armazena sincronização falha para reprocessamento
 */
function saveFailedSync(operation: SyncOperation, result: SyncResult): void {
  try {
    const failed = getFailedSyncs()
    failed.push({
      operation,
      result,
      createdAt: new Date().toISOString(),
      retryCount: result.attempts,
    })
    localStorage.setItem(FAILED_SYNC_KEY, JSON.stringify(failed))
  } catch (error) {
    console.error('Erro ao salvar sincronização falha:', error)
  }
}

/**
 * Recupera sincronizações falhas
 */
export function getFailedSyncs(): Array<{
  operation: SyncOperation
  result: SyncResult
  createdAt: string
  retryCount: number
}> {
  try {
    const stored = localStorage.getItem(FAILED_SYNC_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Erro ao recuperar sincronizações falhas:', error)
    return []
  }
}

/**
 * Limpa sincronizações falhas após sucesso
 */
export function clearFailedSync(operationId: string): void {
  try {
    const failed = getFailedSyncs()
    const filtered = failed.filter(
      (item) => item.operation.id !== operationId
    )
    localStorage.setItem(FAILED_SYNC_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Erro ao limpar sincronização falha:', error)
  }
}

/**
 * Validação de dados antes da sincronização
 */
function validateSyncData(
  resourceType: string,
  data: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validações específicas por tipo de recurso
  switch (resourceType) {
    case 'vehicle':
      if (!data.plate) errors.push('Placa é obrigatória')
      if (!data.model) errors.push('Modelo é obrigatório')
      // Validar capacity apenas se existir (pode não existir no schema)
      if (data.capacity !== undefined && data.capacity !== null && data.capacity < 1) {
        errors.push('Capacidade deve ser maior que zero')
      }
      break

    case 'driver':
      if (!data.name) errors.push('Nome é obrigatório')
      if (!data.email) errors.push('Email é obrigatório')
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Email inválido')
      }
      break

    case 'route':
      if (!data.name) errors.push('Nome da rota é obrigatório')
      if (!data.company_id) errors.push('ID da empresa é obrigatório')
      break

    case 'maintenance':
      if (!data.vehicle_id) errors.push('ID do veículo é obrigatório')
      if (!data.type) errors.push('Tipo de manutenção é obrigatório')
      break

    case 'checklist':
      if (!data.vehicle_id) errors.push('ID do veículo é obrigatório')
      if (!data.driver_id) errors.push('ID do motorista é obrigatório')
      break

    case 'document':
      if (!data.driver_id) errors.push('ID do motorista é obrigatório')
      if (!data.type) errors.push('Tipo de documento é obrigatório')
      break

    case 'operador':
      if (!data.email) errors.push('Email é obrigatório')
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Email inválido')
      }
      break

    case 'company':
      if (!data.name) errors.push('Nome da empresa é obrigatório')
      break

    case 'assistance':
      if (!data.status) errors.push('Status é obrigatório')
      break

    case 'schedule':
      if (!data.company_id) errors.push('ID da empresa é obrigatório')
      if (!data.report_key) errors.push('Chave do relatório é obrigatória')
      if (!data.cron) errors.push('Expressão cron é obrigatória')
      break
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Mapeia dados do sistema para formato Supabase
 */
function mapDataToSupabase(
  resourceType: string,
  data: Record<string, any>
): Record<string, any> {
  const mapped: Record<string, any> = { ...data }

  // Ajustes específicos por tipo
  switch (resourceType) {
    case 'vehicle':
      // Garantir que campos numéricos sejam números
      if (mapped.year) mapped.year = parseInt(mapped.year) || null
      if (mapped.capacity) mapped.capacity = parseInt(mapped.capacity) || null

      // Garantir boolean
      if (typeof mapped.is_active !== 'boolean') {
        mapped.is_active = mapped.is_active !== false
      }
      break

    case 'driver':
      // Garantir role
      if (!mapped.role) mapped.role = 'driver'
      // Garantir boolean
      if (typeof mapped.is_active !== 'boolean') {
        mapped.is_active = mapped.is_active !== false
      }
      break

    case 'route':
      // Converter array de dias da semana para formato correto
      if (Array.isArray(mapped.days_of_week)) {
        mapped.days_of_week = mapped.days_of_week
      }
      // Garantir boolean
      if (typeof mapped.is_active !== 'boolean') {
        mapped.is_active = mapped.is_active !== false
      }
      break

    case 'maintenance':
      // Converter data para ISO string
      if (mapped.due_at && !mapped.due_at.includes('T')) {
        mapped.due_at = new Date(mapped.due_at).toISOString()
      }
      break

    case 'checklist':
      // Garantir que issues seja JSONB
      if (mapped.issues && typeof mapped.issues === 'object') {
        mapped.issues = mapped.issues
      }
      // Converter data para ISO string
      if (mapped.filled_at && !mapped.filled_at.includes('T')) {
        mapped.filled_at = new Date(mapped.filled_at).toISOString()
      }
      break
  }

  return mapped
}

/**
 * Executa sincronização com retry e backoff exponencial
 */
async function executeSyncWithRetry(
  operation: SyncOperation,
  retryCount = 0
): Promise<SyncResult> {
  const startTime = Date.now()
  const result: SyncResult = {
    success: false,
    attempts: retryCount + 1,
  }

  try {
    // Validar dados antes de sincronizar
    const validation = validateSyncData(operation.resourceType, operation.data)
    if (!validation.valid) {
      throw new Error(`Validação falhou: ${validation.errors.join(', ')}`)
    }

    // Mapear dados para formato Supabase
    const mappedData = mapDataToSupabase(operation.resourceType, operation.data)

    // Determinar tabela baseada no tipo de recurso
    const tableMap: Record<string, string> = {
      vehicle: 'vehicles',
      driver: 'users',
      route: 'routes',
      maintenance: 'gf_vehicle_maintenance',
      checklist: 'gf_vehicle_checklists',
      document: 'gf_driver_documents',
      operador: 'users',
      company: 'companies',
      invoice: 'gf_invoices',
      schedule: 'gf_report_schedules',
      assistance: 'gf_assistance_requests',
    }

    const table = tableMap[operation.resourceType] || operation.resourceType

    if (!table) {
      throw new Error(`Tipo de recurso desconhecido: ${operation.resourceType}`)
    }

    // Executar operação no Supabase
    let response: any

    // Cast seguro para permitir tabelas dinâmicas
    const client = supabase as SupabaseClient<any, 'public', any>

    if (operation.action === 'create') {
      const { data, error, status } = await client
        .from(table)
        .insert(mappedData)
        .select()
        .single()

      if (error) throw error
      response = { data, status: status || 201 }
    } else if (operation.action === 'update') {
      if (!operation.resourceId) {
        throw new Error('ID do recurso é obrigatório para atualização')
      }

      const { data, error, status } = await client
        .from(table)
        .update(mappedData)
        .eq('id', operation.resourceId)
        .select()
        .single()

      if (error) throw error
      response = { data, status: status || 200 }
    } else if (operation.action === 'delete') {
      if (!operation.resourceId) {
        throw new Error('ID do recurso é obrigatório para deleção')
      }

      const { error, status } = await client
        .from(table)
        .delete()
        .eq('id', operation.resourceId)

      if (error) throw error
      response = { data: null, status: status || 200 }
    } else {
      throw new Error(`Ação desconhecida: ${operation.action}`)
    }

    // Verificar status HTTP
    const httpStatus = response.status || (response.data ? 200 : 500)

    if (httpStatus >= 200 && httpStatus < 300) {
      // Sucesso
      result.success = true
      result.syncedAt = new Date().toISOString()

      // Registrar histórico
      const historyEntry: SyncHistoryEntry = {
        id: operation.id || `${operation.resourceType}-${Date.now()}`,
        operation,
        result,
        createdAt: new Date().toISOString(),
        retryCount: result.attempts,
        lastAttemptAt: new Date().toISOString(),
      }
      saveSyncHistory(historyEntry)

      // Limpar da lista de falhas se existir
      if (operation.id) {
        clearFailedSync(operation.id)
      }

      return result
    } else {
      // Status HTTP fora do intervalo 200-299
      throw new Error(`HTTP ${httpStatus}: ${JSON.stringify(response)}`)
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido'
    const errorCode = error.code || error.status || 500
    const errorBody = error.response?.data || error.body || error

    // Log estruturado
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation: {
        resourceType: operation.resourceType,
        resourceId: operation.resourceId,
        action: operation.action,
      },
      attempt: retryCount + 1,
      error: {
        code: errorCode,
        message: errorMessage,
        body: errorBody,
      },
    }

    console.error('[SYNC ERROR]', JSON.stringify(logEntry, null, 2))

    result.error = {
      code: errorCode,
      message: errorMessage,
      body: errorBody,
      timestamp: new Date().toISOString(),
    }

    // Se ainda há tentativas disponíveis, tentar novamente
    if (retryCount < MAX_RETRIES - 1) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
      await new Promise((resolve) => setTimeout(resolve, delay))

      return executeSyncWithRetry(operation, retryCount + 1)
    } else {
      // Máximo de tentativas atingido
      // Salvar para reprocessamento posterior
      saveFailedSync(operation, result)

      // Registrar histórico de falha
      const historyEntry: SyncHistoryEntry = {
        id: operation.id || `${operation.resourceType}-${Date.now()}`,
        operation,
        result,
        createdAt: new Date().toISOString(),
        retryCount: result.attempts,
        lastAttemptAt: new Date().toISOString(),
      }
      saveSyncHistory(historyEntry)

      return result
    }
  }
}

/**
 * Função principal de sincronização
 */
export async function syncToSupabase(
  operation: SyncOperation
): Promise<SyncResult> {
  // Gerar ID único se não fornecido
  if (!operation.id) {
    operation.id = `${operation.resourceType}-${operation.resourceId || Date.now()}-${Date.now()}`
  }

  return executeSyncWithRetry(operation, 0)
}

/**
 * Reprocessa sincronizações falhas
 */
export async function reprocessFailedSyncs(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const failed = getFailedSyncs()
  let processed = 0
  let succeeded = 0
  let failedCount = 0

  for (const item of failed) {
    processed++
    const result = await syncToSupabase(item.operation)

    if (result.success) {
      succeeded++
      clearFailedSync(item.operation.id || '')
    } else {
      failedCount++
    }
  }

  return { processed, succeeded, failed: failedCount }
}

/**
 * Verifica status de sincronização
 */
export function getSyncStatus(): {
  totalHistory: number
  failedCount: number
  lastSyncAt?: string
  recentFailures: number
} {
  const history = getSyncHistory()
  const failed = getFailedSyncs()
  const recentFailures = history
    .filter((entry) => {
      const date = new Date(entry.createdAt)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return date > dayAgo && !entry.result.success
    })
    .length

  const lastSync = history
    .filter((entry) => entry.result.success)
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))[0]

  return {
    totalHistory: history.length,
    failedCount: failed.length,
    lastSyncAt: lastSync?.createdAt,
    recentFailures,
  }
}

