"use client"

import { useEffect, useState, useCallback } from "react"
// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { Card } from "@/components/ui/card"
import { MapPin } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
// @ts-ignore
import { OperatorKPICards } from "@/components/operator/operator-kpi-cards"
// @ts-ignore
import { ControlTowerCards } from "@/components/operator/control-tower-cards"
// @ts-ignore
import Link from "next/link"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"

export default function OperatorDashboard() {
  const router = useRouter()

  // Limpar parâmetros indesejados da URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      
      // Se tem parâmetro ?company=, redirecionar para URL limpa
      if (url.searchParams.has('company')) {
        console.log('⚠️ Removendo parâmetro ?company= da URL')
        router.replace('/operator')
        return
      }
    }
  }, [])
  const { tenantCompanyId, companyName, loading: tenantLoading, error: tenantError } = useOperatorTenant()
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

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (userError) {
          console.warn('Erro ao buscar dados do usuário:', userError)
        }

        if (userData) {
          setUser({ ...session.user, ...userData })
        } else {
          setUser({ ...session.user })
        }
      } catch (err: any) {
        console.error('Erro ao obter usuário:', err)
        setError('Erro ao carregar dados do usuário')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  const loadKPIs = useCallback(async (companyId: string) => {
    if (!companyId) return
    
    try {
      // Tentar usar materialized view primeiro, fallback para view segura
      let { data, error: kpiError } = await supabase
        .from("mv_operator_kpis")
        .select("*")
        .eq("company_id", companyId)
        .single()

      // Se materialized view falhar, usar view segura
      if (kpiError) {
        console.warn('Materialized view não disponível, usando view segura:', kpiError)
        const result = await supabase
          .from("v_operator_dashboard_kpis_secure")
          .select("*")
          .eq("company_id", companyId)
          .single()
        data = result.data
        kpiError = result.error
      }

      if (kpiError) {
        console.error("Erro ao carregar KPIs:", kpiError)
        // Não mostrar erro ao usuário, apenas usar valores padrão
        return
      }

      if (data) {
        setKpis({
          trips_today: Number(data.trips_today || 0),
          trips_in_progress: Number(data.trips_in_progress || 0),
          trips_completed: Number(data.trips_completed || 0),
          delays_over_5min: Number(data.delays_over_5min || 0),
          avg_occupancy: Number(data.avg_occupancy || 0),
          daily_cost: Number(data.daily_cost || 0),
          sla_d0: Number(data.sla_d0 || 0)
        })
      }
    } catch (err: any) {
      console.error("Erro ao carregar KPIs:", err)
      // Não mostrar erro ao usuário, apenas logar
    }
  }, [])

  const loadControlTower = useCallback(async (companyId: string) => {
    if (!companyId) return
    
    try {
      // Buscar dados do control tower (alertas críticos)
      const [delaysRes, stoppedRes, deviationsRes, assistanceRes] = await Promise.all([
        // Atrasos
        supabase
          .from("gf_alerts")
          .select("id", { count: "exact", head: true })
          .eq("alert_type", "route_delayed")
          .eq("severity", "critical")
          .eq("company_id", companyId),
        
        // Veículos parados
        supabase
          .from("gf_alerts")
          .select("id", { count: "exact", head: true })
          .eq("alert_type", "bus_stopped")
          .eq("is_resolved", false)
          .eq("company_id", companyId),
        
        // Desvios
        supabase
          .from("gf_alerts")
          .select("id", { count: "exact", head: true })
          .eq("alert_type", "deviation")
          .eq("is_resolved", false)
          .eq("company_id", companyId),
        
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
    } catch (err: any) {
      console.error("Erro ao carregar torre de controle:", err)
      // Não mostrar erro ao usuário, apenas logar
    }
  }, [])

  useEffect(() => {
    if (tenantCompanyId && !tenantLoading) {
      loadKPIs(tenantCompanyId)
      loadControlTower(tenantCompanyId)
    }
  }, [tenantCompanyId, tenantLoading, loadKPIs, loadControlTower])

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (tenantError || error) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
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
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2">Nenhuma empresa selecionada</h2>
            <p className="text-gray-600 mb-4">Aguarde enquanto carregamos suas empresas...</p>
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </Card>
        </div>
      </AppShell>
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
            <p className="text-gray-600">
              {companyName ? `Empresa: ${companyName}` : "Acompanhe sua operação em tempo real"}
            </p>
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
          <OperatorKPICards kpis={kpis} loading={false} />
        </div>

        {/* Control Tower */}
        <div>
          <h2 className="text-xl font-bold mb-4">Torre de Controle</h2>
          <ControlTowerCards 
            delays={controlTower.delays}
            stoppedVehicles={controlTower.stoppedVehicles}
            routeDeviations={controlTower.routeDeviations}
            openAssistance={controlTower.openAssistance}
          />
        </div>

        {/* Mapa Preview */}
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Visualização de Rotas</h2>
              <Link href="/operator/rotas/mapa">
                <Button variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver Mapa Completo
                </Button>
              </Link>
            </div>
            <p className="text-gray-600">
              Visualize todas as rotas ativas no mapa interativo
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
