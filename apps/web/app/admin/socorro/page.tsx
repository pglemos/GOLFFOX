"use client"

import { useEffect, useState } from "react"

import { motion } from "framer-motion"
import { LifeBuoy, Send, Plus, Search, Clock, AlertCircle, Filter, ChevronDown, ChevronUp, Save, X, Trash2 } from "lucide-react"
import { Edit } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { AssistanceModal } from "@/components/modals/assistance-modal"
import { EditAssistanceModal } from "@/components/modals/edit-assistance-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDispatchFormReducer } from "@/hooks/reducers/form-reducer"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "@/lib/next-navigation"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { logError } from "@/lib/logger"
import type { Database } from "@/types/supabase"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type AssistanceRequest = Database['public']['Tables']['gf_assistance_requests']['Row']
type AlertInsert = Database['public']['Tables']['gf_alerts']['Insert']

export default function SocorroPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [dataLoading, setDataLoading] = useState(true)
  const [ocorrencias, setOcorrencias] = useState<AssistanceRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<AssistanceRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [tempFilterStatus, setTempFilterStatus] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedRequestForEdit, setSelectedRequestForEdit] = useState<AssistanceRequest | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Estados para o formulário de despacho
  const [dispatchFormState, dispatchFormDispatch] = useDispatchFormReducer()

  const handleSaveFilters = () => {
    setFilterStatus(tempFilterStatus)
    setFiltersExpanded(false)
  }

  const handleResetFilters = () => {
    setTempFilterStatus("all")
    setFilterStatus("all")
    setFiltersExpanded(false)
  }

  useEffect(() => {
    if (user && !authLoading) {
      loadOcorrencias()
      loadEmergencyResources()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, filterStatus])

  const loadEmergencyResources = async () => {
    try {
      dispatchFormDispatch({ type: 'SET_LOADING_RESOURCES', payload: true })

      // Carregar rotas com problemas
      const routesResponse = await fetch('/api/admin/emergency/routes-with-problems')
      const routesResult = await routesResponse.json()
      if (routesResult.success) {
        dispatchFormDispatch({ type: 'SET_ROUTES', payload: routesResult.routes || [] })
      }

      // Carregar motoristas disponíveis
      const driversResponse = await fetch('/api/admin/emergency/available-drivers')
      const driversResult = await driversResponse.json()
      if (driversResult.success) {
        dispatchFormDispatch({ type: 'SET_DRIVERS', payload: driversResult.drivers || [] })
      }

      // Carregar veículos disponíveis
      const vehiclesResponse = await fetch('/api/admin/emergency/available-vehicles')
      const vehiclesResult = await vehiclesResponse.json()
      if (vehiclesResult.success) {
        dispatchFormDispatch({ type: 'SET_VEHICLES', payload: vehiclesResult.vehicles || [] })
      }
    } catch (error) {
      logError('Erro ao carregar recursos de emergência', { error }, 'SocorroPage')
    } finally {
      dispatchFormDispatch({ type: 'SET_LOADING_RESOURCES', payload: false })
    }
  }

  const handleDispatchEmergency = async () => {
    if (!dispatchFormState.selections.routeId || !dispatchFormState.selections.driverId || !dispatchFormState.selections.vehicleId) {
      notifyError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    dispatchFormDispatch({ type: 'SET_DISPATCHING', payload: true })
    try {
      const response = await fetch('/api/admin/emergency/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          routeId: dispatchFormState.selections.routeId,
          driverId: dispatchFormState.selections.driverId,
          vehicleId: dispatchFormState.selections.vehicleId
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao despachar socorro')
      }

      notifySuccess('Socorro despachado com sucesso!')

      // Limpar formulário
      dispatchFormDispatch({ type: 'RESET_SELECTIONS' })

      // Recarregar recursos e ocorrências
      await loadEmergencyResources()
      await loadOcorrencias()
    } catch (error: any) {
      logError('Erro ao despachar socorro', { error }, 'SocorroPage')
      notifyError(error.message || 'Erro ao despachar socorro')
    } finally {
      dispatchFormDispatch({ type: 'SET_DISPATCHING', payload: false })
    }
  }

  const loadOcorrencias = async () => {
    try {
      setDataLoading(true)
      // Usar API route para bypass RLS
      const params = new URLSearchParams()
      if (filterStatus !== "all") {
        params.append('status', filterStatus)
      }

      const response = await fetch(`/api/admin/assistance-requests-list?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        setOcorrencias(result.requests || [])
      } else {
        throw new Error(result.error || 'Erro ao carregar ocorrências')
      }
    } catch (error) {
      logError("Erro ao carregar ocorrências", { error }, 'SocorroPage')
      setOcorrencias([])
    } finally {
      setDataLoading(false)
    }
  }

  const handleDeleteOcorrencia = async (ocorrenciaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação de socorro? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/assistance-requests/delete?id=${ocorrenciaId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Erro ao excluir solicitação de socorro'
        const errorDetails = result.details ? ` (${result.details})` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      if (result.success) {
        notifySuccess('Solicitação de socorro excluída com sucesso')
        await new Promise(resolve => setTimeout(resolve, 300))
        await loadOcorrencias()
      } else {
        throw new Error(result.error || 'Erro ao excluir solicitação de socorro')
      }
    } catch (error: any) {
      logError('Erro ao excluir solicitação de socorro', { error }, 'SocorroPage')
      const errorMessage = error.message || 'Erro desconhecido ao excluir solicitação de socorro'
      notifyError(error, errorMessage)
    }
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <LifeBuoy className="h-8 w-8 text-text-error" />
              Despacho de Socorro
            </h1>
            <p className="text-ink-muted">Utilize este painel para enviar um motorista e veículo de socorro para uma rota que apresentou problemas.</p>
          </div>
          <Button onClick={() => {
            setSelectedRequest(null)
            setIsModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ocorrência
          </Button>
        </div>

        {/* Formulário de Despacho de Socorro */}
        <Card variant="premium">
          <CardContent className="p-3">
            <div className="space-y-6">
              {/* 1. Selecione a Rota com Problema */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <span className="bg-text-brand text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  Selecione a Rota com Problema
                </Label>
                <Select
                  value={dispatchFormState.selections.routeId}
                  onValueChange={(value) => dispatchFormDispatch({ type: 'SET_ROUTE_ID', payload: value })}
                  disabled={dispatchFormState.loading.loadingResources}
                >
                  <SelectTrigger className={`min-h-[48px] text-base ${!dispatchFormState.selections.routeId ? 'border-error-light' : ''}`}>
                    <SelectValue placeholder="Selecione uma rota com problema" />
                  </SelectTrigger>
                  <SelectContent>
                    {dispatchFormState.resources.routes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {dispatchFormState.loading.loadingResources ? 'Carregando rotas...' : 'Nenhuma rota com problema encontrada'}
                      </SelectItem>
                    ) : (
                      dispatchFormState.resources.routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.displayName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Escolha o Motorista de Socorro */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <span className="bg-text-brand text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                  Escolha o Motorista de Socorro
                </Label>
                <Select
                  value={dispatchFormState.selections.driverId}
                  onValueChange={(value) => dispatchFormDispatch({ type: 'SET_DRIVER_ID', payload: value })}
                  disabled={dispatchFormState.loading.loadingResources}
                >
                  <SelectTrigger className="min-h-[48px] text-base">
                    <SelectValue placeholder="Selecione um motorista de socorro" />
                  </SelectTrigger>
                  <SelectContent>
                    {dispatchFormState.resources.drivers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {dispatchFormState.loading.loadingResources ? 'Carregando motoristas...' : 'Nenhum motorista disponível'}
                      </SelectItem>
                    ) : (
                      dispatchFormState.resources.drivers.map((motorista) => (
                        <SelectItem key={motorista.id} value={motorista.id}>
                          {motorista.displayName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Escolha o Veículo de Socorro */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <span className="bg-text-brand text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  Escolha o Veículo de Socorro
                </Label>
                <Select
                  value={dispatchFormState.selections.vehicleId}
                  onValueChange={(value) => dispatchFormDispatch({ type: 'SET_VEHICLE_ID', payload: value })}
                  disabled={dispatchFormState.loading.loadingResources}
                >
                  <SelectTrigger className="min-h-[48px] text-base">
                    <SelectValue placeholder="Selecione um veículo de socorro" />
                  </SelectTrigger>
                  <SelectContent>
                    {dispatchFormState.resources.vehicles.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {dispatchFormState.loading.loadingResources ? 'Carregando veículos...' : 'Nenhum veículo disponível'}
                      </SelectItem>
                    ) : (
                      dispatchFormState.resources.vehicles.map((veiculo) => (
                        <SelectItem key={veiculo.id} value={veiculo.id}>
                          {veiculo.displayName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Botão de Despacho */}
              <div className="pt-4">
                <Button
                  onClick={handleDispatchEmergency}
                  disabled={dispatchFormState.loading.dispatching || !dispatchFormState.selections.routeId || !dispatchFormState.selections.driverId || !dispatchFormState.selections.vehicleId || dispatchFormState.loading.loadingResources}
                  className="w-full bg-text-error hover:bg-text-error/90 text-base font-semibold"
                  size="lg"
                >
                  <Send className="h-5 w-5 mr-2" />
                  {dispatchFormState.loading.dispatching ? 'Despachando...' : 'Despachar Socorro Agora'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Separador */}
        <div className="border-t border-white/10 pt-3">
          <h2 className="text-2xl font-bold mb-4">Ocorrências de Socorro</h2>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-brand" />
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
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
                  <Input
                    placeholder="Buscar ocorrências..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  className="min-h-[48px] px-4 py-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={tempFilterStatus}
                  onChange={(e) => setTempFilterStatus(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="open">Abertas</option>
                  <option value="dispatched">Despachadas</option>
                  <option value="resolved">Resolvidas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
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

        <div className="grid gap-4">
          {ocorrencias
            .filter(occ =>
              searchQuery === "" ||
              occ.request_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              occ.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              occ.address?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((ocorrencia, index) => (
              <motion.div
                key={ocorrencia.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card variant="premium" className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-error-light">
                          <LifeBuoy className="h-4 w-4 text-text-error" />
                        </div>
                        <h3 className="font-bold text-lg capitalize group-hover:text-text-error transition-colors">{ocorrencia.request_type}</h3>
                        <Badge
                          variant={
                            ocorrencia.status === 'open' ? 'destructive' :
                              ocorrencia.status === 'dispatched' ? 'default' :
                                ocorrencia.status === 'resolved' ? 'secondary' : 'outline'
                          }
                        >
                          {ocorrencia.status === 'open' ? 'Aberta' :
                            ocorrencia.status === 'dispatched' ? 'Despachada' :
                              ocorrencia.status === 'resolved' ? 'Resolvida' : 'Cancelada'}
                        </Badge>
                      </div>
                      {ocorrencia.description && (
                        <p className="text-sm text-ink-muted mb-2">{ocorrencia.description}</p>
                      )}
                      <div className="space-y-1 text-xs text-ink-muted">
                        {ocorrencia.address && (
                          <p>📍 {ocorrencia.address}</p>
                        )}
                        {ocorrencia.routes && (
                          <p>🚌 Rota: {ocorrencia.routes.name || ocorrencia.route_id}</p>
                        )}
                        {ocorrencia.motoristas && (
                          <p>
                            👤 Motorista: {(
                              ocorrencia.motoristas.email?.split("@")[0] || ocorrencia.dispatched_driver_id
                            )}
                          </p>
                        )}
                        {ocorrencia.veiculos && (
                          <p>🚛 Veículo: {ocorrencia.veiculos.plate}</p>
                        )}
                        <p>🕐 {new Date(ocorrencia.created_at).toLocaleString('pt-BR')}</p>
                        {ocorrencia.status === 'open' && ocorrencia.created_at && (
                          <div className="flex items-center gap-1 mt-2">
                            <Clock className="h-3 w-3 text-brand" />
                            <span className="text-xs text-brand font-medium">
                              Tempo de resposta: {(() => {
                                const minutes = Math.floor((Date.now() - new Date(ocorrencia.created_at).getTime()) / (1000 * 60))
                                return `${minutes}min`
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequestForEdit(ocorrencia)
                          setIsEditModalOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteOcorrencia(ocorrencia.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                      {ocorrencia.status === 'open' && (
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            setSelectedRequest(ocorrencia)
                            setIsModalOpen(true)

                            // Criar alerta crítico
                            try {
                              const { data: { session } } = await supabase.auth.getSession()
                              if (session) {
                                const alertData: AlertInsert = {
                                  empresa_id: ocorrencia.empresa_id || null,
                                  rota_id: ocorrencia.rota_id || null,
                                  veiculo_id: ocorrencia.veiculo_id || null,
                                  motorista_id: ocorrencia.motorista_id || null,
                                  severity: 'critical',
                                  status: 'open',
                                  message: `Ocorrência de socorro: ${ocorrencia.request_type} - ${ocorrencia.description || ''}`,
                                  type: 'assistance_request'
                                }
                                await supabase.from('gf_alerts').insert(alertData)
                              }
                            } catch (error) {
                              logError('Erro ao criar alerta', { error }, 'SocorroPage')
                            }
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Despachar
                        </Button>
                      )}
                      {ocorrencia.status === 'dispatched' && (
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('gf_assistance_requests')
                                .update({ status: 'resolved', resolved_at: new Date().toISOString() })
                                .eq('id', ocorrencia.id)

                              if (error) throw error

                              // Calcular SLA
                              const responseTime = new Date(ocorrencia.dispatched_at || Date.now()).getTime() - new Date(ocorrencia.created_at).getTime()
                              const resolutionTime = Date.now() - new Date(ocorrencia.created_at).getTime()

                              notifySuccess('', { i18n: { ns: 'common', key: 'success.assistanceResolvedSLA', params: { response: Math.floor(responseTime / 60000), total: Math.floor(resolutionTime / 60000) } } })
                              loadOcorrencias()
                            } catch (error: any) {
                              notifyError(error, `Erro: ${error.message}`, { i18n: { ns: 'common', key: 'errors.assistanceResolve', params: { message: error.message } } })
                            }
                          }}
                        >
                          <LifeBuoy className="h-4 w-4 mr-2" />
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          {ocorrencias.length === 0 && (
            <Card className="p-12 text-center">
              <LifeBuoy className="h-12 w-12 text-ink-light mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma ocorrência encontrada</h3>
              <p className="text-sm text-ink-muted">
                {searchQuery ? "Tente ajustar sua busca" : "Não há ocorrências no momento"}
              </p>
            </Card>
          )}
        </div>

        {/* Modal de Despache */}
        <AssistanceModal
          request={selectedRequest}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedRequest(null)
          }}
          onSave={loadOcorrencias}
        />

        {/* Modal Editar Ocorrência */}
        <EditAssistanceModal
          request={selectedRequestForEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedRequestForEdit(null)
          }}
          onSave={async () => {
            setIsEditModalOpen(false)
            setSelectedRequestForEdit(null)
            await loadOcorrencias()
          }}
        />
      </div>
    </AppShell>
  )
}


