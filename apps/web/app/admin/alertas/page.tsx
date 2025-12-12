"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  CheckCircle,
  User,
  Download,
  Trash2
} from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { motion } from "framer-motion"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useGlobalSync } from "@/hooks/use-global-sync"
import { Edit } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { SkeletonList } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"

// Lazy load modal pesado
const EditAlertModal = dynamic(
  () => import("@/components/modals/edit-alert-modal").then(m => ({ default: m.EditAlertModal })),
  { ssr: false, loading: () => null }
)

// ALERT_TYPES removido - não utilizado

export default function AlertasPage() {
  const { user, loading: authLoading } = useAuthFast()
  const [dataLoading, setDataLoading] = useState(true)
  const [alertas, setAlertas] = useState<Array<{
    id: string;
    message?: string;
    description?: string;
    type?: string;
    vehicle_plate?: string;
    route_name?: string;
    severity?: string;
    status?: string;
    created_at: string;
    companies?: { name: string };
    routes?: { name: string };
    vehicles?: { plate: string };
    drivers?: { name?: string; email: string };
  }>>([])
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [tempFilterType, setTempFilterType] = useState<string>("all")
  const [tempFilterSeverity, setTempFilterSeverity] = useState<string>("all")
  const [tempFilterStatus, setTempFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedAlertForEdit, setSelectedAlertForEdit] = useState<typeof alertas[0] | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleSaveFilters = () => {
    setFilterType(tempFilterType)
    setFilterSeverity(tempFilterSeverity)
    setFilterStatus(tempFilterStatus)
    setFiltersExpanded(false)
  }

  const handleResetFilters = () => {
    setTempFilterType("all")
    setTempFilterSeverity("all")
    setTempFilterStatus("all")
    setFilterType("all")
    setFilterSeverity("all")
    setFilterStatus("all")
    setFiltersExpanded(false)
  }

  useEffect(() => {
    if (user && !authLoading) {
      loadAlertas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, filterSeverity, filterStatus])

  // Escutar eventos de sincronização global (apenas após carregamento inicial)
  useGlobalSync(
    ['alert.created', 'alert.updated', 'route.created', 'route.updated', 'vehicle.created', 'vehicle.updated'],
    () => {
      // Recarregar alertas quando houver mudanças (apenas se não estiver carregando)
      if (!dataLoading && user && !authLoading) {
        loadAlertas()
      }
    },
    [dataLoading, user, authLoading]
  )

  const loadAlertas = useCallback(async () => {
    try {
      setDataLoading(true)
      // Usar API route para bypass RLS
      const params = new URLSearchParams()
      if (filterSeverity !== "all") {
        params.append('severity', filterSeverity)
      }
      if (filterStatus !== "all") {
        params.append('status', filterStatus)
      }

      const response = await fetch(`/api/admin/alerts-list?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        setAlertas(result.alerts || [])
      } else {
        throw new Error(result.error || 'Erro ao carregar alertas')
      }
    } catch (error) {
      console.error("Erro ao carregar alertas:", error)
      notifyError(error, 'Erro inesperado')
      setAlertas([])
    } finally {
      setDataLoading(false)
    }
  }, [filterSeverity, filterStatus])

  // Memoizar alertas filtrados
  const filteredAlertas = useMemo(() => {
    let filtered = alertas
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.message?.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query) ||
        a.type?.toLowerCase().includes(query) ||
        a.vehicle_plate?.toLowerCase().includes(query) ||
        a.route_name?.toLowerCase().includes(query) ||
        a.companies?.name?.toLowerCase().includes(query)
      )
    }
    return filtered
  }, [alertas, debouncedSearchQuery])

  const handleDeleteAlerta = async (alertaId: string) => {
    if (!confirm('Tem certeza que deseja excluir este alerta? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/alerts/delete?id=${alertaId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Erro ao excluir alerta'
        const errorDetails = result.details ? ` (${result.details})` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      if (result.success) {
        notifySuccess('Alerta excluído com sucesso')
        await new Promise(resolve => setTimeout(resolve, 300))
        await loadAlertas()
      } else {
        throw new Error(result.error || 'Erro ao excluir alerta')
      }
    } catch (err) {
      console.error('Erro ao excluir alerta:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir alerta'
      notifyError(err, errorMessage)
    }
  }

  const handleResolve = async (alertaId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const response = await fetch('/api/admin/alerts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alertaId,
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: session.user.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao resolver alerta')
      }

      notifySuccess('', { i18n: { ns: 'common', key: 'success.alertResolved' } })
      loadAlertas()
    } catch (err) {
      notifyError(err, 'Erro ao resolver alerta')
    }
  }

  const handleAssign = async (alertaId: string, userId: string) => {
    try {
      const response = await fetch('/api/admin/alerts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alertaId,
          assigned_to: userId,
          status: 'assigned' // Opcional: mudar status para assigned automaticamente
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atribuir alerta')
      }

      notifySuccess('', { i18n: { ns: 'common', key: 'success.alertAssigned' } })
      loadAlertas()
    } catch (err) {
      notifyError(err, 'Erro ao atribuir alerta')
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/reports/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportKey: 'incidents',
          format: 'csv',
          filters: {}
        })
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

      notifySuccess('', { i18n: { ns: 'common', key: 'success.exportCsv' } })
    } catch {
      notifyError('Erro ao exportar', undefined, { i18n: { ns: 'common', key: 'errors.export' } })
    }
  }

  if (authLoading || !user) {
    return (
      <AppShell user={{ id: "", name: "Admin", email: "", role: "admin" }}>
        <SkeletonList count={5} />
      </AppShell>
    )
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">Alertas</h1>
            <p className="text-sm sm:text-base text-[var(--ink-muted)] break-words">Monitoramento e gestão de alertas do sistema</p>
          </div>
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto flex-shrink-0 min-h-[44px] touch-manipulation">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Filtros */}
        <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-[var(--border)]">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2 min-w-0">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--brand)] flex-shrink-0" />
                <CardTitle className="text-base sm:text-lg font-semibold break-words">Filtros</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
              >
                {filtersExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Minimizar</span>
                    <span className="sm:hidden">Fechar</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Expandir</span>
                    <span className="sm:hidden">Abrir</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {filtersExpanded && (
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                <div className="relative w-full sm:flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)] pointer-events-none" />
                  <Input
                    placeholder="Buscar alertas..."
                    className="pl-10 w-full min-h-[44px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm w-full sm:w-auto min-h-[44px] touch-manipulation"
                  value={tempFilterSeverity}
                  onChange={(e) => setTempFilterSeverity(e.target.value)}
                >
                  <option value="all">Todas Severidades</option>
                  <option value="critical">Crítico</option>
                  <option value="warning">Aviso</option>
                  <option value="info">Info</option>
                </select>
                <select
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm w-full sm:w-auto min-h-[44px] touch-manipulation"
                  value={tempFilterStatus}
                  onChange={(e) => setTempFilterStatus(e.target.value)}
                >
                  <option value="all">Todos Status</option>
                  <option value="open">Aberto</option>
                  <option value="assigned">Atribuído</option>
                  <option value="resolved">Resolvido</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2 pt-4 border-t border-[var(--border)]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveFilters}
                  className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                >
                  <Save className="h-4 w-4" />
                  Salvar Filtros
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Lista de Alertas */}
        <div className="grid gap-3 sm:gap-4 w-full">
          {filteredAlertas.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
              <p className="text-sm text-[var(--ink-muted)]">
                {searchQuery ? "Tente ajustar sua busca" : "Não há alertas no momento"}
              </p>
            </Card>
          ) : (
            filteredAlertas.map((alerta, index) => (
              <motion.div
                key={alerta.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card className="p-3 sm:p-4 hover:shadow-xl transition-all duration-300 overflow-hidden bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--brand)]/30">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${alerta.severity === 'critical' ? 'bg-red-100' :
                          alerta.severity === 'warning' ? 'bg-orange-100' :
                            'bg-blue-100'
                        }`}>
                        <AlertTriangle
                          className={`h-4 w-4 ${alerta.severity === 'critical' ? 'text-red-500' :
                              alerta.severity === 'warning' ? 'text-orange-500' :
                                'text-blue-500'
                            }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge
                            variant={
                              alerta.severity === 'critical' ? 'destructive' :
                                alerta.severity === 'warning' ? 'default' :
                                  'secondary'
                            }
                            className="text-xs"
                          >
                            {alerta.severity}
                          </Badge>
                          <Badge variant={alerta.status === 'resolved' ? 'secondary' : 'outline'} className="text-xs">
                            {alerta.status === 'open' ? 'Aberto' :
                              alerta.status === 'assigned' ? 'Atribuído' :
                                'Resolvido'}
                          </Badge>
                          <span className="text-xs sm:text-sm text-[var(--ink-muted)] break-words">
                            {new Date(alerta.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="font-medium mb-2 break-words text-sm sm:text-base">{alerta.description}</p>
                        <div className="space-y-1 text-xs text-[var(--ink-muted)]">
                          {alerta.companies && (
                            <p className="break-words">🏢 Empresa: {alerta.companies.name}</p>
                          )}
                          {alerta.routes && (
                            <p className="break-words">🚌 Rota: {alerta.routes.name}</p>
                          )}
                          {alerta.vehicles && (
                            <p className="break-words">🚛 Veículo: {alerta.vehicles.plate}</p>
                          )}
                          {alerta.drivers && (
                            <p className="break-words">👤 Motorista: {alerta.drivers.name || alerta.drivers.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAlertForEdit(alerta)
                          setIsEditModalOpen(true)
                        }}
                        className="text-xs sm:text-sm min-h-[44px] touch-manipulation"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="truncate">Editar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAlerta(alerta.id)}
                        className="text-xs sm:text-sm min-h-[44px] touch-manipulation"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="truncate">Excluir</span>
                      </Button>
                      {alerta.status !== 'resolved' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolve(alerta.id)}
                            className="col-span-2 sm:col-span-1 text-xs sm:text-sm min-h-[44px] touch-manipulation"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="truncate">Resolver</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const { data: { session } } = await supabase.auth.getSession()
                              if (session) {
                                await handleAssign(alerta.id, session.user.id)
                              }
                            }}
                            className="col-span-2 sm:col-span-1 text-xs sm:text-sm min-h-[44px] touch-manipulation"
                          >
                            <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="truncate">Atribuir</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Modal Editar Alerta */}
        <EditAlertModal
          alert={selectedAlertForEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedAlertForEdit(null)
          }}
          onSave={async () => {
            setIsEditModalOpen(false)
            setSelectedAlertForEdit(null)
            await loadAlertas()
          }}
        />
      </div>
    </AppShell>
  )
}
