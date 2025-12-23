"use client"

import { useEffect, useState } from "react"

import { useRouter } from "next/navigation"

import { AdminDashboardClient } from "@/components/admin/dashboard/admin-dashboard-client"
import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/components/providers/auth-provider"

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setIsRedirecting(true)
        router.replace('/?next=/admin')
      } else if (user.role !== 'admin') {
        setIsRedirecting(true)
        router.replace('/unauthorized')
      }
    }
  }, [user, loading, router])

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-ink-muted">Autenticando...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  return (
    <AppShell user={user}>
      <AdminDashboardClient
        initialKpis={[]}
        initialAuditLogs={[]}
      />
    </AppShell>
  )
}
