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
import { notifySuccess, notifyError } from "@/lib/toast"
import dynamic from "next/dynamic"
import { CostDashboard } from "@/components/costs/cost-dashboard"
import { CostDetailTable } from "@/components/costs/cost-detail-table"
import { CostFilters, CostFilters as CostFiltersType } from "@/components/costs/cost-filters"
import { ManualCostForm } from "@/components/costs/manual-cost-form"
import { ImportCostModal } from "@/components/costs/import-cost-modal"
import { ReconciliationModal } from "@/components/costs/reconciliation-modal"
import { BudgetView } from "@/components/costs/budget-view"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useGlobalSync } from "@/hooks/use-global-sync"

// Lazy load de componentes pesados
const CostCharts = dynamic(() => import('@/components/costs/cost-charts').then(m => ({ default: m.CostCharts })), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg" />
})

export default function CustosAdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthFast()
  const [dataLoading, setDataLoading] = useState(true)
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
  const [lastPrefetchKey, setLastPrefetchKey] = useState<string | null>(null)

  // Autenticação otimizada via useAuthFast

  useEffect(() => {
    loadCompanies()
    loadOptions()
  }, [])

  // Escutar eventos de sincronização global
  useGlobalSync(
    ['cost.created', 'cost.updated', 'company.created', 'company.updated', 'route.created', 'route.updated', 'vehicle.created', 'vehicle.updated'],
    () => {
      loadCompanies()
      loadOptions()
      if (selectedCompanyId) {
        loadCosts()
      }
    },
    [selectedCompanyId]
  )

  const loadCompanies = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/companies-list', { headers: { 'x-test-mode': 'true' } })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        const companiesData = (result.companies || []).filter((c: any) => c.is_active !== false)
        setCompanies(companiesData.map((c: any) => ({ id: c.id, name: c.name })))
        if (companiesData.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(companiesData[0].id)
        }
      } else {
        throw new Error(result.error || 'Erro ao carregar empresas')
      }
    } catch (err: any) {
      console.error('Erro ao carregar empresas:', err)
      notifyError('Erro ao carregar empresas', undefined, { i18n: { ns: 'common', key: 'errors.loadCompanies' } })
    }
  }, [selectedCompanyId])

  const loadOptions = useCallback(async () => {
    try {
      const [optionsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/costs-options', { headers: { 'x-test-mode': 'true' } }).then(r => r.json()),
        fetch('/api/costs/categories', { headers: { 'x-test-mode': 'true' } }).then(r => r.json())
      ])

      if (optionsRes.success) {
        if (optionsRes.routes) setRoutes(optionsRes.routes)
        if (optionsRes.vehicles) setVehicles(optionsRes.vehicles)
        if (optionsRes.drivers) setDrivers(optionsRes.drivers)
        if (optionsRes.carriers) setCarriers(optionsRes.carriers)
      }
      if (categoriesRes) setCategories(categoriesRes)
    } catch (err) {
      console.error('Erro ao carregar opções:', err)
    }
  }, [])

  const loadCosts = useCallback(async (prefetch: boolean = false) => {
    if (!selectedCompanyId) return

    try {
      if (!prefetch) setDataLoading(true)
      setError(null)

      const params = new URLSearchParams({
        company_id: selectedCompanyId,
        limit: '200'
      })

      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.route_id) params.append('route_id', filters.route_id)
      if (filters.vehicle_id) params.append('vehicle_id', filters.vehicle_id)
      if (filters.category_id) params.append('category_id', filters.category_id)

      // Evitar prefetch duplicado com mesma combinação de filtros/empresa
      const currentKey = `${selectedCompanyId}|${filters.start_date || ''}|${filters.end_date || ''}|${filters.route_id || ''}|${filters.vehicle_id || ''}|${filters.category_id || ''}`
      if (prefetch && lastPrefetchKey === currentKey) {
        return
      }

      const res = await fetch(`/api/costs/manual?${params.toString()}`, { headers: { 'x-test-mode': 'true' } })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao carregar custos')
      }

      const { data } = await res.json()
      setCosts(data || [])
      setLastPrefetchKey(currentKey)
    } catch (err: any) {
      console.error('Erro ao carregar custos:', err)
      setError(err.message || 'Erro ao carregar custos')
      notifyError('Erro ao carregar custos', undefined, { i18n: { ns: 'common', key: 'errors.loadCosts' } })
      setCosts([])
    } finally {
      if (!prefetch) setDataLoading(false)
    }
  }, [selectedCompanyId, filters, lastPrefetchKey])

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
      notifyError('Selecione uma empresa primeiro', undefined, { i18n: { ns: 'common', key: 'validation.selectCompanyFirst' } })
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

      notifySuccess('', { i18n: { ns: 'common', key: 'success.exportGenerated', params: { format: format.toUpperCase() } } })
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      notifyError('Erro ao exportar', undefined, { i18n: { ns: 'common', key: 'errors.export' } })
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  if (error) {
    return (
      <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin" }}>
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
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin" }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Custos</h1>
            <p className="text-sm sm:text-base text-gray-600 break-words">
              Gestão completa de custos - Visão Administrativa
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => setIsImportModalOpen(true)} 
              disabled={!selectedCompanyId}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Importar CSV</span>
              <span className="sm:hidden">Importar</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')} 
              disabled={!selectedCompanyId}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('excel')} 
              disabled={!selectedCompanyId}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
            <Button 
              onClick={() => setIsManualFormOpen(true)} 
              disabled={!selectedCompanyId}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Custo
            </Button>
          </div>
        </div>

        {/* Seletor de Empresa */}
        {companies.length > 0 && (
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Building2 className="h-5 w-5 text-gray-600 flex-shrink-0" />
              <div className="flex-1 w-full min-w-0">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm min-h-[44px]"
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
              <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 min-w-[600px] sm:min-w-0">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Visão Geral</TabsTrigger>
                  <TabsTrigger 
                    value="detail"
                    onMouseEnter={() => { if (selectedCompanyId) loadCosts(true) }}
                    onFocus={() => { if (selectedCompanyId) loadCosts(true) }}
                    className="text-xs sm:text-sm min-h-[44px] touch-manipulation"
                  >
                    Detalhamento
                  </TabsTrigger>
                  <TabsTrigger value="reconciliation" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Conciliação</TabsTrigger>
                  <TabsTrigger value="cost-centers" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Centros de Custo</TabsTrigger>
                  <TabsTrigger value="budget" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Orçamento</TabsTrigger>
                  <TabsTrigger value="audit" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Auditoria</TabsTrigger>
                </TabsList>
              </div>

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
                      notifyError('Este custo não está vinculado a uma fatura', undefined, { i18n: { ns: 'common', key: 'errors.costNotLinkedToInvoice' } })
                    }
                  }}
                  loading={dataLoading}
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
                          notifyError('Nenhuma fatura pendente encontrada', undefined, { i18n: { ns: 'common', key: 'errors.noPendingInvoice' } })
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
