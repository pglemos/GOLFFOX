"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation, Users, MapPin, Plus, Map } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { notifyError } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"

let operatorI18n: any = {
  routes_title: "Rotas",
  routes_subtitle: "Gerencie as rotas da sua empresa"
}
try {
  operatorI18n = require('@/i18n/operator.json')
} catch (err) {
  // Usar valores padrão
}

export default function OperatorRotasPage() {
  const router = useRouter()
  const { tenantCompanyId, companyName, loading: tenantLoading, error: tenantError } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rotas, setRotas] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Erro ao verificar sessão:', sessionError)
          setError('Erro ao verificar autenticação')
          return
        }
        if (!session) {
          router.push("/")
          return
        }
        setUser({ ...session.user })
      } catch (err: any) {
        console.error('Erro ao obter usuário:', err)
        setError('Erro ao carregar dados do usuário')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  const loadRotas = useCallback(async () => {
    if (!tenantCompanyId) return
    
    try {
      setLoading(true)
      setError(null)
      // Usar view segura que já filtra por tenantCompanyId via RLS
      const { data, error: queryError } = await supabase
        .from("v_operator_routes_secure")
        .select("*")
        .order("name", { ascending: true })

      if (queryError) {
        console.error("Erro ao carregar rotas:", queryError)
        setError(`Erro ao carregar rotas: ${queryError.message}`)
        notifyError(`Erro: ${queryError.message}`, {
          i18n: { ns: 'common', key: 'errors.generic' }
        })
        setRotas([])
        return
      }
      setRotas(data || [])
    } catch (err: any) {
      console.error("Erro ao carregar rotas:", err)
      const errorMessage = err?.message || 'Erro desconhecido'
      setError(errorMessage)
      notifyError(`Erro: ${errorMessage}`, {
        i18n: { ns: 'common', key: 'errors.generic' }
      })
      setRotas([])
    } finally {
      setLoading(false)
    }
  }, [tenantCompanyId])

  useEffect(() => {
    if (tenantCompanyId && !tenantLoading) {
      loadRotas()
    }
  }, [tenantCompanyId, tenantLoading, loadRotas])

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (tenantError || error) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador" }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2 text-red-600">Erro ao carregar</h2>
            <p className="text-gray-600 mb-4">{tenantError || error}</p>
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
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador" }}>
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
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">{operatorI18n.routes_title || "Rotas"}</h1>
            <p className="text-sm sm:text-base text-gray-600 break-words">{operatorI18n.routes_subtitle || "Gerencie as rotas da sua empresa"}</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <a href="/operator/rotas/mapa" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
                <Map className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ver no Mapa</span>
                <span className="sm:hidden">Mapa</span>
              </Button>
            </a>
            <a href="/operator/solicitacoes">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Nova Rota
              </Button>
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          {rotas.length === 0 && !loading && (
            <Card className="p-12 text-center">
              <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma rota encontrada</h3>
              <p className="text-sm text-gray-500 mb-4">
                Comece criando uma nova rota ou solicitação
              </p>
              <a href="/operator/solicitacoes">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Rota
                </Button>
              </a>
            </Card>
          )}

          {rotas.map((rota) => (
            <Card key={rota.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <h3 className="font-bold text-lg truncate">{rota.name || "Rota sem nome"}</h3>
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
                <a href={`/operator/rotas/mapa?route_id=${rota.id}`}>
                  <Button variant="outline" size="sm" className="flex-shrink-0">
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
          ))}
        </div>
      </div>
    </AppShell>
  )
}
