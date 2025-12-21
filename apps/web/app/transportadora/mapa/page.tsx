"use client"

import { useEffect, useState, Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { FleetMap } from "@/components/fleet-map"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "@/lib/next-navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Map, Filter, Layers, Navigation, RefreshCw, Maximize2 } from "lucide-react"

function TransportadoraMapaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showRoutes, setShowRoutes] = useState(true)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("roadmap")
  const [routes, setRoutes] = useState<any[]>([])

  // Parâmetros da URL para navegação
  const routeId = searchParams.get('rota_id')
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const zoomParam = searchParams.get('zoom')
  
  // Obter transportadora_id do usuário
  const transportadoraId = user?.companyId || user?.company_id || null

  const initialCenter = latParam && lngParam 
    ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
    : undefined

  const initialZoom = zoomParam ? parseFloat(zoomParam) : undefined

  // Carregar rotas da transportadora
  useEffect(() => {
    if (transportadoraId) {
      supabase
        .from('routes')
        .select('id, name')
        .eq('transportadora_id', transportadoraId)
        .then(({ data }) => {
          setRoutes(data || [])
        })
    }
  }, [transportadoraId])

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [loading, user, router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Transportadora", email: user?.email || "", role: user?.role || "transportadora", avatar_url: user?.avatar_url }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mapa da Frota</h1>
            <p className="text-ink-muted">Acompanhe sua frota em tempo real</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Centralizar em todos os veículos
              window.location.reload()
            }}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Centralizar
          </Button>
        </div>

        {/* Controles de Filtro */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 block">Filtrar por Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="on-route">Em Rota</SelectItem>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Filtrar por Rota</Label>
                <Select value={routeId || "all"} onValueChange={(value) => {
                  if (value !== "all") {
                    router.push(`/transportadora/mapa?rota_id=${value}`)
                  } else {
                    router.push('/transportadora/mapa')
                  }
                }}>
                  <SelectTrigger>
                    <Layers className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Rotas</SelectItem>
                    {routes.map(route => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showRoutes}
                    onCheckedChange={setShowRoutes}
                  />
                  <Label>Exibir Rotas</Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMapType(mapType === "roadmap" ? "satellite" : mapType === "satellite" ? "terrain" : "roadmap")
                  }}
                >
                  <Map className="h-4 w-4 mr-2" />
                  {mapType === "roadmap" ? "Satélite" : mapType === "satellite" ? "Terreno" : "Mapa"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="h-[calc(100vh-400px)] min-h-[600px] rounded-lg overflow-hidden border border-border relative">
          <FleetMap 
            transportadoraId={transportadoraId || undefined}
            routeId={routeId || undefined}
            initialCenter={initialCenter}
            initialZoom={initialZoom}
          />
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm"
              onClick={() => {
                // Atualizar mapa
                window.location.reload()
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legenda Melhorada */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success-light0"></div>
                <span className="text-sm">Em movimento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-warning-light0"></div>
                <span className="text-sm">Parado (&lt;2min)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-error-light0"></div>
                <span className="text-sm">Parado (&gt;3min)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-info-light0"></div>
                <span className="text-sm">Na garagem</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default function TransportadoraMapaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-info"></div>
      </div>
    }>
      <TransportadoraMapaContent />
    </Suspense>
  )
}

