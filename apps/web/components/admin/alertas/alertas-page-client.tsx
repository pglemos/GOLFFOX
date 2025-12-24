"use client"

import { useState, useMemo, useCallback, useEffect } from "react"

import dynamic from "next/dynamic"

import {
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle,
  SlidersHorizontal
} from "lucide-react"

import { AlertCard } from "@/components/alerts/alert-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SkeletonList } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import { useGlobalSync } from "@/hooks/use-global-sync"
import { notifySuccess, notifyError } from "@/lib/toast"
import { logError } from "@/lib/logger"

const EditAlertModal = dynamic(
  () => import("@/components/modals/edit-alert-modal").then(m => ({ default: m.EditAlertModal })),
  { ssr: false, loading: () => null }
)

interface Alerta {
  id: string
  message?: string
  description?: string
  type?: string
  vehicle_plate?: string
  route_name?: string
  severity?: string
  status?: string
  created_at: string
  companies?: { name: string }
  routes?: { name: string }
  veiculos?: { plate: string }
  motoristas?: { name?: string; email: string }
}

interface AlertasPageClientProps {
  initialAlertas: Alerta[]
}

export function AlertasPageClient({ initialAlertas }: AlertasPageClientProps) {
  const [alertas, setAlertas] = useState<Alerta[]>(initialAlertas)
  const [dataLoading, setDataLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedAlertForEdit, setSelectedAlertForEdit] = useState<Alerta | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Stats for quick overview
  const stats = useMemo(() => {
    const critical = alertas.filter(a => a.severity === 'critical' && a.status !== 'resolved').length
    const warning = alertas.filter(a => a.severity === 'warning' && a.status !== 'resolved').length
    const open = alertas.filter(a => a.status === 'open').length
    const resolved = alertas.filter(a => a.status === 'resolved').length
    return { critical, warning, open, resolved, total: alertas.length }
  }, [alertas])

  const loadAlertas = useCallback(async () => {
    try {
      setDataLoading(true)
      const params = new URLSearchParams()
      if (filterSeverity !== "all") params.append('severity', filterSeverity)
      if (filterStatus !== "all") params.append('status', filterStatus)

      const response = await fetch(`/api/admin/alertas-list?${params.toString()}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const result = await response.json()
      setAlertas(Array.isArray(result) ? result : result.alerts || [])
    } catch (error) {
      logError("Erro ao carregar alertas", { error }, 'AlertasPageClient')
      notifyError(error, 'Erro ao carregar alertas')
      setAlertas([])
    } finally {
      setDataLoading(false)
    }
  }, [filterSeverity, filterStatus])

  useEffect(() => {
    loadAlertas()
  }, [loadAlertas])

  useGlobalSync(
    ['alert.created', 'alert.updated', 'alert.deleted'],
    () => { if (!dataLoading) loadAlertas() },
    [dataLoading, loadAlertas]
  )

  // Filtered alerts
  const filteredAlertas = useMemo(() => {
    if (!debouncedSearchQuery) return alertas
    const query = debouncedSearchQuery.toLowerCase()
    return alertas.filter(a =>
      a.message?.toLowerCase().includes(query) ||
      a.description?.toLowerCase().includes(query) ||
      a.type?.toLowerCase().includes(query) ||
      a.vehicle_plate?.toLowerCase().includes(query) ||
      a.route_name?.toLowerCase().includes(query) ||
      a.companies?.name?.toLowerCase().includes(query)
    )
  }, [alertas, debouncedSearchQuery])

  const handleResolve = useCallback(async (alertaId: string) => {
    try {
      const response = await fetch('/api/admin/alertas/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: alertaId,
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || result.message || 'Erro ao resolver')
      }

      notifySuccess('Alerta resolvido com sucesso')
      loadAlertas()
    } catch (err) {
      notifyError(err, 'Erro ao resolver alerta')
    }
  }, [loadAlertas])

  const handleDelete = useCallback(async (alertaId: string) => {
    if (!confirm('Tem certeza que deseja excluir este alerta?')) return

    try {
      const response = await fetch(`/api/admin/alertas/delete?id=${alertaId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Erro ao excluir')

      notifySuccess('Alerta excluído')
      loadAlertas()
    } catch (err) {
      notifyError(err, 'Erro ao excluir alerta')
    }
  }, [loadAlertas])

  const handleExport = async () => {
    try {
      const response = await fetch('/api/reports/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportKey: 'incidents', format: 'csv', filters: {} })
      })
      if (!response.ok) throw new Error('Erro ao exportar')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alertas_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      notifySuccess('Exportação realizada')
    } catch {
      notifyError('Erro ao exportar')
    }
  }

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Alertas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento e gestão de alertas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAlertas()}
            disabled={dataLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.critical}</p>
              <p className="text-xs text-muted-foreground">Críticos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.warning}</p>
              <p className="text-xs text-muted-foreground">Avisos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Filter className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-xs text-muted-foreground">Abertos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">Resolvidos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="premium">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="pt-0 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por mensagem, empresa, veículo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Severity Filter */}
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="assigned">Atribuído</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {(filterSeverity !== 'all' || filterStatus !== 'all' || searchQuery) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Filtros ativos:</span>
                {filterSeverity !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Severidade: {filterSeverity}
                    <button onClick={() => setFilterSeverity('all')} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                )}
                {filterStatus !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {filterStatus}
                    <button onClick={() => setFilterStatus('all')} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    Busca: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setFilterSeverity('all')
                    setFilterStatus('all')
                    setSearchQuery('')
                  }}
                >
                  Limpar todos
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredAlertas.length} {filteredAlertas.length === 1 ? 'alerta' : 'alertas'} encontrados
        </p>
      </div>

      {/* Alerts List */}
      {dataLoading && alertas.length === 0 ? (
        <SkeletonList count={5} />
      ) : filteredAlertas.length === 0 ? (
        <Card variant="premium" className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || filterSeverity !== 'all' || filterStatus !== 'all'
              ? "Tente ajustar os filtros de busca"
              : "Não há alertas no momento"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlertas.map((alerta, index) => (
            <AlertCard
              key={alerta.id}
              alert={alerta}
              index={index}
              onResolve={handleResolve}
              onEdit={(a) => { setSelectedAlertForEdit(a); setIsEditModalOpen(true) }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditAlertModal
        alert={selectedAlertForEdit}
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedAlertForEdit(null) }}
        onSave={async () => { setIsEditModalOpen(false); setSelectedAlertForEdit(null); await loadAlertas() }}
      />
    </div>
  )
}
