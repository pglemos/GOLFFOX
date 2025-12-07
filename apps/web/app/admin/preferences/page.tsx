"use client"

import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthFast } from "@/hooks/use-auth-fast"

export default function AdminPreferencesPage() {
  const { user, loading } = useAuthFast()

  // Mostrar loading apenas enquanto está carregando
  // Se não houver usuário após carregar, o AppShell ou middleware vai lidar com isso
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  // Se não houver usuário, mostrar uma mensagem ou deixar o AppShell lidar
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <p className="text-[var(--ink-muted)]">Carregando informações do usuário...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }} panel="admin">
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <Settings2 className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--brand)] flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold break-words">Preferências</h1>
        </div>
        <p className="text-sm sm:text-base text-[var(--ink-muted)] break-words">Configurações pessoais e preferências do painel admin.</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
        <Card className="p-4 sm:p-6 space-y-4 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:shadow-xl transition-all duration-300">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold break-words">Tema</h2>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] break-words">Ajuste o tema e aparência da interface.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px] touch-manipulation">Claro</Button>
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px] touch-manipulation">Escuro</Button>
            <Button variant="default" className="w-full sm:w-auto min-h-[44px] touch-manipulation">Automático</Button>
          </div>
        </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
        <Card className="p-4 sm:p-6 space-y-4 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:shadow-xl transition-all duration-300">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold break-words">Notificações</h2>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] break-words">Habilite alertas críticos e emails de sistema.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px] touch-manipulation">Silenciar</Button>
            <Button variant="default" className="w-full sm:w-auto min-h-[44px] touch-manipulation">Habilitar</Button>
          </div>
        </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}

