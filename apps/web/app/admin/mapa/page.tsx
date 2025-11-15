"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import { useAuthFast } from "@/hooks/use-auth-fast"

// Lazy load AdminMap (componente pesado)
const AdminMap = dynamic(() => import('@/components/admin-map').then(m => ({ default: m.AdminMap })), { 
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
    <p className="text-[var(--ink-muted)]">Carregando mapa...</p>
  </div>
})

function MapaContent() {
  const searchParams = useSearchParams()
  const { user, loading } = useAuthFast()
  
  // Ler parâmetros da URL para rota específica e filtros
  const routeId = searchParams?.get('route') || null
  const companyId = searchParams?.get('company') || null
  const vehicleId = searchParams?.get('vehicle') || null
  const latParam = searchParams?.get('lat')
  const lngParam = searchParams?.get('lng')
  const zoomParam = searchParams?.get('zoom')
  
  const initialCenter = latParam && lngParam 
    ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
    : null
  const initialZoom = zoomParam ? parseInt(zoomParam, 10) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MapaContent />
    </Suspense>
  )
}
