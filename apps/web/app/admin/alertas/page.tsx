import { redirect } from "next/navigation"
import { type Metadata } from "next"
import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { getServerUser, hasServerRole } from "@/lib/server-auth"
import { AlertasPageClient } from "@/components/admin/alertas/alertas-page-client"
import { getSupabaseAdmin } from "@/lib/supabase-client"
import { SkeletonList } from "@/components/ui/skeleton"

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

  // Verificar autenticação
  if (!user) {
    redirect('/?next=/admin/alertas')
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
