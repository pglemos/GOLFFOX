"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Truck, 
  Users, 
  FileText, 
  AlertCircle,
  Wrench,
  Clock
} from "lucide-react"
import { formatRelativeTime } from "@/lib/kpi-utils"
import { motion } from "framer-motion"
import { t } from "@/lib/i18n"

interface Activity {
  id: string
  type: "vehicle" | "driver" | "document" | "alert" | "maintenance"
  title: string
  description?: string
  timestamp: string
  status?: "success" | "warning" | "error" | "info"
}

interface RecentActivitiesProps {
  activities: Activity[]
  maxItems?: number
  className?: string
}

const activityIcons = {
  vehicle: Truck,
  driver: Users,
  document: FileText,
  alert: AlertCircle,
  maintenance: Wrench
}

const activityColors = {
  success: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
}

export function RecentActivities({
  activities,
  maxItems = 5,
  className
}: RecentActivitiesProps) {
  const displayActivities = activities.slice(0, maxItems)

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">{t('transportadora', 'recent_activities_title')}</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] text-center py-6 sm:py-8">
            {t('transportadora', 'recent_activities_empty')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">{t('transportadora', 'recent_activities_title')}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          {displayActivities.map((activity, index) => {
            const Icon = activityIcons[activity.type]
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors touch-manipulation"
              >
                <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                  activity.status 
                    ? activityColors[activity.status]
                    : "bg-[var(--brand-light)] text-[var(--brand)]"
                }`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-[var(--ink-strong)] truncate">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-[var(--ink-muted)] mt-0.5 sm:mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    {activity.status && (
                      <Badge
                        variant={
                          activity.status === "error"
                            ? "destructive"
                            : activity.status === "warning"
                            ? "default"
                            : "secondary"
                        }
                        className="flex-shrink-0 text-xs hidden sm:inline-flex"
                      >
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-xs text-[var(--ink-muted)]">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{formatRelativeTime(new Date(activity.timestamp))}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

