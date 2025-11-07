/**
 * Componente de monitoramento de sincronizações com Supabase
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
} from 'lucide-react'
import {
  getSyncStatus,
  getSyncHistory,
  getFailedSyncs,
  reprocessFailedSyncs,
} from '@/lib/supabase-sync'
import toast from 'react-hot-toast'

export function SyncMonitor() {
  const [status, setStatus] = useState(getSyncStatus())
  const [history, setHistory] = useState(getSyncHistory())
  const [failed, setFailed] = useState(getFailedSyncs())
  const [reprocessing, setReprocessing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const refresh = () => {
    setStatus(getSyncStatus())
    setHistory(getSyncHistory())
    setFailed(getFailedSyncs())
  }

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, 5000) // Atualizar a cada 5 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const handleReprocess = async () => {
    setReprocessing(true)
    try {
      const result = await reprocessFailedSyncs()
      toast.success(
        `Reprocessamento concluído: ${result.succeeded} sucessos, ${result.failed} falhas`
      )
      refresh()
    } catch (error: any) {
      toast.error('Erro ao reprocessar sincronizações')
    } finally {
      setReprocessing(false)
    }
  }

  const recentHistory = history.slice(-10).reverse()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Monitor de Sincronização Supabase
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={reprocessing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Pausar' : 'Retomar'} Auto-refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Geral */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-[var(--ink-muted)]">Total Histórico</div>
              <div className="text-2xl font-bold">{status.totalHistory}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-[var(--ink-muted)]">Falhas Pendentes</div>
              <div className="text-2xl font-bold text-red-600">
                {status.failedCount}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-[var(--ink-muted)]">Falhas Recentes (24h)</div>
              <div className="text-2xl font-bold text-orange-600">
                {status.recentFailures}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-[var(--ink-muted)]">Última Sincronização</div>
              <div className="text-sm font-medium">
                {status.lastSyncAt
                  ? new Date(status.lastSyncAt).toLocaleString('pt-BR')
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Botão de Reprocessamento */}
          {status.failedCount > 0 && (
            <div className="flex items-center gap-2 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <div className="font-semibold text-orange-900 dark:text-orange-100">
                  {status.failedCount} sincronização(ões) falharam
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  Clique em &quot;Reprocessar&quot; para tentar novamente
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReprocess}
                disabled={reprocessing}
              >
                {reprocessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Reprocessando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reprocessar
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Histórico Recente */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Histórico Recente</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {recentHistory.length === 0 ? (
                <div className="text-sm text-[var(--ink-muted)] text-center py-4">
                  Nenhum registro de sincronização ainda
                </div>
              ) : (
                recentHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {entry.result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">
                        {entry.operation.action} {entry.operation.resourceType}
                      </span>
                      {entry.operation.resourceId && (
                        <span className="text-[var(--ink-muted)]">
                          ({entry.operation.resourceId.substring(0, 8)}...)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.retryCount > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {entry.retryCount} tentativas
                        </Badge>
                      )}
                      <span className="text-xs text-[var(--ink-muted)]">
                        {new Date(entry.createdAt).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

