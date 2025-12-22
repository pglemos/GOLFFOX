"use client"

import { motion } from "framer-motion"
import { Users, Truck, Navigation, AlertCircle, TrendingUp, Gauge } from "lucide-react"
import { formatCount } from "@/lib/kpi-utils"
import { staggerContainer, listItem } from "@/lib/animations"
import { t } from '@/lib/i18n'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DashboardKPIsProps {
    kpis: {
        employees_in_transit: number
        vehicles_active: number
        routes_today: number
        critical_alerts: number
        routeEfficiency: number
        systemHealth: number
    }
}

export function DashboardKPIs({ kpis }: DashboardKPIsProps) {
    const kpiCards = [
        {
            icon: Users,
            label: t('admin', 'dashboard.kpis.employeesInTransit'),
            value: formatCount(kpis.employees_in_transit),
            hint: t('admin', 'dashboard.kpis.activeNow'),
            trend: undefined,
        },
        {
            icon: Truck,
            label: t('admin', 'dashboard.kpis.activeVehicles'),
            value: formatCount(kpis.vehicles_active),
            hint: t('admin', 'dashboard.kpis.onRoute'),
            trend: undefined,
        },
        {
            icon: Navigation,
            label: t('admin', 'dashboard.kpis.routesToday'),
            value: formatCount(kpis.routes_today),
            hint: t('admin', 'dashboard.kpis.today'),
            trend: undefined,
        },
        {
            icon: AlertCircle,
            label: t('admin', 'dashboard.kpis.criticalAlerts'),
            value: formatCount(kpis.critical_alerts),
            hint: t('admin', 'dashboard.kpis.attentionNeeded'),
            trend: kpis.critical_alerts > 0 ? -1 : undefined,
        },
        {
            icon: TrendingUp,
            label: t('admin', 'dashboard.kpis.routeEfficiency'),
            value: `${kpis.routeEfficiency}%`,
            hint: t('admin', 'dashboard.kpis.completionRate'),
            trend: kpis.routeEfficiency >= 80 ? 1 : undefined,
        },
        {
            icon: Gauge,
            label: t('admin', 'dashboard.kpis.systemHealth'),
            value: `${kpis.systemHealth}%`,
            hint: kpis.systemHealth >= 80
                ? t('admin', 'dashboard.kpis.great')
                : kpis.systemHealth >= 60
                    ? t('admin', 'dashboard.kpis.good')
                    : t('admin', 'dashboard.kpis.attention'),
            trend: kpis.systemHealth >= 80 ? 1 : kpis.systemHealth >= 60 ? 0 : -1,
        },
    ]

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full"
            transition={{
                staggerChildren: 0.08,
                delayChildren: 0.2
            }}
        >
            {kpiCards.map((kpi, index) => {
                const Icon = kpi.icon
                return (
                    <motion.div key={index} variants={listItem}>
                        <Card variant="premium" className="group cursor-pointer">
                            <CardHeader>
                                <CardDescription className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft group-hover:from-text-brand group-hover:to-brand-hover transition-all duration-300">
                                        <Icon className="h-4 w-4 text-brand group-hover:text-white transition-colors" />
                                    </div>
                                    {kpi.label}
                                </CardDescription>
                                <CardTitle className="text-2xl sm:text-3xl font-semibold tabular-nums">
                                    {kpi.value}
                                </CardTitle>
                                {kpi.trend !== undefined && (
                                    <Badge variant="outline" className="w-fit mt-2">
                                        {kpi.trend > 0 ? (
                                            <><TrendingUp className="h-3 w-3 mr-1" />+</>
                                        ) : kpi.trend < 0 ? (
                                            <><TrendingUp className="h-3 w-3 mr-1 rotate-180" />-</>
                                        ) : null}
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm pt-0">
                                <div className="text-ink-muted text-xs">
                                    {kpi.hint}
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )
            })}
        </motion.div>
    )
}
