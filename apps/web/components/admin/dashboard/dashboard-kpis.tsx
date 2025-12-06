import { motion } from "framer-motion"
import { Stat } from "@/components/ui/Stat"
import { Users, Truck, Navigation, AlertCircle, TrendingUp, Gauge } from "lucide-react"
import { formatCount } from "@/lib/kpi-utils"
import { staggerContainer, listItem } from "@/lib/animations"
import { t } from '@/lib/i18n'

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
    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
            transition={{
                staggerChildren: 0.08,
                delayChildren: 0.2
            }}
        >
            <motion.div variants={listItem}>
                <Stat
                    icon={Users}
                    label={t('admin', 'dashboard.kpis.employeesInTransit')}
                    value={formatCount(kpis.employees_in_transit)}
                    hint={t('admin', 'dashboard.kpis.activeNow')}
                />
            </motion.div>
            <motion.div variants={listItem}>
                <Stat
                    icon={Truck}
                    label={t('admin', 'dashboard.kpis.activeVehicles')}
                    value={formatCount(kpis.vehicles_active)}
                    hint={t('admin', 'dashboard.kpis.onRoute')}
                />
            </motion.div>
            <motion.div variants={listItem}>
                <Stat
                    icon={Navigation}
                    label={t('admin', 'dashboard.kpis.routesToday')}
                    value={formatCount(kpis.routes_today)}
                    hint={t('admin', 'dashboard.kpis.today')}
                />
            </motion.div>
            <motion.div variants={listItem}>
                <Stat
                    icon={AlertCircle}
                    label={t('admin', 'dashboard.kpis.criticalAlerts')}
                    value={formatCount(kpis.critical_alerts)}
                    hint={t('admin', 'dashboard.kpis.attentionNeeded')}
                />
            </motion.div>
            <motion.div variants={listItem}>
                <Stat
                    icon={TrendingUp}
                    label={t('admin', 'dashboard.kpis.routeEfficiency')}
                    value={`${kpis.routeEfficiency}%`}
                    hint={t('admin', 'dashboard.kpis.completionRate')}
                />
            </motion.div>
            <motion.div variants={listItem}>
                <Stat
                    icon={Gauge}
                    label={t('admin', 'dashboard.kpis.systemHealth')}
                    value={`${kpis.systemHealth}%`}
                    hint={
                        kpis.systemHealth >= 80
                            ? t('admin', 'dashboard.kpis.great')
                            : kpis.systemHealth >= 60
                                ? t('admin', 'dashboard.kpis.good')
                                : t('admin', 'dashboard.kpis.attention')
                    }
                />
            </motion.div>
        </motion.div>
    )
}
