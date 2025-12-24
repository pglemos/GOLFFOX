"use client"

import { useEffect, useState, useMemo } from "react"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Navigation, Users, MapPin, Plus, Map as MapIcon, Search } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { useActiveTrips } from "@/hooks/use-empresa-data"
import operatorI18nData from "@/i18n/operador.json"
import { useRouter } from "@/lib/next-navigation"
import { supabase } from "@/lib/supabase"
import { logError } from "@/lib/logger"



const operatorI18n: { routes_title?: string; routes_subtitle?: string } = operatorI18nData ?? {
  routes_title: "Rotas",
  routes_subtitle: "Gerencie as rotas da sua empresa"
}

export default function OperatorRotasPage() {
  const router = useRouter()
  const { tenantCompanyId, companyName, loading: tenantLoading, error: tenantError } = useOperatorTenant()
  const [user, setUser] = useState<{ id: string; email?: string; name?: string; avatar_url?: string | null } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch das rotas usando React Query
  const { data: rotas = [], isLoading: rotasLoading, error: rotasError } = useQuery({
    queryKey: ["operador-routes", tenantCompanyId],
    queryFn: async () => {
      if (!tenantCompanyId) return []
      const { data, error } = await supabase
        .from("v_operador_routes_secure")
        .select("id, name, description, empresa_id, transportadora_id, is_active, created_at, updated_at")
        .order("name", { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!tenantCompanyId
  })

  // Hook de viagens ativas (Live Status)
  const { data: activeTrips = [] } = useActiveTrips(tenantCompanyId)

  // Mapeia quais rotas estão ativas para acesso O(1)
  const activeRouteIds = useMemo(() => {
    const ids = new Set<string>()
    activeTrips.forEach((trip) => {
      if (trip && 'route_id' in trip && typeof trip.route_id === 'string') {
        ids.add(trip.route_id)
      }
    })
    return ids
  }, [activeTrips])

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!session) {
          router.push("/")
          return
        }
        setUser({ ...session.user })
      } catch (err) {
        logError('Erro ao carregar rotas', { error: err }, 'OperatorRotasPage')
      } finally {
        setAuthLoading(false)
      }
    }
    getUser()
  }, [router])


  if (authLoading || tenantLoading || rotasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (tenantError || rotasError) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2 text-error">Erro ao carregar</h2>
            <p className="text-ink-muted mb-4">{tenantError || (rotasError instanceof Error ? rotasError.message : String(rotasError))}</p>
            <Button onClick={() => window.location.reload()} variant="default">
              Tentar Novamente
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (!tenantCompanyId) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2">Nenhuma empresa selecionada</h2>
            <p className="text-ink-muted mb-4">Selecione uma empresa para continuar</p>
            <Button onClick={() => router.push('/operador')} variant="default">
              Voltar para Dashboard
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">{operatorI18n.routes_title || "Rotas"}</h1>
            <p className="text-sm sm:text-base text-text-muted-foreground break-words">{operatorI18n.routes_subtitle || "Gerencie as rotas da sua empresa"}</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <a href="/operador/rotas/mapa" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full sm:w-auto touch-manipulation text-xs sm:text-sm">
                <MapIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ver no Mapa</span>
                <span className="sm:hidden">Mapa</span>
              </Button>
            </a>
            <a href="/operador/solicitacoes">
              <Button className="touch-manipulation">
                <Plus className="h-4 w-4 mr-2" />
                Nova Rota
              </Button>
            </a>
          </div>
        </div>

        {/* Busca */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
            <Input
              placeholder="Buscar rotas por nome ou transportadora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {rotas
            .filter(rota => {
              if (!debouncedSearchQuery) return true
              const query = debouncedSearchQuery.toLowerCase()
              return (
                rota.name?.toLowerCase().includes(query) ||
                rota.carrier_name?.toLowerCase().includes(query)
              )
            })
            .length === 0 && !rotasLoading && (
              <Card className="p-12 text-center">
                <Navigation className="h-12 w-12 text-ink-light mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {debouncedSearchQuery ? "Nenhuma rota encontrada" : "Nenhuma rota encontrada"}
                </h3>
                <p className="text-sm text-ink-muted mb-4">
                  {debouncedSearchQuery ? "Tente buscar por outros termos." : "Comece criando uma nova rota ou solicitação"}
                </p>
                <a href="/operador/solicitacoes">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Rota
                  </Button>
                </a>
              </Card>
            )}

          {rotas
            .filter(rota => {
              if (!debouncedSearchQuery) return true
              const query = debouncedSearchQuery.toLowerCase()
              return (
                rota.name?.toLowerCase().includes(query) ||
                rota.carrier_name?.toLowerCase().includes(query)
              )
            })
            .map((rota, index) => (
              <motion.div
                key={rota.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card key={rota.id} className="p-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-text-brand/30">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft">
                          <Navigation className="h-4 w-4 text-brand flex-shrink-0" />
                        </div>
                        <h3 className="font-bold text-lg truncate group-hover:text-brand transition-colors">{rota.name || "Rota sem nome"}</h3>
                        {activeRouteIds.has(rota.id) && (
                          <Badge className="bg-success-light0 hover:bg-success animate-pulse text-white border-0 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-white block"></span>
                            AO VIVO
                          </Badge>
                        )}
                        {rota.carrier_name && (
                          <Badge variant="outline" className="flex-shrink-0">{rota.carrier_name}</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-ink-muted">Total de Viagens:</span>
                          <p className="font-semibold">{rota.total_trips || 0}</p>
                        </div>
                        <div>
                          <span className="text-ink-muted">Concluídas:</span>
                          <p className="font-semibold text-success">{rota.completed_trips || 0}</p>
                        </div>
                        {rota.avg_delay_minutes && (
                          <div>
                            <span className="text-ink-muted">Atraso Médio:</span>
                            <p className="font-semibold">{Number(rota.avg_delay_minutes).toFixed(1)} min</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <a href={`/operador/rotas/mapa?route_id=${rota.id}`}>
                      <Button variant="outline" size="sm" className="flex-shrink-0 min-h-[44px] touch-manipulation">
                        <MapPin className="h-4 w-4 mr-2" />
                        Ver no Mapa
                      </Button>
                    </a>
                  </div>

                  {rota.gf_route_plan && Array.isArray(rota.gf_route_plan) && rota.gf_route_plan.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                      <h4 className="font-semibold mb-2 text-sm text-ink-strong">Funcionários nesta rota:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {rota.gf_route_plan
                          .filter((stop: { gf_employee_company?: { name?: string; cpf?: string } | null }) => stop && stop.gf_employee_company)
                          .map((stop: { gf_employee_company?: { name?: string; cpf?: string } | null; stop_order?: number }, idx: number) => (
                            <div key={idx} className="p-2 bg-bg-soft rounded-lg flex items-center gap-2">
                              <Users className="h-4 w-4 text-ink-light flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{stop.gf_employee_company?.name || "Nome não disponível"}</p>
                                <p className="text-xs text-ink-muted">
                                  {stop.gf_employee_company?.cpf && `CPF: ${stop.gf_employee_company.cpf} • `}
                                  Ordem: {stop.stop_order || idx + 1}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
        </div>
      </div>
    </AppShell>
  )
}
