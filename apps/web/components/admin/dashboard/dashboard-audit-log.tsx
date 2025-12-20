"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/kpi-utils"
import { t } from '@/lib/i18n'
import {
    Plus, Edit, Trash2, CheckCircle, XCircle, Settings, UserPlus, FileText, Activity
} from "lucide-react"
import { motion } from "framer-motion"

interface AuditLog {
    id: string
    actor_id: string | null
    action_type: string
    resource_type: string | null
    resource_id: string | null
    details: any
    created_at: string
}

interface DashboardAuditLogProps {
    logs: AuditLog[]
    loading: boolean
}

export function DashboardAuditLog({ logs, loading }: DashboardAuditLogProps) {
    const getActionIcon = (actionType: string) => {
        const iconMap: Record<string, any> = {
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

    const getActionColor = (actionType: string) => {
        const colorMap: Record<string, string> = {
            create: 'bg-success',
            update: 'bg-text-brand',
            delete: 'bg-text-error',
            approve: 'bg-success',
            reject: 'bg-text-error',
            configure: 'bg-text-brand',
            invite: 'bg-text-brand',
            export: 'bg-text-brand',
        }
        return colorMap[actionType.toLowerCase()] || 'bg-text-brand'
    }

    return (
        <Card>
            <CardHeader className="pb-4 px-3 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex-1">
                        <CardTitle className="text-lg sm:text-xl font-semibold mb-1.5">{t('admin', 'dashboard.auditLog.title')}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{t('admin', 'dashboard.auditLog.subtitle')}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full sm:w-auto min-h-[44px] touch-manipulation">
                        {t('admin', 'dashboard.auditLog.viewAll')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
                {loading ? (
                    <div className="p-12 text-center text-ink-muted">
                        <div className="w-8 h-8 border-2 border-text-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm">{t('admin', 'dashboard.auditLog.loading')}</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-ink-muted">
                        <p className="text-sm">{t('admin', 'dashboard.auditLog.empty')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-border">
                        {logs.map((log, index) => {
                            const ActionIcon = getActionIcon(log.action_type)
                            const actionColor = getActionColor(log.action_type)
                            const resourceName = log.resource_type
                                ? `${log.resource_type}${log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}`
                                : t('admin', 'dashboard.auditLog.system')
                            const actionText = log.action_type
                                ? log.action_type.charAt(0).toUpperCase() + log.action_type.slice(1).toLowerCase()
                                : t('admin', 'dashboard.auditLog.action')
                            return (
                                <motion.div 
                                    key={log.id} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-3 sm:p-4 hover:bg-bg-hover active:bg-bg-hover transition-colors flex items-center gap-2 sm:gap-4 group touch-manipulation"
                                >
                                    <motion.div 
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${actionColor} flex items-center justify-center flex-shrink-0 shadow-sm`}
                                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    >
                                        <ActionIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                    </motion.div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-xs sm:text-sm text-text-ink-strong">
                                            {actionText}: {resourceName}
                                        </p>
                                        <p className="text-xs text-ink-muted mt-0.5">
                                            {formatRelativeTime(log.created_at)}
                                            {log.details?.companyId && ` • ${t('admin', 'dashboard.auditLog.company')}: ${log.details.companyId.slice(0, 8)}`}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs flex-shrink-0 hidden sm:inline-flex">{log.action_type}</Badge>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
