"use client"

import { Suspense } from "react"

import dynamic from "next/dynamic"

import { motion } from "framer-motion"
import { MapPin } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/components/providers/auth-provider"
import { useSearchParams } from "@/lib/next-navigation"

// Lazy load AdminMap (componente pesado)
const AdminMap = dynamic(() => import('@/components/admin-map').then(m => ({ default: m.AdminMap })), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
    <p className="text-ink-muted">Carregando mapa...</p>
  </div>
})

function MapaContent() {
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  // Ler parâmetros da URL para rota específica e filtros
  const routeId = searchParams?.get('route') || null
  const companyId = searchParams?.get('company') || null
  const vehicleId = searchParams?.get('veiculo') || null
  const latParam = searchParams?.get('lat')
  const lngParam = searchParams?.get('lng')
  const zoomParam = searchParams?.get('zoom')

  const initialCenter = latParam && lngParam
    ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
    : null
  const initialZoom = zoomParam ? parseInt(zoomParam, 10) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-bg">
        <div className="w-8 h-8 border-2 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (!user) {
    return null // useAuth já redireciona
  }

  return (
    <AppShell user={{
      id: user.id,
      name: user.name || "Admin",
      email: user.email,
      role: user.role || "admin"
    }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-brand-light">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-brand" />
              </div>
              Mapa da Frota
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Visualize veículos e rotas em tempo real</p>
          </div>
        </motion.div>

        <AdminMap
          companyId={companyId || undefined}
          routeId={routeId || undefined}
          vehicleId={vehicleId || undefined}
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-info"></div>
      </div>
    }>
      <MapaContent />
    </Suspense>
  )
}
