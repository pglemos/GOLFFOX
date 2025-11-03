"use client"

import { useEffect, useState } from "react"
// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { Card } from "@/components/ui/card"
import { MapPin, Link as LinkIcon } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
// @ts-ignore
import { OperatorKPICards } from "@/components/operator/operator-kpi-cards"
// @ts-ignore
import { ControlTowerCards } from "@/components/operator/control-tower-cards"
// @ts-ignore
import Link from "next/link"

export default function OperatorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({
    trips_today: 0,
    trips_in_progress: 0,
    trips_completed: 0,
    delays_over_5min: 0,
    avg_occupancy: 0,
    daily_cost: 0,
    sla_d0: 0
  })
  const [controlTower, setControlTower] = useState({
    delays: 0,
    stoppedVehicles: 0,
    routeDeviations: 0,
    openAssistance: 0
  })
  const [empresaId, setEmpresaId] = useState<string | null>(null)

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

      if (data) {
        setUser({ ...session.user, ...data })
        setEmpresaId(data.company_id)
        if (data.company_id) {
          loadKPIs(data.company_id)
          loadControlTower(data.company_id)
        }
      }
      
      setLoading(false)
    }

    getUser()
  }, [router])

  const loadKPIs = async (companyId: string) => {
    try {
      // Buscar KPIs da view v_operator_dashboard_kpis
      const { data, error } = await supabase
        .from("v_operator_dashboard_kpis")
        .select("*")
        .eq("empresa_id", companyId)
        .single()

      if (error) {
        console.error("Erro ao carregar KPIs:", error)
        return
      }

      if (data) {
        setKpis({
          trips_today: data.trips_today || 0,
          trips_in_progress: data.trips_in_progress || 0,
          trips_completed: data.trips_completed || 0,
          delays_over_5min: data.delays_over_5min || 0,
          avg_occupancy: data.avg_occupancy || 0,
          daily_cost: parseFloat(data.daily_cost || 0),
          sla_d0: parseFloat(data.sla_d0 || 0)
        })
      }
    } catch (error) {
      console.error("Erro ao carregar KPIs:", error)
    }
  }

  const loadControlTower = async (companyId: string) => {
    try {
      // Buscar dados do control tower (alertas críticos)
      const [delaysRes, stoppedRes, deviationsRes, assistanceRes] = await Promise.all([
        // Atrasos
        supabase
          .from("gf_alerts")
          .select("id", { count: "exact", head: true })
          .eq("type", "delay")
          .eq("severity", "high"),
        
        // Veículos parados
        supabase
          .from("gf_alerts")
          .select("id", { count: "exact", head: true })
          .eq("type", "stopped_vehicle")
          .eq("is_resolved", false),
        
        // Desvios
        supabase
          .from("gf_alerts")
          .select("id", { count: "exact", head: true })
          .eq("type", "route_deviation")
          .eq("is_resolved", false),
        
        // Socorro aberto
        supabase
          .from("gf_service_requests")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", companyId)
          .eq("tipo", "socorro")
          .in("status", ["rascunho", "enviado", "em_analise"])
      ])

      setControlTower({
        delays: delaysRes.count || 0,
        stoppedVehicles: stoppedRes.count || 0,
        routeDeviations: deviationsRes.count || 0,
        openAssistance: assistanceRes.count || 0
      })
    } catch (error) {
      console.error("Erro ao carregar Control Tower:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[var(--ink-muted)]">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Operador",
      email: user?.email || "",
      role: "operator"
    }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Painel do Operador</h1>
            <p className="text-[var(--ink-muted)]">Acompanhe sua operação em tempo real</p>
          </div>
          <Link href="/operator/rotas">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <MapPin className="h-4 w-4 mr-2" />
              Ver Rotas
            </Button>
          </Link>
        </div>

        {/* KPIs */}
        <div>
          <h2 className="text-xl font-bold mb-4">KPIs do Dia</h2>
          <OperatorKPICards kpis={kpis} loading={loading} />
        </div>

        {/* Control Tower */}
        <div>
          <h2 className="text-xl font-bold mb-4">Torre de Controle</h2>
          <ControlTowerCards 
            delays={controlTower.delays}
            stoppedVehicles={controlTower.stoppedVehicles}
            routeDeviations={controlTower.routeDeviations}
            openAssistance={controlTower.openAssistance}
            loading={loading}
          />
        </div>

        {/* Mapa Preview */}
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Mapa em Tempo Real</h3>
                <p className="text-sm text-[var(--ink-muted)]">
                  Visualize todas as rotas ativas no mapa
                </p>
              </div>
              <Link href="/operator/rotas/mapa">
                <Button variant="outline" className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Abrir Mapa Completo
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Atividades Recentes */}
        <div>
          <h2 className="text-xl font-bold mb-4">Atividades Recentes</h2>
          <Card className="p-6">
            <p className="text-sm text-[var(--ink-muted)] text-center py-8">
              Nenhuma atividade recente
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
