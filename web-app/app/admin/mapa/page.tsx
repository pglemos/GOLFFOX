"use client"

import { useEffect, useState, Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { FleetMap } from "@/components/fleet-map"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"

function MapaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Ler parâmetros da URL para rota específica
  const routeId = searchParams?.get('route') || null
  const latParam = searchParams?.get('lat')
  const lngParam = searchParams?.get('lng')
  const zoomParam = searchParams?.get('zoom')
  
  const initialCenter = latParam && lngParam 
    ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
    : null
  const initialZoom = zoomParam ? parseInt(zoomParam, 10) : null

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()

      setUser({ ...session.user, ...data })
      setLoading(false)
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="loader-spinner mx-auto"></div>
          <p className="mt-4 text-[var(--ink-muted)]">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Admin",
      email: user?.email || "",
      role: "admin"
    }}>
      <div className="space-y-6 animate-fade-in">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--brand-light)]">
            <MapPin className="h-6 w-6 text-[var(--brand)]" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">Mapa da Frota</h1>
            <p className="text-[var(--ink-muted)] text-lg">Visualize veículos e rotas em tempo real</p>
          </div>
        </motion.div>

        <FleetMap 
          routeId={routeId || undefined}
          initialCenter={initialCenter || undefined}
          initialZoom={initialZoom || undefined}
        />
      </div>
    </AppShell>
  )
}

export default function MapaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MapaContent />
    </Suspense>
  )
}
