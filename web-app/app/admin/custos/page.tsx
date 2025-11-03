"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { KpiCard } from "@/components/kpi-card"
import { DollarSign, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function CustosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [custoTotal, setCustoTotal] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadCustos()
    }
    getUser()
  }, [router])

  const loadCustos = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from("gf_vehicle_costs")
        .select("total")
        .eq("date", today)

      if (error) throw error
      const total = data?.reduce((acc: number, item: any) => acc + (item.total || 0), 0) || 0
      setCustoTotal(total)
    } catch (error) {
      console.error("Erro ao carregar custos:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Custos</h1>
          <p className="text-[var(--muted)]">Análise de custos operacionais</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KpiCard
            icon={DollarSign}
            label="Custo Total do Dia"
            value={`R$ ${custoTotal.toFixed(2)}`}
            hint="Hoje"
          />
          <KpiCard
            icon={TrendingUp}
            label="Por Rota"
            value="R$ 0,00"
            hint="Média"
          />
          <KpiCard
            icon={TrendingUp}
            label="Por Empresa"
            value="R$ 0,00"
            hint="Média"
          />
          <KpiCard
            icon={TrendingUp}
            label="Por Veículo"
            value="R$ 0,00"
            hint="Média"
          />
        </div>

        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Detalhamento de Custos</h3>
          <p className="text-[var(--muted)]">Cálculo por rota (km total, consumo médio, custo operacional)</p>
        </Card>
      </div>
    </AppShell>
  )
}

