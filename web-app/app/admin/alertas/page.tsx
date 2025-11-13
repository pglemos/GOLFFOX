"use client"

import { useEffect, useState } from "react"
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
  XCircle,
  Trash2
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { notifySuccess, notifyError } from "@/lib/toast"
import { motion } from "framer-motion"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useGlobalSync } from "@/hooks/use-global-sync"

const ALERT_TYPES = {
  route_delayed: { label: 'Rota Atrasada', severity: 'warning' },
  bus_stopped: { label: 'Ônibus Parado', severity: 'critical' },
  route_deviation: { label: 'Desvio de Rota', severity: 'warning' },
  incident: { label: 'Incidente', severity: 'critical' },
  checklist_fail: { label: 'Checklist Falhou', severity: 'warning' }
}

export default function AlertasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthFast()
  const [dataLoading, setDataLoading] = useState(true)
  const [alertas, setAlertas] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [tempFilterType, setTempFilterType] = useState<string>("all")
  const [tempFilterSeverity, setTempFilterSeverity] = useState<string>("all")
  const [tempFilterStatus, setTempFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

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

  const loadAlertas = async () => {
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
  }

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
    } catch (error: any) {
      console.error('Erro ao excluir alerta:', error)
      const errorMessage = error.message || 'Erro desconhecido ao excluir alerta'
      notifyError(error, errorMessage)
    }
  }

  const handleResolve = async (alertaId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { error } = await supabase
        .from("gf_incidents")
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: session.user.id
        })
        .eq("id", alertaId)

      if (error) throw error

      // Log de auditoria
      await supabase.from('gf_audit_log').insert({
        actor_id: session.user.id,
        action_type: 'resolve',
        resource_type: 'incident',
        resource_id: alertaId,
        details: { severity: 'resolved' }
      })

      notifySuccess('', { i18n: { ns: 'common', key: 'success.alertResolved' } })
      loadAlertas()
    } catch (error: any) {
      notifyError(error, 'Erro inesperado')
    }
  }

  const handleAssign = async (alertaId: string, userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { error } = await supabase
        .from("gf_incidents")
        .update({ assigned_to: userId })
        .eq("id", alertaId)

      if (error) throw error

      notifySuccess('', { i18n: { ns: 'common', key: 'success.alertAssigned' } })
      loadAlertas()
    } catch (error: any) {
      notifyError(error, 'Erro inesperado')
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
    } catch (error: any) {
      notifyError('Erro ao exportar', undefined, { i18n: { ns: 'common', key: 'errors.export' } })
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  const filteredAlertas = alertas.filter(alerta => {
    if (searchQuery && !alerta.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Alertas</h1>
            <p className="text-[var(--ink-muted)]">Monitoramento e gestão de alertas do sistema</p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-[var(--brand)]" />
                <CardTitle className="text-lg">Filtros</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="gap-2"
              >
                {filtersExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Minimizar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Expandir
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {filtersExpanded && (
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
                  <Input 
                    placeholder="Buscar alertas..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
                  value={tempFilterSeverity}
                  onChange={(e) => setTempFilterSeverity(e.target.value)}
                >
                  <option value="all">Todas Severidades</option>
                  <option value="critical">Crítico</option>
                  <option value="warning">Aviso</option>
                  <option value="info">Info</option>
                </select>
                <select 
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
                  value={tempFilterStatus}
                  onChange={(e) => setTempFilterStatus(e.target.value)}
                >
                  <option value="all">Todos Status</option>
                  <option value="open">Aberto</option>
                  <option value="assigned">Atribuído</option>
                  <option value="resolved">Resolvido</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveFilters}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar Filtros
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Lista de Alertas */}
        <div className="grid gap-4">
          {filteredAlertas.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
              <p className="text-sm text-[var(--ink-muted)]">
                {searchQuery ? "Tente ajustar sua busca" : "Não há alertas no momento"}
              </p>
            </Card>
          ) : (
            filteredAlertas.map((alerta) => (
              <motion.div
                key={alerta.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <AlertTriangle 
                        className={`h-5 w-5 mt-1 ${
                          alerta.severity === 'critical' ? 'text-red-500' : 
                          alerta.severity === 'warning' ? 'text-orange-500' : 
                          'text-blue-500'
                        }`} 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={
                              alerta.severity === 'critical' ? 'destructive' : 
                              alerta.severity === 'warning' ? 'default' : 
                              'secondary'
                            }
                          >
                            {alerta.severity}
                          </Badge>
                          <Badge variant={alerta.status === 'resolved' ? 'secondary' : 'outline'}>
                            {alerta.status === 'open' ? 'Aberto' : 
                             alerta.status === 'assigned' ? 'Atribuído' : 
                             'Resolvido'}
                          </Badge>
                          <span className="text-sm text-[var(--ink-muted)]">
                            {new Date(alerta.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="font-medium mb-2">{alerta.description}</p>
                        <div className="space-y-1 text-xs text-[var(--ink-muted)]">
                          {alerta.companies && (
                            <p>🏢 Empresa: {alerta.companies.name}</p>
                          )}
                          {alerta.routes && (
                            <p>🚌 Rota: {alerta.routes.name}</p>
                          )}
                          {alerta.vehicles && (
                            <p>🚛 Veículo: {alerta.vehicles.plate}</p>
                          )}
                          {alerta.drivers && (
                            <p>👤 Motorista: {alerta.drivers.name || alerta.drivers.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAlerta(alerta.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                      {alerta.status !== 'resolved' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResolve(alerta.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolver
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
                          >
                            <User className="h-4 w-4 mr-2" />
                            Atribuir
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
      </div>
    </AppShell>
  )
}
