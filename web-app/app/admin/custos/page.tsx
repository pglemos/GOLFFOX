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
  Building2
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
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

export default function CustosAdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
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

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userData && userData.role !== 'admin') {
          router.push('/operator')
          return
        }

        setUser({ ...session.user, ...userData })
      } catch (err: any) {
        console.error('Erro ao obter usuário:', err)
        setError('Erro ao carregar dados do usuário')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  useEffect(() => {
    loadCompanies()
    loadOptions()
  }, [])

  const loadCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      setCompanies(data || [])
      if (data && data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id)
      }
    } catch (err: any) {
      console.error('Erro ao carregar empresas:', err)
      toast.error('Erro ao carregar empresas')
    }
  }, [])

  const loadOptions = useCallback(async () => {
    try {
      const [routesRes, vehiclesRes, driversRes, categoriesRes, carriersRes] = await Promise.all([
        supabase.from('routes').select('id, name').order('name'),
        supabase.from('vehicles').select('id, plate').order('plate'),
        supabase.from('users').select('id, email').eq('role', 'driver').order('email'),
        fetch('/api/costs/categories').then(r => r.json()),
        supabase.from('carriers').select('id, name').order('name')
      ])

      if (routesRes.data) setRoutes(routesRes.data)
      if (vehiclesRes.data) setVehicles(vehiclesRes.data)
      if (driversRes.data) setDrivers(driversRes.data)
      if (categoriesRes) setCategories(categoriesRes)
      if (carriersRes.data) setCarriers(carriersRes.data)
    } catch (err) {
      console.error('Erro ao carregar opções:', err)
    }
  }, [])

  const loadCosts = useCallback(async () => {
    if (!selectedCompanyId) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        company_id: selectedCompanyId,
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
      toast.error(`Erro: ${err.message || 'Erro desconhecido'}`)
      setCosts([])
    } finally {
      setLoading(false)
    }
  }, [selectedCompanyId, filters])

  useEffect(() => {
    if (selectedCompanyId) {
      loadCosts()
    }
  }, [selectedCompanyId, loadCosts])

  const handleFiltersChange = (newFilters: CostFiltersType) => {
    setFilters(newFilters)
  }

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!selectedCompanyId) {
      toast.error('Selecione uma empresa primeiro')
      return
    }

    try {
      const params = new URLSearchParams({
        company_id: selectedCompanyId,
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

      toast.success(`Exportação ${format.toUpperCase()} gerada com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast.error(`Erro: ${error.message || 'Erro desconhecido'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (error) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-red-600">Erro ao carregar</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="default">
              Tentar Novamente
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Custos</h1>
            <p className="text-gray-600">
              Gestão completa de custos - Visão Administrativa
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)} disabled={!selectedCompanyId}>
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')} disabled={!selectedCompanyId}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('excel')} disabled={!selectedCompanyId}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button onClick={() => setIsManualFormOpen(true)} disabled={!selectedCompanyId}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Custo
            </Button>
          </div>
        </div>

        {/* Seletor de Empresa */}
        {companies.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Building2 className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Empresa</label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                  value={selectedCompanyId || ''}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        )}

        {!selectedCompanyId ? (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione uma empresa</h3>
            <p className="text-gray-500">
              Selecione uma empresa acima para visualizar os custos
            </p>
          </Card>
        ) : (
          <>
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
                <CostDashboard companyId={selectedCompanyId} period="30" />
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
                      toast('Este custo não está vinculado a uma fatura')
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
                    supabase
                      .from('gf_invoices')
                      .select('id')
                      .eq('empresa_id', selectedCompanyId)
                      .eq('status', 'pending')
                      .limit(1)
                      .single()
                      .then(({ data }: { data: any }) => {
                        if (data) {
                          setSelectedInvoiceId(data.id)
                          setIsReconciliationOpen(true)
                        } else {
                          toast('Nenhuma fatura pendente encontrada')
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
                <BudgetView companyId={selectedCompanyId} />
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
              companyId={selectedCompanyId}
            />

            <ImportCostModal
              isOpen={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
              onSave={() => {
                loadCosts()
                setIsImportModalOpen(false)
              }}
              companyId={selectedCompanyId}
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
          </>
        )}
      </div>
    </AppShell>
  )
}
