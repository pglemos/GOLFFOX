"use client"

import { useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { SyncMonitor } from "@/components/sync-monitor"
import { startAutoReconciliation } from "@/lib/sync-reconciliation"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SincronizacaoPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
    }
    getUser()
  }, [router])

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

  return (
    <AppShell
      user={{
        id: user?.id || "",
        name: user?.name || "Admin",
        email: user?.email || "",
        role: "admin",
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

