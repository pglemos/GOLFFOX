"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { AdminDashboardClient } from "@/components/admin/dashboard/admin-dashboard-client"
import { useAuthSimple } from "@/hooks/use-auth-simple"

// Componente cliente para evitar travamento do Server Component
export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading } = useAuthSimple()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    console.log('[AdminDashboard] Estado atual:', { loading, hasUser: !!user, role: user?.role })
  }, [user, loading])

  useEffect(() => {
    // Debug para identificar problemas de permissão
    if (!loading) {
      console.log('[AdminDashboard] Estado de autenticação:', {
        hasUser: !!user,
        role: user?.role,
        id: user?.id,
        email: user?.email
      })

      if (!user) {
        console.warn('[AdminDashboard] Usuário não encontrado, redirecionando para login')
        setIsRedirecting(true)
        setTimeout(() => {
          router.replace('/?next=/admin')
        }, 100)
      } else if (user.role !== 'admin') {
        console.warn('[AdminDashboard] Usuário não tem role admin:', user.role)
        setIsRedirecting(true)
        setTimeout(() => {
          router.replace('/unauthorized')
        }, 100)
      }
    }
  }, [user, loading, router])

  // Mostrar loading enquanto verifica autenticação
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-ink-muted">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Usuário não autenticado ou sem permissão
  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <AppShell user={{
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || undefined,
    }}>
      <AdminDashboardClient
        initialKpis={[]}
        initialAuditLogs={[]}
      />
    </AppShell>
  )
}
