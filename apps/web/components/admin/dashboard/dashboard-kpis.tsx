import { motion } from "framer-motion"
import { Stat } from "@/components/ui/Stat"
import { Users, Truck, Navigation, AlertCircle, Target, Gauge } from "lucide-react"
import { formatCount } from "@/lib/kpi-utils"
import { staggerContainer, listItem } from "@/lib/animations"

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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6"
        >
            <motion.div variants={listItem}>
                <Stat
                    icon={Users}
                    label="Colaboradores em Trânsito"
                    value={formatCount(kpis.employees_in_transit)}
                    hint="Ativo agora"
                />
            </motion.div>
            <motion.div variants={listItem}>
                <Stat
                    icon={Truck}
                    label="Veículos Ativos"
                    value={formatCount(kpis.vehicles_active)}
                    hint="Em rota"
                />
            </motion.div>
            <motion.div variants={listItem}>
                <Stat
                    icon={Navigation}
                    label="Rotas do Dia"
                    value={formatCount(kpis.routes_today)}
                    hint="Hoje"
                />
            </motion.div>
            <motion.div variants={listItem}>
                <Stat
                    icon={AlertCircle}
                    label="Alertas Críticos"
                    value={formatCount(kpis.critical_alerts)}
                    hint="Atenção necessária"
                />
            </motion.div>
            <motion.div variants={listItem}>
                <Stat
                    icon={Target}
                    label="Eficiência de Rotas"
                    value={`${kpis.routeEfficiency}%`}
                    hint="Taxa de conclusão"
                />
            </motion.div>
            <motion.div variants={listItem}>
                <Stat
                    icon={Gauge}
                    label="Saúde do Sistema"
                    value={`${kpis.systemHealth}%`}
                    hint={kpis.systemHealth >= 80 ? "Ótimo" : kpis.systemHealth >= 60 ? "Bom" : "Atenção"}
                />
            </motion.div>
        </motion.div>
    )
}
