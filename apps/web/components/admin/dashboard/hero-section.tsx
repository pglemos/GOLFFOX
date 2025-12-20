"use client"

import { motion } from "framer-motion"
import { TrendingUp, Users, Truck, AlertCircle } from "lucide-react"
import { fadeInUp, staggerContainerFast } from "@/lib/animations"

interface HeroSectionProps {
  totalTrips: number
  activeVehicles: number
  employeesInTransit: number
  criticalAlerts: number
}

export function HeroSection({ 
  totalTrips, 
  activeVehicles, 
  employeesInTransit, 
  criticalAlerts 
}: HeroSectionProps) {
  const stats = [
    {
      icon: TrendingUp,
      label: "Viagens Hoje",
      value: totalTrips,
      color: "from-info to-cyan-500",
      bgColor: "bg-info/10",
    },
    {
      icon: Truck,
      label: "Veículos Ativos",
      value: activeVehicles,
      color: "from-brand to-error",
      bgColor: "bg-brand/10",
    },
    {
      icon: Users,
      label: "Em Trânsito",
      value: employeesInTransit,
      color: "from-success to-emerald-500",
      bgColor: "bg-success/10",
    },
    {
      icon: AlertCircle,
      label: "Alertas Críticos",
      value: criticalAlerts,
      color: "from-error to-rose-500",
      bgColor: "bg-error/10",
    },
  ]

  return (
    <motion.div
      variants={staggerContainerFast}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-text-brand via-brand to-brand-hover p-6 sm:p-8 lg:p-10 shadow-2xl"
    >

      {/* Gradient Overlay */}

      {/* Content */}
      <div className="relative z-10">
        <motion.div variants={fadeInUp} className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Dashboard Administrativo
          </h1>
          <p className="text-sm sm:text-base text-white/80">
            Visão geral do sistema em tempo real
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                custom={index}
                className="relative group"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/80 font-medium">
                      {stat.label}
                    </span>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="text-2xl sm:text-3xl font-bold text-white tabular-nums"
                  >
                    {stat.value.toLocaleString('pt-BR')}
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Decorative Elements */}
      <motion.div
        className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}

