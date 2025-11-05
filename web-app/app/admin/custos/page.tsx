"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  TrendingUp, 
  Route,
  Building2,
  Truck,
  FileText,
  Filter
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/kpi-utils"
import dynamic from "next/dynamic"

// Lazy load CostCharts (componente pesado com Recharts)
const CostCharts = dynamic(() => import('@/components/costs/cost-charts').then(m => ({ default: m.CostCharts })), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg" />
})
import { ReconciliationModal } from "@/components/costs/reconciliation-modal"
import { motion } from "framer-motion"
import { staggerContainer, listItem } from "@/lib/animations"

interface CostsBreakdown {
  company_id: string
  company_name: string
  by_route: any
  by_vehicle: any
  by_company: number
  daily_total: number
}

export default function CustosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [costsData, setCostsData] = useState<CostsBreakdown[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false)
  const [filters, setFilters] = useState({
    company: '',
    period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadCosts()
      loadInvoices()
    }
    getUser()
  }, [router])

  useEffect(() => {
    if (!loading) {
      loadCosts()
      loadInvoices()
    }
  }, [filters, loading])

  const loadCosts = async () => {
    try {
      let query = supabase.from('v_costs_breakdown').select('*')
      
      if (filters.company) {
        query = query.eq('company_id', filters.company)
      }

      const { data, error } = await query

      if (error) throw error
      setCostsData(data || [])
    } catch (error) {
      console.error("Erro ao carregar custos:", error)
    }
  }

  const loadInvoices = async () => {
    try {
      let query = supabase
        .from('gf_invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (filters.period_start) {
        query = query.gte('period_start', filters.period_start)
      }
      if (filters.period_end) {
        query = query.lte('period_end', filters.period_end)
      }

      const { data, error } = await query

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error("Erro ao carregar faturas:", error)
    }
  }

  // Calcular KPIs agregados
  const aggregatedKpis = costsData.reduce((acc, cost) => {
    if (filters.company && cost.company_id !== filters.company) return acc
    return {
      dailyTotal: acc.dailyTotal + (cost.daily_total || 0),
      byCompany: acc.byCompany + (cost.by_company || 0),
      byRoute: acc.byRoute + (() => {
        const routes = Array.isArray(cost.by_route) ? cost.by_route : []
        return routes.reduce((sum: number, r: any) => sum + (parseFloat(r.total_cost || 0)), 0)
      })(),
      byVehicle: acc.byVehicle + (() => {
        const vehicles = Array.isArray(cost.by_vehicle) ? cost.by_vehicle : []
        return vehicles.reduce((sum: number, v: any) => sum + (parseFloat(v.total_cost || 0)), 0)
      })()
    }
  }, { dailyTotal: 0, byCompany: 0, byRoute: 0, byVehicle: 0 })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Custos</h1>
          <p className="text-[var(--ink-muted)]">Análise de custos operacionais e conciliação de faturas</p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[var(--brand)]" />
              <CardTitle className="text-lg">Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Empresa</label>
                <Input
                  placeholder="Todas as empresas"
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Período Início</label>
                <Input
                  type="date"
                  value={filters.period_start}
                  onChange={(e) => setFilters({ ...filters, period_start: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Período Fim</label>
                <Input
                  type="date"
                  value={filters.period_end}
                  onChange={(e) => setFilters({ ...filters, period_end: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <motion.div variants={listItem}>
            <KpiCard
              icon={DollarSign}
              label="Custo Total do Dia"
              value={formatCurrency(aggregatedKpis.dailyTotal)}
              hint="Hoje"
            />
          </motion.div>
          <motion.div variants={listItem}>
            <KpiCard
              icon={Route}
              label="Por Rota"
              value={formatCurrency(aggregatedKpis.byRoute)}
              hint="Total"
            />
          </motion.div>
          <motion.div variants={listItem}>
            <KpiCard
              icon={Building2}
              label="Por Empresa"
              value={formatCurrency(aggregatedKpis.byCompany)}
              hint="Total"
            />
          </motion.div>
          <motion.div variants={listItem}>
            <KpiCard
              icon={Truck}
              label="Por Veículo"
              value={formatCurrency(aggregatedKpis.byVehicle)}
              hint="Total"
            />
          </motion.div>
        </motion.div>

        {/* Gráficos */}
        <CostCharts companyId={filters.company || undefined} period="month" />

        {/* Faturas Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--brand)]" />
              Faturas Pendentes de Conciliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-[var(--ink-muted)]">
                Nenhuma fatura encontrada
              </div>
            ) : (
              <div className="space-y-2">
                {invoices
                  .filter(inv => inv.status === 'pending' || inv.status === 'reconciled')
                  .map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <div>
                        <div className="font-semibold">
                          {invoice.invoice_number || `Fatura #${invoice.id.slice(0, 8)}`}
                        </div>
                        <div className="text-sm text-[var(--ink-muted)]">
                          {new Date(invoice.period_start).toLocaleDateString('pt-BR')} - {new Date(invoice.period_end).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          {formatCurrency(invoice.total_amount)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={invoice.status === 'approved' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoiceId(invoice.id)
                            setIsReconciliationOpen(true)
                          }}
                        >
                          Conciliação
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Conciliação */}
        <ReconciliationModal
          invoiceId={selectedInvoiceId}
          isOpen={isReconciliationOpen}
          onClose={() => {
            setIsReconciliationOpen(false)
            setSelectedInvoiceId(null)
          }}
          onApprove={loadInvoices}
          onReject={loadInvoices}
        />
      </div>
    </AppShell>
  )
}

