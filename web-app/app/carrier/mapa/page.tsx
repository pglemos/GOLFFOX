"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { FleetMap } from "@/components/fleet-map"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"

export default function CarrierMapaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Parâmetros da URL para navegação
  const routeId = searchParams.get('rota_id')
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const zoomParam = searchParams.get('zoom')

  const initialCenter = latParam && lngParam 
    ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
    : undefined

  const initialZoom = zoomParam ? parseFloat(zoomParam) : undefined

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Transportadora", email: user?.email || "", role: "carrier" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mapa da Frota</h1>
          <p className="text-[var(--ink-muted)]">Acompanhe sua frota em tempo real</p>
        </div>

        <div className="h-[calc(100vh-300px)] min-h-[600px] rounded-lg overflow-hidden border border-[var(--border)]">
          <FleetMap 
            routeId={routeId || undefined}
            initialCenter={initialCenter}
            initialZoom={initialZoom}
          />
        </div>
      </div>
    </AppShell>
  )
}

