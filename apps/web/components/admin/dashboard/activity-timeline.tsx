"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/kpi-utils"
import {
  Plus, Edit, Trash2, CheckCircle, XCircle, Settings, UserPlus, FileText, Activity, LucideIcon
} from "lucide-react"

interface ActivityItem {
  id: string
  actor_id: string | null
  action_type: string
  resource_type: string | null
  resource_id: string | null
  details: any
  created_at: string
}

interface ActivityTimelineProps {
  activities: ActivityItem[]
  loading: boolean
  onViewAll?: () => void
}

export function ActivityTimeline({ activities, loading, onViewAll }: ActivityTimelineProps) {
  const getActionIcon = (actionType: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      create: Plus,
      update: Edit,
      delete: Trash2,
      approve: CheckCircle,
      reject: XCircle,
      configure: Settings,
      invite: UserPlus,
      export: FileText,
      login: Activity,
      logout: Activity,
    }
    return iconMap[actionType.toLowerCase()] || Activity
  }

  const getActionColor = (actionType: string): string => {
    const colorMap: Record<string, string> = {
      create: 'bg-success',
      update: 'bg-brand',
      delete: 'bg-error',
      approve: 'bg-success',
      reject: 'bg-error',
      configure: 'bg-brand',
      invite: 'bg-brand',
      export: 'bg-brand',
    }
    return colorMap[actionType.toLowerCase()] || 'bg-brand'
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl font-semibold mb-1.5">
              Atividades Recentes
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Últimas ações realizadas no sistema
            </CardDescription>
          </div>
          {onViewAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
              onClick={onViewAll}
            >
              Ver Todas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="p-12 text-center text-ink-muted">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Carregando atividades...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand/20 via-border to-transparent" />

            <div className="space-y-0">
              {activities.slice(0, 10).map((activity, index) => {
                const ActionIcon = getActionIcon(activity.action_type)
                const actionColor = getActionColor(activity.action_type)
                const resourceName = activity.resource_type
                  ? `${activity.resource_type}${activity.resource_id ? ` #${activity.resource_id.slice(0, 8)}` : ''}`
                  : 'Sistema'
                const actionText = activity.action_type
                  ? activity.action_type.charAt(0).toUpperCase() + activity.action_type.slice(1).toLowerCase()
                  : 'Ação'

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="relative pl-14 pb-4 last:pb-0 group"
                  >
                    {/* Timeline Dot */}
                    <motion.div
                      className={`absolute left-4 top-2 w-4 h-4 rounded-full ${actionColor} border-2 border-background shadow-lg z-10`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
                    >
                      <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                    </motion.div>

                    {/* Content Card */}
                    <motion.div
                      className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border hover:border-brand/50 hover:shadow-lg transition-all duration-300 group-hover:bg-card/80"
                      whileHover={{ x: 4, scale: 1.01 }}
                    >
                      <div className="flex items-start gap-4">
                        <motion.div
                          className={`w-10 h-10 rounded-lg ${actionColor} flex items-center justify-center flex-shrink-0 shadow-lg`}
                          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <ActionIcon className="h-5 w-5 text-white" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm text-ink-strong group-hover:text-brand transition-colors">
                              {actionText}: {resourceName}
                            </p>
                            <Badge variant="outline" className="text-xs flex-shrink-0 hidden sm:inline-flex">
                              {activity.action_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-ink-muted">
                            {formatRelativeTime(activity.created_at)}
                            {activity.details?.companyId && ` • Empresa: ${activity.details.companyId.slice(0, 8)}`}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

