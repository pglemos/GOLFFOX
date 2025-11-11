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
      try {
        // Primeiro, tentar obter usuário do cookie de sessão customizado
        if (typeof document !== 'undefined') {
          const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
          if (cookieMatch) {
            try {
              const decoded = atob(cookieMatch[1])
              const u = JSON.parse(decoded)
              if (u?.id && u?.email) {
                setUser({ id: u.id, email: u.email, name: u.email.split('@')[0], role: u.role || 'admin' })
                setLoading(false)
                return
              }
            } catch (err) {
              console.warn('⚠️ Erro ao decodificar cookie de sessão:', err)
            }
          }
        }

        // Fallback: tentar sessão do Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Erro ao obter sessão do Supabase:', sessionError)
        }
        
        if (!session) {
          // Sem sessão - deixar o middleware proteger o acesso (não redirecionar aqui para evitar loop)
          console.log('⚠️ Sem sessão detectada - middleware irá proteger acesso')
          setLoading(false)
          return
        }
        
        setUser({ ...session.user })
        setLoading(false)
      } catch (err) {
        console.error('❌ Erro ao obter usuário:', err)
        setLoading(false)
        // Não redirecionar aqui - deixar o middleware proteger
      }
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

