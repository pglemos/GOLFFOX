"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageCircle, ExternalLink, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthFast } from "@/hooks/use-auth-fast"

export default function AjudaSuportePage() {
  const { user, loading } = useAuthFast()
  const [statusSistema] = useState({ status: 'online', timestamp: new Date() })

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  if (!user) {
    return null // useAuthFast já cuida do redirecionamento
  }

  return (
    <AppShell user={{ id: user.id || "", name: user.name || "Admin", email: user.email || "", role: user.role || "admin", avatar_url: user.avatar_url }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ajuda & Suporte</h1>
          <p className="text-[var(--muted)]">Central de ajuda e recursos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="group"
          >
          <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--brand)]/30">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)] w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
              <HelpCircle className="h-6 w-6 text-[var(--brand)]" />
            </div>
            <h3 className="font-bold text-lg mb-2">FAQ</h3>
            <p className="text-sm text-[var(--muted)] mb-4">Perguntas frequentes sobre o sistema</p>
            <Button variant="outline" size="sm">
              Ver FAQ
            </Button>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="group"
          >
          <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--brand)]/30">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)] w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
              <MessageCircle className="h-6 w-6 text-[var(--brand)]" />
            </div>
            <h3 className="font-bold text-lg mb-2">Contato WhatsApp</h3>
            <p className="text-sm text-[var(--muted)] mb-4">Fale com nosso suporte</p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://wa.me/5531999999999" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir WhatsApp
              </a>
            </Button>
          </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-[var(--border)]">
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-2 rounded-lg ${statusSistema.status === 'online' ? 'bg-green-100' : 'bg-red-100'}`}>
              <CheckCircle className={`h-5 w-5 ${statusSistema.status === 'online' ? 'text-[var(--ok)]' : 'text-[var(--err)]'}`} />
            </div>
            <h3 className="font-bold text-lg">Status do Sistema</h3>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Status: <span className="font-medium text-[var(--ok)]">Online</span>
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">
            Última verificação: {statusSistema.timestamp.toLocaleString()}
          </p>
        </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}

