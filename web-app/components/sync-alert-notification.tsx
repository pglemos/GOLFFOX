/**
 * Notificação de alerta de sincronização no topbar
 */

'use client'

import { useSyncAlerts } from '@/hooks/use-sync-alerts'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
// Substituído Link por âncora para evitar erro de default export em build

export function SyncAlertNotification() {
  const { alerts, hasCriticalAlerts, unreadCount, markAsRead } = useSyncAlerts()
  const [isExpanded, setIsExpanded] = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  if (unreadCount === 0) return null

  const visibleAlerts = alerts.filter(
    (alert) => !dismissedAlerts.has(alert.timestamp)
  )

  if (visibleAlerts.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative"
      >
        <Badge
          variant={hasCriticalAlerts ? 'destructive' : 'default'}
          className="flex items-center gap-1 cursor-pointer"
        >
          <AlertTriangle className="h-3 w-3" />
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </Badge>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Alertas de Sincronização</h3>
                <button
                  onClick={() => {
                    markAsRead()
                    setIsExpanded(false)
                  }}
                  className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  Marcar como lido
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {visibleAlerts.map((alert) => (
                  <motion.div
                    key={alert.timestamp}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 rounded border ${
                      alert.type === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              alert.type === 'critical'
                                ? 'text-red-600'
                                : 'text-orange-600'
                            }`}
                          />
                          <span className="text-xs font-medium">
                            {alert.type === 'critical' ? 'Crítico' : 'Aviso'}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink)]">{alert.message}</p>
                      </div>
                      <button
                        onClick={() =>
                          setDismissedAlerts(
                            new Set([...dismissedAlerts, alert.timestamp])
                          )
                        }
                        className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t">
                <a
                  href="/admin/sincronizacao"
                  onClick={() => setIsExpanded(false)}
                  className="text-xs text-[var(--brand)] hover:underline"
                >
                  Ver detalhes →
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

