import { Suspense } from "react"

import dynamic from "next/dynamic"
import { redirect } from "next/navigation"

import { type Metadata } from "next"

import { AppShell } from "@/components/app-shell"
import { SkeletonList } from "@/components/ui/skeleton"
import { getServerUser, hasServerRole } from "@/lib/server-auth"
import { getSupabaseAdmin } from "@/lib/supabase-client"

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
    
    let query = supabaseAdmin
      .from('gf_incidents')
      .select(`
        *,
        companies(name),
        routes(name),
        veiculos(plate),
        motoristas:users!gf_incidents_driver_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar alertas:', error)
      return []
    }

    return (data || []) as Alerta[]
  } catch (error) {
    console.error('Erro ao buscar alertas:', error)
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
