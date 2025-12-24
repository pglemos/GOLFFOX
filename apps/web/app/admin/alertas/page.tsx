import { Suspense } from "react"

import dynamic from "next/dynamic"
import { redirect } from "next/navigation"

import { type Metadata } from "next"

import { AppShell } from "@/components/app-shell"
import { SkeletonList } from "@/components/ui/skeleton"
import { getServerUser, hasServerRole } from "@/lib/server-auth"
import { getSupabaseAdmin } from "@/lib/supabase-client"
import { logError } from "@/lib/logger"

const AlertasPageClient = dynamic(
  () => import("@/components/admin/alertas/alertas-page-client").then(m => ({ default: m.AlertasPageClient })),
  { ssr: true }
)

interface Alerta {
  id: string
  message?: string
  description?: string
  type?: string
  vehicle_plate?: string
  route_name?: string
  severity?: string
  status?: string
  created_at: string
  companies?: { name: string }
  routes?: { name: string }
  veiculos?: { plate: string }
  motoristas?: { name?: string; email: string }
}

// ISR: Revalidar a cada 5 minutos para listagens
export const revalidate = 300

export const metadata: Metadata = {
  title: "Alertas - GOLF FOX",
  description: "Monitoramento e gestão de alertas do sistema",
}

async function fetchAlertas(severity?: string, status?: string): Promise<Alerta[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Usar gf_alerts (tabela correta com dados) ao invés de gf_incidents (vazia)
    let query = supabaseAdmin
      .from('gf_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity)
    }

    if (status && status !== 'all') {
      if (status === 'open') {
        query = query.eq('is_resolved', false)
      } else if (status === 'resolved') {
        query = query.eq('is_resolved', true)
      }
    }

    const { data, error } = await query

    if (error) {
      logError('Erro ao buscar alertas', { error: error.message || error }, 'AlertasPage')
      return []
    }

    // Buscar nomes das empresas para enriquecer os dados
    const alertsData = data || []
    const companyIds = Array.from(new Set(alertsData.map((a: { empresa_id?: string; company_id?: string }) => a.empresa_id || a.company_id).filter(Boolean)))

    let companyMap: Record<string, string> = {}
    if (companyIds.length > 0) {
      try {
        const { data: companies } = await supabaseAdmin
          .from('empresas')
          .select('id, name')
          .in('id', companyIds)

        if (companies) {
          companyMap = companies.reduce((acc: Record<string, string>, curr: { id: string; name?: string }) => {
            if (curr.name) acc[curr.id] = curr.name
            return acc
          }, {})
        }
      } catch (err) {
        // Ignorar erro - apenas não teremos nomes de empresas
      }
    }

    // Mapear dados para o formato esperado pelo frontend
    return alertsData.map((alert: { empresa_id?: string; company_id?: string; details?: Record<string, unknown>; metadata?: Record<string, unknown>; is_resolved?: boolean; created_at: string; [key: string]: unknown }) => {
      const details = alert.details || {}
      const metadata = alert.metadata || {}

      const vehiclePlate = details.vehicle_plate || metadata.vehicle_plate || details.placa || metadata.placa
      const routeName = details.route_name || metadata.route_name || details.rota || metadata.rota
      const driverName = details.driver_name || metadata.driver_name || details.motorista || metadata.motorista
      const driverEmail = details.driver_email || metadata.driver_email

      const companyId = alert.empresa_id || alert.company_id
      const companyName = companyId ? (companyMap[companyId] || 'Empresa não encontrada') : null

      return {
        id: alert.id,
        message: alert.message || alert.title,
        description: alert.message,
        type: alert.alert_type || alert.type,
        severity: alert.severity,
        status: alert.is_resolved ? 'resolved' : 'open',
        created_at: alert.created_at,
        companies: companyName ? { name: companyName } : undefined,
        veiculos: vehiclePlate ? { plate: vehiclePlate } : undefined,
        routes: routeName ? { name: routeName } : undefined,
        motoristas: (driverName || driverEmail) ? { name: driverName, email: driverEmail || '' } : undefined,
        vehicle_plate: vehiclePlate,
        route_name: routeName,
      }
    }) as Alerta[]
  } catch (error: unknown) {
    const err = error as { message?: string }
    logError('Erro ao buscar alertas (catch)', { error: err.message || err }, 'AlertasPage')
    return []
  }
}

export default async function AlertasPage() {
  // Obter usuário do servidor
  const user = await getServerUser()

  // Verificar autenticação - usar throw redirect para evitar problema de redefinição
  if (!user) {
    const { redirect: redirectFn } = await import("next/navigation")
    redirectFn('/?next=/admin/alertas')
  }

  // Verificar role
  if (!hasServerRole(user, 'admin')) {
    const { redirect: redirectFn } = await import("next/navigation")
    redirectFn('/unauthorized')
  }

  // TypeScript: user não pode ser null após verificações acima
  // Usar non-null assertion já que verificamos acima
  const validUser = user!

  return (
    <AppShell user={{
      id: validUser.id,
      name: validUser.name,
      email: validUser.email,
      role: validUser.role,
      avatar_url: validUser.avatar_url || undefined,
    }}>
      <Suspense fallback={<SkeletonList count={5} />}>
        <AlertasWrapper />
      </Suspense>
    </AppShell>
  )
}

async function AlertasWrapper() {
  // Buscar dados iniciais (sem filtros)
  const alertas = await fetchAlertas()
  return <AlertasPageClient initialAlertas={alertas} />
}
