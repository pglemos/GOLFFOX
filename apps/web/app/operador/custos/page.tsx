"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  TrendingUp,
  FileText,
  Upload,
  Plus,
  Download,
  AlertCircle,
  Building2,
  PieChart
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { notifySuccess, notifyError } from "@/lib/toast"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"
import dynamic from "next/dynamic"
import { CostDashboard } from "@/components/costs/cost-dashboard"
import { CostDetailTable } from "@/components/costs/cost-detail-table"
import { CostFilters, CostFilters as CostFiltersType } from "@/components/costs/cost-filters"
import { ManualCostForm } from "@/components/costs/manual-cost-form"
import { ImportCostModal } from "@/components/costs/import-cost-modal"
import { ReconciliationModal } from "@/components/costs/reconciliation-modal"
import { BudgetView } from "@/components/costs/budget-view"

// Lazy load de componentes pesados
const CostCharts = dynamic(() => import('@/components/costs/cost-charts').then(m => ({ default: m.CostCharts })), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg" />
})

export default function CustosOperatorPage() {
  const router = useRouter()
  const { tenantCompanyId, companyName, loading: tenantLoading, error: tenantError } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [costs, setCosts] = useState<any[]>([])
  const [filters, setFilters] = useState<CostFiltersType>({})
  const [routes, setRoutes] = useState<Array<{ id: string; name: string }>>([])
  const [vehicles, setVehicles] = useState<Array<{ id: string; plate: string }>>([])
  const [drivers, setDrivers] = useState<Array<{ id: string; email: string }>>([])
  const [categories, setCategories] = useState<Array<{ id: string; group_name: string; category: string }>>([])
  const [carriers, setCarriers] = useState<Array<{ id: string; name: string }>>([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false)
  const [isManualFormOpen, setIsManualFormOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
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

  const loadCosts = useCallback(async () => {
    if (!tenantCompanyId) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        company_id: tenantCompanyId,
        limit: '1000'
      })

      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.route_id) params.append('route_id', filters.route_id)
      if (filters.vehicle_id) params.append('vehicle_id', filters.vehicle_id)
      if (filters.category_id) params.append('category_id', filters.category_id)

      const res = await fetch(`/api/costs/manual?${params.toString()}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao carregar custos')
      }

      const { data } = await res.json()
      setCosts(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar custos:', err)
      setError(err.message || 'Erro ao carregar custos')
      notifyError('Erro ao carregar custos', undefined, { i18n: { ns: 'common', key: 'errors.loadCosts' } })
      setCosts([])
    } finally {
      setLoading(false)
    }
  }, [tenantCompanyId, filters])

  const loadOptions = useCallback(async () => {
    if (!tenantCompanyId) return

    try {
      // Carregar rotas, veículos, motoristas, categorias
      const [routesRes, vehiclesRes, driversRes, categoriesRes, carriersRes] = await Promise.all([
        supabase.from('v_operator_routes_secure').select('id, name').order('name'),
        supabase.from('vehicles').select('id, plate').order('plate'),
        supabase.from('users').select('id, email').eq('role', 'driver').order('email'),
        fetch('/api/costs/categories').then(r => r.json()),
        supabase.from('carriers').select('id, name').order('name')
      ])

      if (routesRes.data) setRoutes(routesRes.data)
      if (vehiclesRes.data) setVehicles(vehiclesRes.data)
      if (driversRes.data) setDrivers(driversRes.data)
      if (categoriesRes) setCategories(categoriesRes)
      if (carriersRes.data) setCarriers(carriersRes.data.filter((c: any) => c.id && c.name).map((c: any) => ({ id: String(c.id || ''), name: String(c.name || '') })) as unknown as { id: string; name: string }[])
    } catch (err) {
      console.error('Erro ao carregar opções:', err)
    }
  }, [tenantCompanyId])

  useEffect(() => {
    if (tenantCompanyId && !tenantLoading) {
      loadOptions()
      loadCosts()
    }
  }, [tenantCompanyId, tenantLoading, loadOptions, loadCosts])

  const handleFiltersChange = (newFilters: CostFiltersType) => {
    setFilters(newFilters)
  }

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!tenantCompanyId) return

    try {
      const params = new URLSearchParams({
        company_id: tenantCompanyId,
        format
      })

      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters))
      }

      const res = await fetch(`/api/costs/export?${params.toString()}`)
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao exportar')
      }

      if (format === 'csv') {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `custos_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }

      notifySuccess('', { i18n: { ns: 'common', key: 'success.exportGenerated', params: { format: format.toUpperCase() } } })
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      notifyError('Erro ao exportar', undefined, { i18n: { ns: 'common', key: 'errors.export' } })
    }
  }

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (tenantError || error) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Custos</h1>
            <p className="text-gray-600">
              {companyName ? `Empresa: ${companyName}` : "Gestão completa de custos da operação"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button onClick={() => setIsManualFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Custo
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <CostFilters
          onFiltersChange={handleFiltersChange}
          routes={routes}
          vehicles={vehicles}
          drivers={drivers}
          categories={categories}
          carriers={carriers}
        />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="detail">Detalhamento</TabsTrigger>
            <TabsTrigger value="reconciliation">Conciliação</TabsTrigger>
            <TabsTrigger value="cost-centers">Centros de Custo</TabsTrigger>
            <TabsTrigger value="budget">Orçamento</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="mt-6">
            <CostDashboard companyId={tenantCompanyId} period="30" />
          </TabsContent>

          {/* Detalhamento */}
          <TabsContent value="detail" className="mt-6">
            <CostDetailTable
              costs={costs}
              onReconcile={(cost) => {
                if (cost.invoice_id) {
                  setSelectedInvoiceId(cost.invoice_id)
                  setIsReconciliationOpen(true)
                } else {
                      notifyError('Este custo não está vinculado a uma fatura')
                }
              }}
              loading={loading}
            />
          </TabsContent>

          {/* Conciliação */}
          <TabsContent value="reconciliation" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Conciliação de Faturas</h3>
              <p className="text-gray-600 mb-4">
                Concilie custos medidos com faturas recebidas das transportadoras
              </p>
              <Button onClick={() => {
                // Buscar primeira fatura pendente
                supabase
                  .from('gf_invoices')
                  .select('id')
                  .eq('empresa_id', tenantCompanyId)
                  .eq('status', 'pending')
                  .limit(1)
                  .single()
                  .then(({ data }: { data: any }) => {
                    if (data) {
                      setSelectedInvoiceId(data.id)
                      setIsReconciliationOpen(true)
                    } else {
                      notifyError('Nenhuma fatura pendente encontrada')
                    }
                  })
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Abrir Conciliação
              </Button>
            </Card>
          </TabsContent>

          {/* Centros de Custo */}
          <TabsContent value="cost-centers" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Centros de Custo</h3>
              <p className="text-gray-600">
                Breakdown de custos por centro de custo
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Funcionalidade em desenvolvimento
              </p>
            </Card>
          </TabsContent>

          {/* Orçamento */}
          <TabsContent value="budget" className="mt-6">
            <BudgetView companyId={tenantCompanyId} />
          </TabsContent>

          {/* Auditoria */}
          <TabsContent value="audit" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Auditoria de Custos</h3>
              <p className="text-gray-600">
                Log de inclusões, edições e exclusões de custos
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Funcionalidade em desenvolvimento
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modais */}
        <ManualCostForm
          isOpen={isManualFormOpen}
          onClose={() => setIsManualFormOpen(false)}
          onSave={() => {
            loadCosts()
            setIsManualFormOpen(false)
          }}
          companyId={tenantCompanyId}
        />

        <ImportCostModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSave={() => {
            loadCosts()
            setIsImportModalOpen(false)
          }}
          companyId={tenantCompanyId}
        />

        {selectedInvoiceId && (
          <ReconciliationModal
            invoiceId={selectedInvoiceId}
            isOpen={isReconciliationOpen}
            onClose={() => {
              setIsReconciliationOpen(false)
              setSelectedInvoiceId(null)
            }}
            onApprove={() => {
              loadCosts()
            }}
            onReject={() => {
              loadCosts()
            }}
          />
        )}
      </div>
    </AppShell>
  )
}
