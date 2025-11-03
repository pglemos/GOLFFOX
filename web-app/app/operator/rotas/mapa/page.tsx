"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { FleetMap } from "@/components/fleet-map"
import { useEffect, useState } from "react"
// @ts-ignore
import { supabase } from "@/lib/supabase"

function OperatorMapaPageInner() {
  const params = useSearchParams()
  const routeId = params.get('route_id') || undefined
  const latParam = params.get('lat')
  const lngParam = params.get('lng')
  const zoomParam = params.get('zoom')
  const initialCenter = latParam && lngParam ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) } : undefined
  const initialZoom = zoomParam ? parseInt(zoomParam) : undefined

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

  if (loading) return null

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="h-[calc(100vh-8rem)]">
        <FleetMap routeId={routeId} initialCenter={initialCenter} initialZoom={initialZoom} />
      </div>
    </AppShell>
  )
}

export default function OperatorMapaPage() {
  return (
    <Suspense fallback={null}>
      <OperatorMapaPageInner />
    </Suspense>
  )
}
