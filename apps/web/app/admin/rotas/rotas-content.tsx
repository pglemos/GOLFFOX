"use client"

import { useState, useEffect } from "react"

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
  Trash2,
  Building2,
  Filter
} from "lucide-react"

import { AdvancedNavigationButton } from "@/components/advanced-navigation-button"
import { AppShell } from "@/components/app-shell"
import { RouteModal } from "@/components/modals/route-modal"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterDrawer } from "@/components/shared/filter-drawer"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { SearchBarPremium } from "@/components/shared/search-bar-premium"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAdvancedNavigation } from "@/hooks/use-advanced-navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { useGlobalSync } from "@/hooks/use-global-sync"
import { useRouter } from "@/lib/next-navigation"
import { supabase } from "@/lib/supabase"

import { notifySuccess, notifyError } from "@/lib/toast"
import { RouteCreateModal } from "./route-create-modal"


const Link: any = require("next/link")

export function RotasPageContent() {
  const router = useRouter()
  const { TransitionOverlay } = useAdvancedNavigation()
  const { user, loading } = useAuth()
  const [rotas, setRotas] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    company: "",
    status: "",
    date: ""
  })

  const filterFields = [
    {
      key: "company",
      label: "Empresa",
      type: "text" as const,
      placeholder: "Nome da empresa"
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { label: "Todas", value: "all" },
        { label: "Ativa", value: "active" },
        { label: "Inativa", value: "inactive" }
      ]
    },
    {
      key: "date",
      label: "Data",
      type: "date" as const
    }
  ]
  const [rotasLoading, setRotasLoading] = useState(false)

  const loadRotas = async () => {
    try {
      setRotasLoading(true)
      const response = await fetch('/api/admin/rotas-list', {
        credentials: 'include'
      })
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
    } finally {
      setRotasLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && user) {
      void loadRotas()
    }

  }, [loading, user])

  // Escutar eventos de sincronização global (apenas após carregamento inicial)
  useGlobalSync(
    ['route.created', 'route.updated', 'route.deleted', 'company.created', 'company.updated'],
    () => {
      // Recarregar rotas quando houver mudanças (apenas se já tiver carregado)
      if (!loading && user) {
        void loadRotas()
      }
    },
    [loading, user]
  )

  const handleDeleteRota = async (rotaId: string, rotaName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a rota "${rotaName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const snapshot = [...rotas]
      setRotas((prev) => prev.filter((r) => r.id !== rotaId))
      const response = await fetch(`/api/admin/rotas/delete?id=${rotaId}`, {
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

  if (loading || rotasLoading) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: user?.role || "admin", avatar_url: user?.avatar_url }}>
        <div className="p-3 space-y-4">
          <LoadingSkeleton type="card" count={6} />
        </div>
      </AppShell>
    )
  }

  const filteredRotas = rotas.filter(rota => {
    // Filtro por busca
    const matchesSearch =
      rota.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rota.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rota.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    // Filtro por empresa
    const matchesCompany = !filterValues.company ||
      rota.companies?.name?.toLowerCase().includes(filterValues.company.toLowerCase())

    // Filtro por status
    const matchesStatus = !filterValues.status || filterValues.status === "all" ||
      (filterValues.status === "active" && rota.status === "active") ||
      (filterValues.status === "inactive" && rota.status === "inactive")

    // Filtro por data (simplificado - pode ser melhorado)
    const matchesDate = !filterValues.date || true // TODO: implementar filtro de data

    return matchesSearch && matchesCompany && matchesStatus && matchesDate
  })

  if (!user) {
    return null // useAuth já redireciona
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
      <TransitionOverlay>
        <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden pb-12 sm:pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                  <Route className="h-5 w-5 sm:h-6 sm:w-6 text-brand" />
                </div>
                Rotas
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">Gerencie as rotas do sistema</p>
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
              }} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nova Rota</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </div>
          </div>

          {/* Search Bar and Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <SearchBarPremium
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar rotas por nome, descrição ou empresa..."
              />
            </div>
            <FilterDrawer
              filters={filterFields}
              values={filterValues}
              onFilterChange={(key, value) => {
                setFilterValues(prev => ({ ...prev, [key]: value }))
              }}
              onReset={() => setFilterValues({ company: "", status: "", date: "" })}
            />
          </div>

          {/* Routes Grid */}
          {filteredRotas.length === 0 ? (
            <EmptyState
              icon={Route}
              title="Nenhuma rota encontrada"
              description={searchQuery ? "Tente ajustar sua busca ou filtros para encontrar rotas." : "Comece criando sua primeira rota no sistema."}
              actionLabel={searchQuery ? undefined : "Criar Primeira Rota"}
              onAction={searchQuery ? undefined : () => {
                setSelectedRoute(null)
                setIsModalOpen(true)
              }}
            />
          ) : (
            <div className="grid gap-3 sm:gap-4 w-full">
              {filteredRotas.map((rota, index) => (
                <motion.div
                  key={rota.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card variant="premium" className="p-3 sm:p-4 group">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="p-1 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                            <Route className="h-4 w-4 text-brand" />
                          </div>
                          <h3 className="font-bold text-base sm:text-lg group-hover:text-brand transition-colors">{rota.name}</h3>
                          <Badge variant={rota.is_active ? "default" : "secondary"}>
                            {rota.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        <p className="text-sm text-ink-muted mb-2 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {rota.companies?.name}
                        </p>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-ink-muted">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {rota.description || "Sem descrição"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {rota.estimated_duration || "N/A"} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {rota.stops?.length || 0} paradas
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {rota.distance || "N/A"} km
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] touch-manipulation"
                          onClick={() => {
                            setSelectedRoute(rota)
                            setIsModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] touch-manipulation"
                          onClick={async () => {
                            try {
                              const resp = await fetch('/api/admin/generate-stops', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ routeId: rota.id, dbSave: true }),
                                credentials: 'include'
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
                          <Sparkles className="h-4 w-4 mr-1" />
                          Gerar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] touch-manipulation"
                          onClick={() => {
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
                          <MapPin className="h-4 w-4 mr-1" />
                          Mapa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRota(rota.id, rota.name || 'Rota')}
                          className="min-h-[44px] touch-manipulation text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
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
    </AppShell >
  )
}
