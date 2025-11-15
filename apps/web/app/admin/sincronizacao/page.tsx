"use client"

import { useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { SyncMonitor } from "@/components/sync-monitor"
import { startAutoReconciliation } from "@/lib/sync-reconciliation"
import { useAuthFast } from "@/hooks/use-auth-fast"

export default function SincronizacaoPage() {
  const { user, loading } = useAuthFast()

  useEffect(() => {
    // Iniciar reconciliação automática (a cada 30 minutos)
    const stopReconciliation = startAutoReconciliation(30)

    return () => {
      // Limpar ao desmontar
      stopReconciliation()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (!user) {
    return null // useAuthFast já cuida do redirecionamento
  }

  return (
    <AppShell
      user={{
        id: user.id || "",
        name: user.name || "Admin",
        email: user.email || "",
        role: user.role || "admin",
      }}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sincronização com Supabase</h1>
          <p className="text-[var(--ink-muted)]">
            Monitoramento e gerenciamento de sincronizações automáticas
          </p>
        </div>

        <SyncMonitor />
      </div>
    </AppShell>
  )
}

