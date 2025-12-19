"use client"

import { useEffect, useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Navigation, Users, MapPin, Plus, Map as MapIcon, Search } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useRouter } from "@/lib/next-navigation"
import { Button } from "@/components/ui/button"
import { useOperatorTenant } from "@/components/providers/empresa-tenant-provider"
import { useDebounce } from "@/hooks/use-debounce"
import { useQuery } from "@tanstack/react-query"
import { useActiveTrips } from "@/hooks/use-empresa-data"
import operatorI18nData from "@/i18n/operator.json"

const operatorI18n: any = operatorI18nData ?? {
  routes_title: "Rotas",
  routes_subtitle: "Gerencie as rotas da sua empresa"
}

export default function OperatorRotasPage() {
  const router = useRouter()
  const { tenantCompanyId, companyName, loading: tenantLoading, error: tenantError } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch das rotas usando React Query
  const { data: rotas = [], isLoading: rotasLoading, error: rotasError } = useQuery({
    queryKey: ["operator-routes", tenantCompanyId],
    queryFn: async () => {
      if (!tenantCompanyId) return []
      const { data, error } = await supabase
        .from("v_operator_routes_secure")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      return (data as any[]) || []
    },
    enabled: !!tenantCompanyId
  })

  // Hook de viagens ativas (Live Status)
  const { data: activeTrips = [] } = useActiveTrips(tenantCompanyId)

  // Mapeia quais rotas estão ativas para acesso O(1)
  const activeRouteIds = useMemo(() => {
    const ids = new Set<string>()
    activeTrips.forEach((trip: any) => {
      if (trip.route_id) ids.add(trip.route_id)
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
        console.error(err)
      } finally {
        setAuthLoading(false)
      }
    }
    getUser()
  }, [router])


  if (authLoading || tenantLoading || rotasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (tenantError || rotasError) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2 text-red-600">Erro ao carregar</h2>
            <p className="text-gray-600 mb-4">{tenantError || (rotasError as any)?.message}</p>
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
            <p className="text-gray-600 mb-4">Selecione uma empresa para continuar</p>
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
            <p className="text-sm sm:text-base text-[var(--muted)] break-words">{operatorI18n.routes_subtitle || "Gerencie as rotas da sua empresa"}</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <a href="/operador/rotas/mapa" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px] touch-manipulation text-xs sm:text-sm">
                <MapIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ver no Mapa</span>
                <span className="sm:hidden">Mapa</span>
              </Button>
            </a>
            <a href="/operador/solicitacoes">
              <Button className="min-h-[44px] touch-manipulation">
                <Plus className="h-4 w-4 mr-2" />
                Nova Rota
              </Button>
            </a>
          </div>
        </div>

        {/* Busca */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {debouncedSearchQuery ? "Nenhuma rota encontrada" : "Nenhuma rota encontrada"}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
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
                <Card key={rota.id} className="p-4 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--brand)]/30">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)]">
                          <Navigation className="h-4 w-4 text-[var(--brand)] flex-shrink-0" />
                        </div>
                        <h3 className="font-bold text-lg truncate group-hover:text-[var(--brand)] transition-colors">{rota.name || "Rota sem nome"}</h3>
                        {activeRouteIds.has(rota.id) && (
                          <Badge className="bg-green-500 hover:bg-green-600 animate-pulse text-white border-0 flex items-center gap-1">
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
                          <span className="text-gray-500">Total de Viagens:</span>
                          <p className="font-semibold">{rota.total_trips || 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Concluídas:</span>
                          <p className="font-semibold text-green-600">{rota.completed_trips || 0}</p>
                        </div>
                        {rota.avg_delay_minutes && (
                          <div>
                            <span className="text-gray-500">Atraso Médio:</span>
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
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold mb-2 text-sm text-gray-700">Funcionários nesta rota:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {rota.gf_route_plan
                          .filter((stop: any) => stop && stop.gf_employee_company)
                          .map((stop: any, idx: number) => (
                            <div key={idx} className="p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{stop.gf_employee_company?.name || "Nome não disponível"}</p>
                                <p className="text-xs text-gray-500">
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
