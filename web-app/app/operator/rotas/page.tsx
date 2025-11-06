"use client"

import { useEffect, useState } from "react"
// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Badge } from "@/components/ui/badge"
import { Navigation, Users, MapPin, Plus, Map, Zap } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { default as Link } from "next/link"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"
import operatorI18n from "@/i18n/operator.json"

export default function OperatorRotasPage() {
  const router = useRouter()
  const { tenantCompanyId, companyName, loading: tenantLoading } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rotas, setRotas] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
    }
    getUser()
  }, [router])

  useEffect(() => {
    if (tenantCompanyId && !tenantLoading) {
      loadRotas()
    }
  }, [tenantCompanyId, tenantLoading])

    const loadRotas = async () => {
    try {
      // Usar view segura que já filtra por tenantCompanyId via RLS
      const { data, error } = await supabase
        .from("v_operator_routes_secure")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      setRotas(data || [])
    } catch (error) {
      console.error("Erro ao carregar rotas:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{operatorI18n.routes_title}</h1>
            <p className="text-[var(--ink-muted)]">{operatorI18n.routes_subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/operator/rotas/mapa">
              <Button variant="outline">
                <Map className="h-4 w-4 mr-2" />
                Ver no Mapa
              </Button>
            </Link>
            <Link href="/operator/solicitacoes">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Nova Rota
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {rotas.map((rota) => (
            <Card key={rota.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="h-5 w-5 text-[var(--brand)]" />
                    <h3 className="font-bold text-lg">{rota.name}</h3>
                    {rota.carrier_name && (
                      <Badge variant="outline">{rota.carrier_name}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-[var(--ink-muted)]">Total de Viagens:</span>
                      <p className="font-semibold">{rota.total_trips || 0}</p>
                    </div>
                    <div>
                      <span className="text-[var(--ink-muted)]">Concluídas:</span>
                      <p className="font-semibold text-green-600">{rota.completed_trips || 0}</p>
                    </div>
                    {rota.avg_delay_minutes && (
                      <div>
                        <span className="text-[var(--ink-muted)]">Atraso Médio:</span>
                        <p className="font-semibold">{Number(rota.avg_delay_minutes).toFixed(1)} min</p>
                      </div>
                    )}
                  </div>
                </div>
                <Link href={`/operator/rotas/mapa?route_id=${rota.id}`}>
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Ver no Mapa
                  </Button>
                </Link>
              </div>

              {rota.gf_route_plan && rota.gf_route_plan.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Funcionários nesta rota:</h4>
                  <div className="space-y-2">
                    {rota.gf_route_plan
                      .filter((stop: any) => stop.gf_employee_company)
                      .map((stop: any, idx: number) => (
                        <div key={idx} className="p-2 bg-[var(--bg-soft)] rounded-lg flex items-center gap-2">
                          <Users className="h-4 w-4 text-[var(--muted)]" />
                          <div>
                            <p className="text-sm font-medium">{stop.gf_employee_company.name}</p>
                            <p className="text-xs text-[var(--muted)]">CPF: {stop.gf_employee_company.cpf} • Ordem: {stop.stop_order}</p>
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

