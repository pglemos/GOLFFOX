"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { FleetMap } from "@/components/fleet-map"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"

function OperatorMapaPageInner() {
  const params = useSearchParams()
  const routeId = params.get('route_id') || undefined
  const latParam = params.get('lat')
  const lngParam = params.get('lng')
  const zoomParam = params.get('zoom')
  const initialCenter = latParam && lngParam ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) } : undefined
  const initialZoom = zoomParam ? parseInt(zoomParam) : undefined

  const { tenantCompanyId, loading: tenantLoading } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUser({ ...session.user })
      setLoading(false)
    }
    run()
  }, [])

  if (loading || tenantLoading) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="h-[calc(100vh-8rem)]">
        <FleetMap 
          companyId={tenantCompanyId || undefined} 
          routeId={routeId} 
          initialCenter={initialCenter} 
          initialZoom={initialZoom} 
        />
      </div>
    </AppShell>
  )
}

export default function OperatorMapaPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <OperatorMapaPageInner />
    </Suspense>
  )
}

