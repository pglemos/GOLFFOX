/**
 * Badge de alerta para sincronização no sidebar
 */

'use client'

import { useSyncAlerts } from '@/hooks/use-sync-alerts'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function SyncAlertBadge() {
  const { hasCriticalAlerts, unreadCount } = useSyncAlerts()

  if (!hasCriticalAlerts && unreadCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="ml-auto"
      >
        <Badge
          variant={hasCriticalAlerts ? 'destructive' : 'default'}
          className="flex items-center gap-1"
        >
          <AlertTriangle className="h-3 w-3" />
          {unreadCount > 0 && (
            <span className="font-semibold">{unreadCount}</span>
          )}
        </Badge>
      </motion.div>
    </AnimatePresence>
  )
}

