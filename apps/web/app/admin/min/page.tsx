"use client"

import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, DollarSign, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthFast } from "@/hooks/use-auth-fast"

const Link: any = require("next/link")

export default function AdminMin() {
  const { user, loading } = useAuthFast()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-bg">
        <div className="w-8 h-8 border-2 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  const quickLinks = [
    { href: "/admin/mapa", label: "Mapa da Frota", icon: MapPin, color: "from-success to-emerald-500" },
    { href: "/admin/custos", label: "Custos", icon: DollarSign, color: "from-info-light0 to-cyan-500" },
    { href: "/admin/relatorios", label: "Relatórios", icon: FileText, color: "from-brand to-amber-500" },
  ]

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: user?.role || "admin", avatar_url: user?.avatar_url }} panel="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Áreas do Admin</h1>
          <p className="text-ink-muted">Selecione uma área para acessar:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickLinks.map((link, index) => {
            const Icon = link.icon
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Link href={link.href}>
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-text-brand/30 cursor-pointer">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${link.color} w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg group-hover:text-brand transition-colors">{link.label}</h3>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
