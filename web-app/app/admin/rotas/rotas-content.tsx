"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { default as Link } from "next/link"
import { motion } from "framer-motion"
import { 
  Route, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Truck, 
  Edit, 
  Navigation,
  Sparkles,
  Trash2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/app-shell"
import { AdvancedNavigationButton } from "@/components/advanced-navigation-button"
import { useAdvancedNavigation } from "@/hooks/use-advanced-navigation"
import { supabase } from "@/lib/supabase"
import { RouteModal } from "@/components/modals/route-modal"
import { RouteCreateModal } from "./route-create-modal"
import { notifySuccess, notifyError } from "@/lib/toast"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useGlobalSync } from "@/hooks/use-global-sync"

export function RotasPageContent() {
  const router = useRouter()
  const { TransitionOverlay } = useAdvancedNavigation()
  const { user, loading } = useAuthFast()
  const [rotas, setRotas] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      loadRotas()
    }
  }, [loading, user])

  // Escutar eventos de sincronização global (apenas após carregamento inicial)
  useGlobalSync(
    ['route.created', 'route.updated', 'route.deleted', 'company.created', 'company.updated'],
    () => {
      // Recarregar rotas quando houver mudanças (apenas se já tiver carregado)
      if (!loading && user) {
        loadRotas()
      }
    },
    [loading, user]
  )

  const loadRotas = async () => {
    try {
      const response = await fetch('/api/admin/routes-list')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (Array.isArray(result)) {
        setRotas(result)
        return
      }
      if (result && typeof result === 'object') {
        if (result.success && Array.isArray(result.routes)) {
          setRotas(result.routes)
          return
        }
        if (Array.isArray(result.data)) {
          setRotas(result.data)
          return
        }
      }
      throw new Error((result && result.error) || 'Erro ao carregar rotas')
    } catch (error) {
      console.error("Erro ao carregar rotas:", error)
      setRotas([])
    }
  }

  const handleDeleteRota = async (rotaId: string, rotaName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a rota "${rotaName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const snapshot = [...rotas]
      setRotas((prev) => prev.filter((r) => r.id !== rotaId))
      const response = await fetch(`/api/admin/routes/delete?id=${rotaId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Erro ao excluir rota'
        const errorDetails = result.details ? ` (${result.details})` : ''
        setRotas(snapshot)
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      if (result.success) {
        notifySuccess('Rota excluída permanentemente com sucesso')
        void loadRotas()
      } else {
        setRotas(snapshot)
        throw new Error(result.error || 'Erro ao excluir rota')
      }
    } catch (error: any) {
      console.error('Erro ao excluir rota:', error)
      const errorMessage = error.message || 'Erro desconhecido ao excluir rota'
      notifyError(error, errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando rotas...</p>
        </div>
      </div>
    )
  }

  const filteredRotas = rotas.filter(rota =>
    rota.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rota.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rota.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!user) {
    return null // useAuth já redireciona
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin" }}>
      <TransitionOverlay>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Route className="h-8 w-8 text-blue-600" />
                Rotas
              </h1>
              <p className="text-gray-600 mt-1">Gerencie as rotas do sistema</p>
            </div>
            <div className="flex gap-2">
              <RouteCreateModal
                isOpen={isModalOpen && !selectedRoute}
                onClose={() => {
                  setIsModalOpen(false)
                  setSelectedRoute(null)
                }}
                onSave={() => {
                  loadRotas()
                  setIsModalOpen(false)
                  setSelectedRoute(null)
                }}
              />
              <Button onClick={() => {
                setSelectedRoute(null)
                setIsModalOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Rota
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar rotas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Routes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRotas.map((rota, index) => (
              <motion.div
                key={rota.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{rota.name}</h3>
                      <p className="text-sm text-gray-600">{rota.companies?.name}</p>
                    </div>
                    <Badge variant={rota.is_active ? "default" : "secondary"}>
                      {rota.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{rota.description || "Sem descrição"}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Duração: {rota.estimated_duration || "N/A"} min</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Paradas: {rota.stops?.length || 0}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="h-4 w-4 mr-2" />
                      <span>Distância: {rota.distance || "N/A"} km</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedRoute(rota)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          try {
                            const resp = await fetch('/api/admin/generate-stops', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ routeId: rota.id, dbSave: true })
                            })
                            const data = await resp.json()
                            if (!resp.ok) throw new Error(data?.error || 'Erro ao gerar pontos')
                            notifySuccess('', { i18n: { ns: 'common', key: 'success.pointsGeneratedSaved' } })
                            await loadRotas()
                          } catch (error: any) {
                            notifyError(error, `Erro: ${error.message}`, { i18n: { ns: 'common', key: 'errors.generatePoints' } })
                          }
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar Pontos
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/admin/optimize-route?routeId=${rota.id}`, {
                              method: 'POST'
                            })
                            if (!response.ok) throw new Error('Erro ao otimizar')
                            notifySuccess('', { i18n: { ns: 'common', key: 'success.routeOptimized' } })
                            loadRotas()
                          } catch (error: any) {
                            notifyError(error, `Erro: ${error.message}`, { i18n: { ns: 'common', key: 'errors.optimizeRoute' } })
                          }
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Otimizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // Buscar coordenadas da rota para deep-link
                          const center = rota.origin_lat && rota.origin_lng 
                            ? { lat: rota.origin_lat, lng: rota.origin_lng }
                            : null
                          const zoom = 14
                          
                          const params = new URLSearchParams({
                            route: rota.id,
                            ...(center ? { lat: center.lat.toString(), lng: center.lng.toString(), zoom: zoom.toString() } : {})
                          })
                          
                          router.push(`/admin/mapa?${params.toString()}`)
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Ver no Mapa
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDeleteRota(rota.id, rota.name || 'Rota')}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredRotas.length === 0 && (
            <div className="text-center py-12">
              <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma rota encontrada</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? "Tente ajustar sua busca" : "Comece criando sua primeira rota"}
              </p>
              <Button onClick={() => {
                setSelectedRoute(null)
                setIsModalOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Rota
              </Button>
            </div>
          )}
        </div>

        {/* Modal de Rota */}
        <RouteModal
          route={selectedRoute}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedRoute(null)
          }}
          onSave={() => {
            loadRotas()
            setIsModalOpen(false)
            setSelectedRoute(null)
          }}
          onGenerateStops={async (routeId) => {
            await loadRotas()
          }}
          onOptimize={async (routeId) => {
            await loadRotas()
          }}
        />
      </TransitionOverlay>
    </AppShell>
  )
}
