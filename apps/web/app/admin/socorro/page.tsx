"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LifeBuoy, Send, Plus, Search, Clock, AlertCircle, Filter, ChevronDown, ChevronUp, Save, X, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { AssistanceModal } from "@/components/modals/assistance-modal"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { notifySuccess, notifyError } from "@/lib/toast"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { EditAssistanceModal } from "@/components/modals/edit-assistance-modal"
import { Edit } from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function SocorroPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthFast()
  const [dataLoading, setDataLoading] = useState(true)
  const [ocorrencias, setOcorrencias] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [tempFilterStatus, setTempFilterStatus] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedRequestForEdit, setSelectedRequestForEdit] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Estados para o formulário de despacho
  const [routesWithProblems, setRoutesWithProblems] = useState<any[]>([])
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState<string>("")
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [dispatching, setDispatching] = useState(false)
  const [loadingResources, setLoadingResources] = useState(false)

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
      setLoadingResources(true)
      
      // Carregar rotas com problemas
      const routesResponse = await fetch('/api/admin/emergency/routes-with-problems')
      const routesResult = await routesResponse.json()
      if (routesResult.success) {
        setRoutesWithProblems(routesResult.routes || [])
      }

      // Carregar motoristas disponíveis
      const driversResponse = await fetch('/api/admin/emergency/available-drivers')
      const driversResult = await driversResponse.json()
      if (driversResult.success) {
        setAvailableDrivers(driversResult.drivers || [])
      }

      // Carregar veículos disponíveis
      const vehiclesResponse = await fetch('/api/admin/emergency/available-vehicles')
      const vehiclesResult = await vehiclesResponse.json()
      if (vehiclesResult.success) {
        setAvailableVehicles(vehiclesResult.vehicles || [])
      }
    } catch (error) {
      console.error('Erro ao carregar recursos de emergência:', error)
    } finally {
      setLoadingResources(false)
    }
  }

  const handleDispatchEmergency = async () => {
    if (!selectedRouteId || !selectedDriverId || !selectedVehicleId) {
      notifyError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setDispatching(true)
    try {
      const response = await fetch('/api/admin/emergency/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          routeId: selectedRouteId,
          driverId: selectedDriverId,
          vehicleId: selectedVehicleId
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao despachar socorro')
      }

      notifySuccess('Socorro despachado com sucesso!')
      
      // Limpar formulário
      setSelectedRouteId("")
      setSelectedDriverId("")
      setSelectedVehicleId("")
      
      // Recarregar recursos e ocorrências
      await loadEmergencyResources()
      await loadOcorrencias()
    } catch (error: any) {
      console.error('Erro ao despachar socorro:', error)
      notifyError(error.message || 'Erro ao despachar socorro')
    } finally {
      setDispatching(false)
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
      console.error("Erro ao carregar ocorrências:", error)
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
      console.error('Erro ao excluir solicitação de socorro:', error)
      const errorMessage = error.message || 'Erro desconhecido ao excluir solicitação de socorro'
      notifyError(error, errorMessage)
    }
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <LifeBuoy className="h-8 w-8 text-[var(--error)]" />
              Despacho de Socorro
            </h1>
            <p className="text-[var(--ink-muted)]">Utilize este painel para enviar um motorista e veículo de socorro para uma rota que apresentou problemas.</p>
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
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* 1. Selecione a Rota com Problema */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <span className="bg-[var(--brand)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  Selecione a Rota com Problema
                </Label>
                <Select 
                  value={selectedRouteId} 
                  onValueChange={setSelectedRouteId}
                  disabled={loadingResources}
                >
                  <SelectTrigger className={`h-12 text-base ${!selectedRouteId ? 'border-red-300' : ''}`}>
                    <SelectValue placeholder="Selecione uma rota com problema" />
                  </SelectTrigger>
                  <SelectContent>
                    {routesWithProblems.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {loadingResources ? 'Carregando rotas...' : 'Nenhuma rota com problema encontrada'}
                      </SelectItem>
                    ) : (
                      routesWithProblems.map((route) => (
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
                  <span className="bg-[var(--brand)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                  Escolha o Motorista de Socorro
                </Label>
                <Select 
                  value={selectedDriverId} 
                  onValueChange={setSelectedDriverId}
                  disabled={loadingResources}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Selecione um motorista de socorro" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {loadingResources ? 'Carregando motoristas...' : 'Nenhum motorista disponível'}
                      </SelectItem>
                    ) : (
                      availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.displayName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Escolha o Veículo de Socorro */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <span className="bg-[var(--brand)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  Escolha o Veículo de Socorro
                </Label>
                <Select 
                  value={selectedVehicleId} 
                  onValueChange={setSelectedVehicleId}
                  disabled={loadingResources}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Selecione um veículo de socorro" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {loadingResources ? 'Carregando veículos...' : 'Nenhum veículo disponível'}
                      </SelectItem>
                    ) : (
                      availableVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.displayName}
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
                  disabled={dispatching || !selectedRouteId || !selectedDriverId || !selectedVehicleId || loadingResources}
                  className="w-full bg-[var(--error)] hover:bg-[var(--error)]/90 h-12 text-base font-semibold"
                  size="lg"
                >
                  <Send className="h-5 w-5 mr-2" />
                  {dispatching ? 'Despachando...' : 'Despachar Socorro Agora'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Separador */}
        <div className="border-t border-[var(--border)] pt-6">
          <h2 className="text-2xl font-bold mb-4">Ocorrências de Socorro</h2>
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
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar ocorrências..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
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

        <div className="grid gap-4">
          {ocorrencias
            .filter(occ => 
              searchQuery === "" || 
              occ.request_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              occ.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              occ.address?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((ocorrencia) => (
            <motion.div
              key={ocorrencia.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <LifeBuoy className="h-5 w-5 text-[var(--error)]" />
                      <h3 className="font-bold text-lg capitalize">{ocorrencia.request_type}</h3>
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
                      <p className="text-sm text-[var(--ink-muted)] mb-2">{ocorrencia.description}</p>
                    )}
                    <div className="space-y-1 text-xs text-[var(--ink-muted)]">
                      {ocorrencia.address && (
                        <p>📍 {ocorrencia.address}</p>
                      )}
                      {ocorrencia.routes && (
                        <p>🚌 Rota: {ocorrencia.routes.name || ocorrencia.route_id}</p>
                      )}
                      {ocorrencia.drivers && (
                        <p>
                          👤 Motorista: {(
                            ocorrencia.drivers.email?.split("@")[0] || ocorrencia.dispatched_driver_id
                          )}
                        </p>
                      )}
                      {ocorrencia.vehicles && (
                        <p>🚛 Veículo: {ocorrencia.vehicles.plate}</p>
                      )}
                      <p>🕐 {new Date(ocorrencia.created_at).toLocaleString('pt-BR')}</p>
                      {ocorrencia.status === 'open' && ocorrencia.created_at && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <span className="text-xs text-orange-600 font-medium">
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
                              await supabase.from('gf_incidents').insert({
                                company_id: ocorrencia.company_id || null,
                                route_id: ocorrencia.route_id || null,
                                vehicle_id: ocorrencia.vehicle_id || null,
                                driver_id: ocorrencia.driver_id || null,
                                severity: 'critical',
                                status: 'open',
                                description: `Ocorrência de socorro: ${ocorrencia.request_type} - ${ocorrencia.description || ''}`
                              })
                            }
                          } catch (error) {
                            console.error('Erro ao criar alerta:', error)
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
              <LifeBuoy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma ocorrência encontrada</h3>
              <p className="text-sm text-[var(--ink-muted)]">
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


