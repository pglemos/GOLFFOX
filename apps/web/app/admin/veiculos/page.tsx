"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Truck, Plus, Search, Wrench, ClipboardCheck, Edit, Trash2, AlertTriangle } from "lucide-react"
import { notifySuccess, notifyError } from "@/lib/toast"
import { formatError } from "@/lib/error-utils"
import { t } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { debug, error as logError } from "@/lib/logger"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useGlobalSync } from "@/hooks/use-global-sync"
import { useDebounce } from "@/hooks/use-debounce"
import { SkeletonList } from "@/components/ui/skeleton"

// Lazy load modais pesados
const VehicleModal = dynamic(
  () => import("@/components/modals/vehicle-modal").then(m => ({ default: m.VehicleModal })),
  { ssr: false, loading: () => null }
)
const VehicleMaintenanceModal = dynamic(
  () => import("@/components/modals/vehicle-maintenance-modal").then(m => ({ default: m.VehicleMaintenanceModal })),
  { ssr: false, loading: () => null }
)
const VehicleChecklistModal = dynamic(
  () => import("@/components/modals/vehicle-checklist-modal").then(m => ({ default: m.VehicleChecklistModal })),
  { ssr: false, loading: () => null }
)
const VehicleDocumentsSection = dynamic(
  () => import("@/components/vehicle/vehicle-documents-section").then(m => ({ default: m.VehicleDocumentsSection })),
  { ssr: false, loading: () => null }
)

export default function VeiculosPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthFast()
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null)
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null)
  const [maintenances, setMaintenances] = useState<any[]>([])
  const [checklists, setChecklists] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string>("dados")
  const [viewingVehicle, setViewingVehicle] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; vehicle: any | null; isDeleting: boolean }>({
    isOpen: false,
    vehicle: null,
    isDeleting: false
  })

  // Carregar dados imediatamente quando usuário estiver disponível
  useEffect(() => {
    if (user && !authLoading) {
      loadVeiculos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  // Memoizar veículos filtrados
  const filteredVeiculos = useMemo(() => {
    if (!debouncedSearchQuery) return veiculos
    const query = debouncedSearchQuery.toLowerCase()
    return veiculos.filter(v =>
      v.plate?.toLowerCase().includes(query) ||
      v.model?.toLowerCase().includes(query) ||
      v.brand?.toLowerCase().includes(query) ||
      v.carrier_name?.toLowerCase().includes(query)
    )
  }, [veiculos, debouncedSearchQuery])

  // Escutar eventos de sincronização global (apenas após carregamento inicial)
  useGlobalSync(
    ['vehicle.created', 'vehicle.updated', 'vehicle.deleted'],
    () => {
      // Recarregar veículos quando houver mudanças (apenas se não estiver carregando)
      if (!dataLoading && user && !authLoading) {
        loadVeiculos()
      }
    },
    [dataLoading, user, authLoading]
  )

  const loadVeiculos = useCallback(async () => {
    try {
      setDataLoading(true)
      // Usar API route para bypass RLS
      const response = await fetch('/api/admin/vehicles-list', { headers: { 'x-test-mode': 'true' } })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (Array.isArray(result)) {
        setVeiculos(result)
      } else if (result && typeof result === 'object') {
        if (result.success && Array.isArray(result.vehicles)) {
          setVeiculos(result.vehicles)
        } else if (Array.isArray(result.data)) {
          setVeiculos(result.data)
        } else {
          throw new Error(result.error || 'Erro ao carregar veículos')
        }
      } else {
        throw new Error('Resposta inválida ao carregar veículos')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      logError("Erro ao carregar veículos", { error: err }, 'VeiculosPage')
      notifyError(err, `Erro ao carregar veículos: ${errorMessage}`, { i18n: { ns: 'common', key: 'errors.loadVehicles', params: { message: errorMessage } } })
      setVeiculos([])
    } finally {
      setDataLoading(false)
    }
  }, [])

  const handleDeleteVeiculo = async (veiculoId: string, veiculoPlate: string) => {
    if (!confirm(`Tem certeza que deseja excluir o veículo "${veiculoPlate}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const snapshot = [...veiculos]
      setVeiculos((prev) => prev.filter((v) => v.id !== veiculoId))
      const response = await fetch(`/api/admin/vehicles/delete?id=${veiculoId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Erro ao excluir veículo'
        const errorDetails = result.details ? ` (${result.details})` : ''
        setVeiculos(snapshot)
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      if (result.success) {
        notifySuccess('Veículo excluído com sucesso')
        void loadVeiculos()
      } else {
        setVeiculos(snapshot)
        throw new Error(result.error || 'Erro ao excluir veículo')
      }
    } catch (error: any) {
      console.error('Erro ao excluir veículo:', error)
      const errorMessage = error.message || 'Erro desconhecido ao excluir veículo'
      notifyError(error, errorMessage)
    }
  }

  const loadMaintenances = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from("gf_vehicle_maintenance")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("due_at", { ascending: false })

      if (error) throw error
      setMaintenances(data || [])
    } catch (error) {
      logError("Erro ao carregar manutenções", { error, vehicleId }, "VeiculosPage")
      setMaintenances([])
    }
  }

  const loadChecklists = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from("gf_vehicle_checklists")
        .select(`
          *,
          drivers:users!gf_vehicle_checklists_driver_id_fkey(id, name, email)
        `)
        .eq("vehicle_id", vehicleId)
        .order("filled_at", { ascending: false })

      if (error) throw error
      setChecklists(data || [])
    } catch (error) {
      logError("Erro ao carregar checklists", { error, vehicleId }, "VeiculosPage")
      setChecklists([])
    }
  }

  const handleViewVehicle = (vehicle: any) => {
    setViewingVehicle(vehicle.id)
    setSelectedVehicle(vehicle)
    setActiveTab("dados")
    loadMaintenances(vehicle.id)
    loadChecklists(vehicle.id)
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }))
    let shouldResetState = true

    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      })

      const payload = await response.json().catch(() => ({} as Record<string, unknown>))

      if (response.ok) {
        const archived = Boolean((payload as { archived?: boolean }).archived)
        const tripsCount = typeof (payload as { tripsCount?: number }).tripsCount === "number" ? (payload as { tripsCount?: number }).tripsCount : undefined
        if (archived) {
          const countMessage = typeof tripsCount === "number" ? `${tripsCount} viagem(ns)` : "viagens"
          notifySuccess(t('common', 'success.vehicleArchivedWithTrips', { count: countMessage }))
        } else {
          notifySuccess(t('common', 'success.vehicleDeleted'))
        }
        await loadVeiculos()
        debug("Veículo removido do catálogo", { vehicleId, archived, tripsCount }, "VeiculosPage")
        setDeleteConfirm({ isOpen: false, vehicle: null, isDeleting: false })
        shouldResetState = false
        return
      }

      if (response.status === 409 && payload && "tripsCount" in payload) {
        const tripsCount = typeof payload.tripsCount === "number" ? payload.tripsCount : undefined
        const countMessage = tripsCount ? `${tripsCount} viagem(ns)` : "viagens"
        notifyError(`Não é possível excluir o veículo: existem ${countMessage} vinculadas.`)
        debug("Tentativa de exclusão de veículo bloqueada por viagens associadas", { vehicleId, tripsCount }, "VeiculosPage")
      } else {
        notifyError("Não foi possível excluir o veículo. Tente novamente mais tarde.")
        logError("Falha ao excluir veículo", { vehicleId, status: response.status, payload }, "VeiculosPage")
      }
    } catch (error: unknown) {
      logError("Erro inesperado ao excluir veículo", { vehicleId, error }, "VeiculosPage")
      notifyError(error, "Erro inesperado ao excluir veículo.", { i18n: { ns: 'common', key: 'errors.generic' } })
    } finally {
      if (shouldResetState) {
        setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }))
      }
    }
  }

  // Renderizar imediatamente, mostrar loading apenas para dados
  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">Veículos</h1>
            <p className="text-sm sm:text-base text-[var(--muted)] break-words">Gerencie a frota de veículos</p>
          </div>
          <Button
            onClick={() => {
              setSelectedVehicle(null)
              setIsModalOpen(true)
            }}
            className="w-full sm:w-auto flex-shrink-0 min-h-[44px] touch-manipulation"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Cadastrar Veículo</span>
            <span className="sm:hidden">Cadastrar</span>
          </Button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar veículos por placa, modelo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {dataLoading && veiculos.length === 0 ? (
          <SkeletonList count={5} />
        ) : (
          <div className="grid gap-3 sm:gap-4 w-full">
            {filteredVeiculos.map((veiculo) => (
              <motion.div
                key={veiculo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
              >
                <Card className="p-3 sm:p-4 hover:shadow-xl transition-all duration-300 overflow-hidden bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--brand)]/30 group">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 flex gap-3 sm:gap-4 min-w-0">
                      {veiculo.photo_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={veiculo.photo_url}
                          alt={veiculo.plate}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-[var(--border)] flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="p-1 rounded-lg bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)]">
                            <Truck className="h-4 w-4 text-[var(--brand)] flex-shrink-0" />
                          </div>
                          <h3 className="font-bold text-base sm:text-lg break-words group-hover:text-[var(--brand)] transition-colors">{veiculo.plate}</h3>
                          {veiculo.prefix && (
                            <Badge variant="outline" className="text-xs">Prefixo: {veiculo.prefix}</Badge>
                          )}
                          <Badge variant={veiculo.is_active ? "default" : "secondary"} className="text-xs">
                            {veiculo.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <p className="font-medium mb-1 break-words text-sm sm:text-base">{veiculo.model || "Sem modelo"}</p>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[var(--ink-muted)]">
                          <span className="break-words">Ano: {veiculo.year || "N/A"}</span>
                          {veiculo.capacity && <span className="break-words">Capacidade: {veiculo.capacity} lugares</span>}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedVehicle(veiculo)
                          setIsModalOpen(true)
                        }}
                        className="text-xs sm:text-sm min-h-[44px] touch-manipulation"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="truncate">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewVehicle(veiculo)}
                        className="text-xs sm:text-sm min-h-[44px] touch-manipulation"
                      >
                        <span className="truncate hidden sm:inline">Ver Detalhes</span>
                        <span className="truncate sm:hidden">Detalhes</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteVeiculo(veiculo.id, veiculo.plate || 'Veículo')}
                        className="col-span-2 sm:col-span-1 text-xs sm:text-sm min-h-[44px] touch-manipulation"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="truncate">Excluir</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {veiculos.length === 0 && (
              <Card className="p-12 text-center">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum veículo encontrado</h3>
                <p className="text-sm text-[var(--ink-muted)] mb-4">
                  {searchQuery ? "Tente ajustar sua busca" : "Comece cadastrando seu primeiro veículo"}
                </p>
                <Button onClick={() => {
                  setSelectedVehicle(null)
                  setIsModalOpen(true)
                }} className="min-h-[44px] touch-manipulation">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Veículo
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Modal de Veículo */}
        <VehicleModal
          vehicle={selectedVehicle}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedVehicle(null)
          }}
          onSave={loadVeiculos}
        />

        {/* Modal de Manutenção */}
        {viewingVehicle && (
          <VehicleMaintenanceModal
            maintenance={selectedMaintenance}
            vehicleId={viewingVehicle}
            isOpen={isMaintenanceModalOpen}
            onClose={() => {
              setIsMaintenanceModalOpen(false)
              setSelectedMaintenance(null)
            }}
            onSave={() => {
              if (viewingVehicle) {
                loadMaintenances(viewingVehicle)
              }
            }}
          />
        )}

        {/* Modal de Checklist */}
        {viewingVehicle && (
          <VehicleChecklistModal
            checklist={selectedChecklist}
            vehicleId={viewingVehicle}
            isOpen={isChecklistModalOpen}
            onClose={() => {
              setIsChecklistModalOpen(false)
              setSelectedChecklist(null)
            }}
            onSave={() => {
              if (viewingVehicle) {
                loadChecklists(viewingVehicle)
              }
            }}
          />
        )}

        {/* Modal de Detalhes do Veículo com Tabs */}
        {viewingVehicle && selectedVehicle && (
          <Dialog open={!!viewingVehicle} onOpenChange={() => {
            setViewingVehicle(null)
            setSelectedVehicle(null)
            setMaintenances([])
            setChecklists([])
          }}>
            <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6 mx-auto">
              <DialogHeader className="p-0 sm:p-0 mb-3 sm:mb-6">
                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl break-words">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="break-words">{selectedVehicle.plate} - {selectedVehicle.model}</span>
                </DialogTitle>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                  <TabsList className="grid w-full grid-cols-4 min-w-[320px]">
                    <TabsTrigger value="dados" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Dados</TabsTrigger>
                    <TabsTrigger value="documentos" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Documentos</TabsTrigger>
                    <TabsTrigger value="manutencao" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Manutenção</TabsTrigger>
                    <TabsTrigger value="checklist" className="text-xs sm:text-sm min-h-[44px] touch-manipulation">Checklist</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="dados" className="space-y-4 mt-3 sm:mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm font-medium">Placa</Label>
                      <p className="text-sm">{selectedVehicle.plate}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Modelo</Label>
                      <p className="text-sm">{selectedVehicle.model || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Ano</Label>
                      <p className="text-sm">{selectedVehicle.year || "N/A"}</p>
                    </div>
                    {selectedVehicle.capacity && (
                      <div>
                        <Label className="text-sm font-medium">Capacidade</Label>
                        <p className="text-sm">{selectedVehicle.capacity} lugares</p>
                      </div>
                    )}
                    {selectedVehicle.prefix && (
                      <div>
                        <Label className="text-sm font-medium">Prefixo</Label>
                        <p className="text-sm">{selectedVehicle.prefix}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant={selectedVehicle.is_active ? "default" : "secondary"}>
                        {selectedVehicle.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="space-y-4 mt-3 sm:mt-4">
                  <VehicleDocumentsSection
                    vehicleId={viewingVehicle}
                    isEditing={true}
                  />
                </TabsContent>

                <TabsContent value="manutencao" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Histórico de Manutenções</h3>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedMaintenance(null)
                        setIsMaintenanceModalOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Manutenção
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {maintenances.length === 0 ? (
                      <Card className="p-8 text-center">
                        <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-[var(--ink-muted)]">Nenhuma manutenção registrada</p>
                      </Card>
                    ) : (
                      maintenances.map((maintenance) => (
                        <Card key={maintenance.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{maintenance.type}</Badge>
                                <Badge variant={
                                  maintenance.status === 'completed' ? 'default' :
                                    maintenance.status === 'scheduled' ? 'secondary' :
                                      maintenance.status === 'cancelled' ? 'outline' : 'destructive'
                                }>
                                  {maintenance.status === 'pending' ? 'Pendente' :
                                    maintenance.status === 'scheduled' ? 'Agendada' :
                                      maintenance.status === 'completed' ? 'Concluída' : 'Cancelada'}
                                </Badge>
                              </div>
                              <p className="text-sm text-[var(--ink-muted)]">
                                Vencimento: {new Date(maintenance.due_at).toLocaleDateString('pt-BR')}
                              </p>
                              {maintenance.notes && (
                                <p className="text-sm mt-2">{maintenance.notes}</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMaintenance(maintenance)
                                setIsMaintenanceModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="checklist" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Histórico de Checklists</h3>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedChecklist(null)
                        setIsChecklistModalOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Checklist
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {checklists.length === 0 ? (
                      <Card className="p-8 text-center">
                        <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-[var(--ink-muted)]">Nenhum checklist registrado</p>
                      </Card>
                    ) : (
                      checklists.map((checklist) => (
                        <Card key={checklist.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={
                                  checklist.status === 'completed' ? 'default' :
                                    checklist.status === 'failed' ? 'destructive' : 'secondary'
                                }>
                                  {checklist.status === 'pending' ? 'Pendente' :
                                    checklist.status === 'completed' ? 'Concluído' : 'Falhou'}
                                </Badge>
                                <span className="text-sm text-[var(--ink-muted)]">
                                  {new Date(checklist.filled_at).toLocaleDateString('pt-BR')}
                                </span>
                                {checklist.drivers && (
                                  <span className="text-sm text-[var(--ink-muted)]">
                                    - {checklist.drivers.name || checklist.drivers.email}
                                  </span>
                                )}
                              </div>
                              {checklist.issues && Object.keys(checklist.issues).length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium mb-1">Problemas encontrados:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(checklist.issues).map(([key, value]: [string, any]) => (
                                      value === 'failed' && (
                                        <Badge key={key} variant="destructive" className="text-xs">
                                          {key}
                                        </Badge>
                                      )
                                    ))}
                                  </div>
                                </div>
                              )}
                              {checklist.notes && (
                                <p className="text-sm mt-2">{checklist.notes}</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedChecklist(checklist)
                                setIsChecklistModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal de Confirmação de Exclusão */}
        <Dialog
          open={deleteConfirm.isOpen}
          onOpenChange={(open) =>
            !open &&
            setDeleteConfirm({
              isOpen: false,
              vehicle: null,
              isDeleting: false
            })
          }
        >
          <DialogContent className="w-[95vw] sm:w-[90vw] max-w-md p-4 sm:p-6 mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Tem certeza que deseja excluir o veículo?</p>
              {deleteConfirm.vehicle && (
                <Card className="p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-[var(--brand)]" />
                    <span className="font-bold">{deleteConfirm.vehicle.plate}</span>
                  </div>
                  <p className="text-sm text-[var(--ink-muted)]">{deleteConfirm.vehicle.model}</p>
                </Card>
              )}
              <p className="text-sm text-red-600">
                ⚠️ Esta ação não pode ser desfeita. Todos os dados relacionados ao veículo serão mantidos, mas o veículo não estará mais disponível.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: false,
                    vehicle: null,
                    isDeleting: false
                  })
                }
                disabled={deleteConfirm.isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm.vehicle && handleDeleteVehicle(deleteConfirm.vehicle.id)}
                disabled={deleteConfirm.isDeleting}
              >
                {deleteConfirm.isDeleting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    Excluindo...
                  </span>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Veículo
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}

