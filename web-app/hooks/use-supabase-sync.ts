/**
 * Hook para facilitar uso da sincronização com Supabase
 */

import { useState, useCallback } from 'react'
import {
  syncToSupabase,
  SyncOperation,
  SyncResult,
  getSyncStatus,
  reprocessFailedSyncs,
} from '@/lib/supabase-sync'
import { notifySuccess, notifyError } from '@/lib/toast'

export interface UseSupabaseSyncOptions {
  onSuccess?: (result: SyncResult) => void
  onError?: (result: SyncResult) => void
  showToast?: boolean
}

export function useSupabaseSync(options: UseSupabaseSyncOptions = {}) {
  const { onSuccess, onError, showToast = true } = options
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)

  const sync = useCallback(
    async (operation: SyncOperation): Promise<SyncResult> => {
      setSyncing(true)
      setLastResult(null)

      try {
        const result = await syncToSupabase(operation)

        setLastResult(result)

        if (result.success) {
          if (showToast) {
            notifySuccess('', { i18n: { ns: 'common', key: 'success.syncSupabase' } })
          }
          onSuccess?.(result)
        } else {
          if (showToast) {
            notifyError('', undefined, { i18n: { ns: 'common', key: 'errors.syncWillReprocess', params: { attempts: result.attempts } }, duration: 5000 })
          }
          onError?.(result)
        }

        return result
      } catch (error: any) {
        const errorResult: SyncResult = {
          success: false,
          attempts: 1,
          error: {
            code: 500,
            message: error.message || 'Erro desconhecido',
            body: error,
            timestamp: new Date().toISOString(),
          },
        }

        setLastResult(errorResult)

        if (showToast) {
          notifyError('', undefined, { i18n: { ns: 'common', key: 'errors.syncUnexpected' } })
        }
        onError?.(errorResult)

        return errorResult
      } finally {
        setSyncing(false)
      }
    },
    [onSuccess, onError, showToast]
  )

  const status = getSyncStatus()

  const reprocess = useCallback(async () => {
    setSyncing(true)
    try {
      const result = await reprocessFailedSyncs()
      if (showToast) {
        notifySuccess('', { i18n: { ns: 'common', key: 'success.reprocessSync', params: { succeeded: result.succeeded, failed: result.failed } } })
      }
      return result
    } catch (error: any) {
      if (showToast) {
        notifyError('', undefined, { i18n: { ns: 'common', key: 'errors.reprocessSync' } })
      }
      throw error
    } finally {
      setSyncing(false)
    }
  }, [showToast])

  return {
    sync,
    syncing,
    lastResult,
    status,
    reprocess,
  }
}

