import { redirect } from "next/navigation"
import { type Metadata } from "next"
import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { getServerUser, hasServerRole } from "@/lib/server-auth"
import { AdminDashboardClient } from "@/components/admin/dashboard/admin-dashboard-client"
import { getSupabaseAdmin } from "@/lib/supabase-client"
import { SkeletonList } from "@/components/ui/skeleton"

interface KpiData {
  company_id: string
  company_name: string
  trips_today: number
  vehicles_active: number
  employees_in_transit: number
  critical_alerts: number
  routes_today: number
  trips_completed: number
  trips_in_progress: number
}

interface AuditLog {
  id: string
  actor_id: string | null
  action_type: string
  resource_type: string | null
  resource_id: string | null
  details: any
  created_at: string
}

// ISR: Revalidar a cada minuto para dashboards
export const revalidate = 60

export const metadata: Metadata = {
  title: "Dashboard Admin - GOLF FOX",
  description: "Painel administrativo com visão geral do sistema, KPIs e atividades recentes",
}

async function fetchKPIs(): Promise<KpiData[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Tentar diferentes views em ordem de prioridade
    const views = [
      'v_admin_kpis_materialized',
      'v_admin_kpis',
      'v_operador_kpis'
    ]

    for (const viewName of views) {
      try {
        const { data, error } = await supabaseAdmin
          .from(viewName)
          .select('*')
        
        if (error) {
          const code = (error as { code?: string })?.code
          if (code === 'PGRST205') {
            continue
          }
          continue
        }

        if (data && data.length > 0) {
          return data as KpiData[]
        }
      } catch (err) {
        continue
      }
    }

    return []
  } catch (error) {
    console.error('Erro ao buscar KPIs:', error)
    return []
  }
}

async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const auditColumns = 'id,actor_id,action_type,resource_type,resource_id,details,created_at'
    
    const { data, error } = await supabaseAdmin
      .from('gf_audit_log')
      .select(auditColumns)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao buscar audit log:', error)
      return []
    }

    return (data || []) as AuditLog[]
  } catch (error) {
    console.error('Erro ao buscar audit logs:', error)
    return []
  }
}

export default async function AdminDashboard() {
  // Obter usuário do servidor
  const user = await getServerUser()

  // Verificar autenticação
  if (!user) {
    redirect('/?next=/admin')
  }

  // Verificar role
  if (!hasServerRole(user, 'admin')) {
    redirect('/unauthorized')
  }

  return (
    <AppShell user={{
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || undefined,
    }}>
      <Suspense fallback={
        <div className="space-y-6 lg:space-y-8">
          <div className="grid-responsive-cards">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="stat-card p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-bg-hover animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-bg-hover rounded animate-pulse" />
                  <div className="h-8 w-16 bg-bg-hover rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <AdminDashboardWrapper />
      </Suspense>
    </AppShell>
  )
}

async function AdminDashboardWrapper() {
  // Buscar dados em paralelo
  const [kpisData, auditLogs] = await Promise.all([
    fetchKPIs(),
    fetchAuditLogs(),
  ])

  return (
    <AdminDashboardClient
      initialKpis={kpisData}
      initialAuditLogs={auditLogs}
    />
  )
}
