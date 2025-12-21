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
  console.log('[ADMIN DEBUG] fetchKPIs chamado')
  try {
    const supabaseAdmin = getSupabaseAdmin()
    console.log('[ADMIN DEBUG] supabaseAdmin obtido')

    // Buscar da view de dashboard admin
    const { data, error } = await supabaseAdmin
      .from('v_admin_dashboard_kpis')
      .select('*')

    console.log('[ADMIN DEBUG] Query executada', { error: error?.message, dataLength: data?.length })

    if (error) {
      console.error('[ADMIN DEBUG] Erro ao buscar KPIs:', error)
      return []
    }

    if (!data || data.length === 0) {
      console.log('[ADMIN DEBUG] Sem dados retornados')
      return []
    }

    console.log('[ADMIN DEBUG] Dados brutos:', JSON.stringify(data[0]))

    // Mapear campos da view para a interface esperada
    // A view v_admin_dashboard_kpis retorna: total_companies, total_operators, total_drivers, total_passengers, active_trips, active_vehicles
    // Precisamos mapear para: company_id, company_name, trips_today, vehicles_active, employees_in_transit, critical_alerts, routes_today, trips_completed, trips_in_progress
    const viewData = data[0] as {
      total_companies?: number
      total_operators?: number
      total_drivers?: number
      total_passengers?: number
      active_trips?: number
      active_vehicles?: number
    }

    // Retornar KPIs agregados como um único item
    const result = [{
      company_id: 'all',
      company_name: 'Todas as Empresas',
      trips_today: viewData.active_trips || 0,
      vehicles_active: viewData.active_vehicles || 0,
      employees_in_transit: viewData.total_passengers || 0,
      critical_alerts: 0, // Não disponível na view atualmente
      routes_today: viewData.active_trips || 0, // Aproximação
      trips_completed: 0, // Não disponível na view atualmente
      trips_in_progress: viewData.active_trips || 0,
    }]

    console.log('[ADMIN DEBUG] KPIs mapeados:', JSON.stringify(result))
    return result
  } catch (error) {
    console.error('[ADMIN DEBUG] Erro crítico ao buscar KPIs:', error)
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
