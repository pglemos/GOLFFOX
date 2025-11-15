"use client"

import { useEffect, useState } from "react"
// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { Card } from "@/components/ui/card"
import { MapPin, Link as LinkIcon, RefreshCw } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
// @ts-ignore
import { OperatorKPICards } from "@/components/operator/operator-kpi-cards"     
// @ts-ignore
import { ControlTowerCards } from "@/components/operator/control-tower-cards"   
// @ts-ignore
import Link from "next/link"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"
import operatorI18n from "@/i18n/operator.json"

export default function OperatorDashboard() {
  const router = useRouter()
  const { tenantCompanyId, companyName, loading: tenantLoading } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
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
      }

      setLoading(false)
    }

    getUser()
  }, [router])

  useEffect(() => {
    if (tenantCompanyId && !tenantLoading) {
      loadKPIs(tenantCompanyId)
      loadControlTower(tenantCompanyId)
    }
  }, [tenantCompanyId, tenantLoading])

  const loadKPIs = async (companyId: string) => {
    try {
      // Buscar KPIs da view segura v_operator_dashboard_kpis_secure ou materialized view
      const { data, error } = await supabase
        .from("mv_operator_kpis")
        .select("*")
        .eq("company_id", companyId)
        .single()

      // Fallback para view se materialized não tiver dados
      if (error || !data) {
        const { data: viewData, error: viewError } = await supabase
          .from("v_operator_dashboard_kpis_secure")
          .select("*")
          .eq("company_id", companyId)
          .single()

        if (viewError) {
          console.error("Erro ao carregar KPIs:", viewError)
          return
        }

        if (viewData) {
          setKpis({
            trips_today: Number(viewData.trips_today) || 0,
            trips_in_progress: Number(viewData.trips_in_progress) || 0,
            trips_completed: Number(viewData.trips_completed) || 0,
            delays_over_5min: Number(viewData.delays_over_5min) || 0,
            avg_occupancy: Number(viewData.avg_occupancy) || 0,
            daily_cost: parseFloat(viewData.daily_cost || "0"),
            sla_d0: parseFloat(viewData.sla_d0 || "0")
          })
        }
        return
      }

      if (data) {
        setKpis({
          trips_today: Number(data.trips_today) || 0,
          trips_in_progress: Number(data.trips_in_progress) || 0,
          trips_completed: Number(data.trips_completed) || 0,
          delays_over_5min: Number(data.delays_over_5min) || 0,
          avg_occupancy: Number(data.avg_occupancy) || 0,
          daily_cost: parseFloat(data.daily_cost || "0"),
          sla_d0: parseFloat(data.sla_d0 || "0")
        })
      }
    } catch (error) {
      console.error("Erro ao carregar KPIs:", error)
    }
  }

  const loadControlTower = async (companyId: string) => {
    try {
      const { data: alerts, error } = await supabase
        .from("v_operator_alerts_secure")
        .select("type")
        .eq("company_id", companyId)
        .eq("is_resolved", false)

      if (error) {
        console.error("Erro ao carregar alertas:", error)
        return
      }

      const counts = {
        delays: 0,
        stoppedVehicles: 0,
        routeDeviations: 0,
        openAssistance: 0
      }

      alerts?.forEach((alert) => {
        switch (alert.type) {
          case "route_delayed":
            counts.delays++
            break
          case "bus_stopped":
            counts.stoppedVehicles++
            break
          case "route_deviation":
            counts.routeDeviations++
            break
          case "assistance_open":
            counts.openAssistance++
            break
        }
      })

      setControlTower(counts)
    } catch (error) {
      console.error("Erro ao carregar Torre de Controle:", error)
    }
  }

  const handleRefresh = async () => {
    if (!tenantCompanyId) return
    setRefreshing(true)
    await Promise.all([
      loadKPIs(tenantCompanyId),
      loadControlTower(tenantCompanyId)
    ])
    setRefreshing(false)
  }

  if (loading || tenantLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{operatorI18n.loading}</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {operatorI18n.header_title} — {companyName}
            </h1>
            <p className="text-gray-600 mt-1">
              {operatorI18n.dashboard_subtitle || "Visão geral da sua operação"}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing || !tenantCompanyId}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {operatorI18n.actions.refresh}
          </Button>
        </div>

        {!tenantCompanyId ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">{operatorI18n.no_data}</p>
            <p className="text-sm text-gray-500 mt-2">
              Nenhuma empresa selecionada. Selecione uma empresa para continuar.
            </p>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <OperatorKPICards kpis={kpis} loading={false} />
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {operatorI18n.control_tower_title}
              </h2>
              <ControlTowerCards counts={controlTower} />
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
