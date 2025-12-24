"use client"

import { useEffect, useState } from "react"

import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { Truck, Search, MapPin, FileText, Wrench, AlertCircle, Upload, Download, Grid3x3, List, Filter } from "lucide-react"
// Lazy load componentes pesados do recharts
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false })
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

import { AppShell } from "@/components/app-shell"
import { DocumentList } from "@/components/documents/document-list"
import { MaintenanceTimeline } from "@/components/maintenance/maintenance-timeline"
import { useAuth } from "@/components/providers/auth-provider"
import { DocumentUpload } from "@/components/transportadora/document-upload"
import { VehicleCard } from "@/components/transportadora/vehicle-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "@/lib/next-navigation"
import { VehicleService, type Vehicle, type MaintenanceRecord } from "@/lib/services/vehicle-service"
import { supabase } from "@/lib/supabase"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useResponsive } from "@/hooks/use-responsive"
import { notifyError, notifySuccess } from "@/lib/toast"
import { logError } from "@/lib/logger"
import { formatDate, formatCurrency } from "@/lib/format-utils"

export default function TransportadoraVeiculosPage() {
  const router = useRouter()
  const { isMobile } = useResponsive()
  const { user, loading: authLoading } = useAuth()

  const [veiculos, setVeiculos] = useState<Vehicle[]>([])
  const [vehiclesWithDetails, setVehiclesWithDetails] = useState<Vehicle[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">(isMobile ? "list" : "grid")
  const [activeTab, setActiveTab] = useState("list")
  const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [documentType, setDocumentType] = useState<string>('crlv')
  const [maintenanceForm, setMaintenanceForm] = useState<Partial<MaintenanceRecord>>({
    maintenance_type: 'preventiva',
    description: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    cost_parts_brl: 0,
    cost_labor_brl: 0,
    workshop_name: '',
    mechanic_name: '',
    odometer_km: null,
    status: 'scheduled'
  })

  useEffect(() => {
    if (user && !authLoading) {
      loadVeiculos()
    }
  }, [user, authLoading])

  const loadVeiculos = async () => {
    try {
      setDataLoading(true)
      if (!user?.companyId) return
      const data = await VehicleService.listVehicles(user.companyId)
      setVeiculos(data)
    } catch (error) {
      notifyError(error, "Erro ao carregar veículos")
    } finally {
      setDataLoading(false)
    }
  }

  const loadVehicleDocuments = async (vehicleId: string) => {
    try {
      const data = await VehicleService.listDocuments(vehicleId)
      setDocuments(data || [])
    } catch (error) {
      notifyError(error, "Erro ao carregar documentos")
    }
  }

  const loadVehicleMaintenances = async (vehicleId: string) => {
    try {
      const data = await VehicleService.listMaintenances(vehicleId)
      setMaintenances(data || [])
    } catch (error) {
      notifyError(error, "Erro ao carregar manutenções")
    }
  }

  const handleSaveMaintenance = async () => {
    if (!selectedVeiculo || !maintenanceForm.description) return

    try {
      setDataLoading(true)
      await VehicleService.saveMaintenance(selectedVeiculo, maintenanceForm)
      notifySuccess("Manutenção registrada com sucesso!")
      setIsMaintenanceModalOpen(false)
      loadVehicleMaintenances(selectedVeiculo)
    } catch (error) {
      notifyError(error, "Erro ao salvar manutenção")
    } finally {
      setDataLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const getDaysToExpiry = (dateString: string) => {
    if (!dateString) return null
    const expiry = new Date(dateString)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Carregar informações adicionais dos veículos (documentos vencendo, última manutenção)
  useEffect(() => {
    const loadVehicleDetails = async () => {
      if (veiculos.length === 0) {
        setVehiclesWithDetails([])
        return
      }

      const details = await Promise.all(
        veiculos.map(async (v) => {
          try {
            // Buscar documentos vencendo
            const { data: expiringDocs } = await supabase
              .from('v_carrier_expiring_documents')
              .select('id, document_type, document_name, expiry_date, days_to_expiry, alert_level, entity_id, entity_type')
              .eq('entity_type', 'veiculo')
              .eq('entity_id', v.id)
              .in('alert_level', ['expired', 'critical'])
              .limit(1)

            // Buscar última manutenção
            const { data: lastMaintenance } = await supabase
              .from('gf_vehicle_maintenance')
              .select('id, veiculo_id, maintenance_type, description, scheduled_date, completed_date, cost_parts_brl, cost_labor_brl, status, created_at')
              .eq('veiculo_id', v.id)
              .order('completed_date', { ascending: false })
              .order('scheduled_date', { ascending: false })
              .limit(1)
              .maybeSingle()

            return {
              ...v,
              hasExpiringDocs: (expiringDocs?.length || 0) > 0,
              expiringDocsCount: expiringDocs?.length || 0,
              lastMaintenance: lastMaintenance || null
            }
          } catch (error) {
            logError(`Erro ao carregar detalhes do veículo ${v.id}`, { error, vehicleId: v.id }, 'TransportadoraVeiculosPage')
            return {
              ...v,
              hasExpiringDocs: false,
              expiringDocsCount: 0,
              lastMaintenance: null
            }
          }
        })
      )

      setVehiclesWithDetails(details)
    }

    loadVehicleDetails()
  }, [veiculos])

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  const filteredVeiculos = vehiclesWithDetails.filter(v => {
    // Filtro de busca
    const matchesSearch = searchQuery === "" ||
      v.plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.year?.toString().includes(searchQuery)

    // Filtro de status
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && v.is_active) ||
      (statusFilter === "inactive" && !v.is_active)

    return matchesSearch && matchesStatus
  })

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Gestor da Transportadora", email: user?.email || "", role: user?.role || "gestor_transportadora", avatar_url: user?.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Veículos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerencie a frota da transportadora</p>
          </div>
        </div>

        <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="maintenances">Manutenções</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 sm:space-y-6">
            {/* Filtros e Busca */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Busca */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light h-4 w-4" />
                    <Input
                      placeholder="Buscar veículos por placa, modelo, ano..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filtro de Status */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Modo de Visualização */}
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Exportar */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const csv = [
                        ['Placa', 'Modelo', 'Ano', 'Capacidade', 'Status'].join(','),
                        ...filteredVeiculos.map(v => [
                          v.plate || '',
                          v.model || '',
                          v.year || '',
                          v.capacity || '',
                          v.is_active ? 'Ativo' : 'Inativo'
                        ].join(','))
                      ].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `veiculos-${new Date().toISOString().split('T')[0]}.csv`
                      a.click()
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVeiculos.map((veiculo, index) => (
                  <VehicleCard
                    key={veiculo.id}
                    vehicle={veiculo}
                    index={index}
                    onClick={() => {
                      setSelectedVeiculo(veiculo.id)
                      loadVehicleDocuments(veiculo.id)
                      loadVehicleMaintenances(veiculo.id)
                    }}
                    onViewDocs={() => {
                      setSelectedVeiculo(veiculo.id)
                      loadVehicleDocuments(veiculo.id)
                      setActiveTab('documents')
                    }}
                    onViewMap={() => {
                      router.push(`/transportadora/mapa?veiculo_id=${veiculo.id}`)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVeiculos.map((veiculo, index) => (
                  <motion.div
                    key={veiculo.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                      setSelectedVeiculo(veiculo.id)
                      loadVehicleDocuments(veiculo.id)
                      loadVehicleMaintenances(veiculo.id)
                    }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 flex-1">
                          {veiculo.photo_url ? (
                            <img
                              src={veiculo.photo_url}
                              alt={`Foto do veículo ${veiculo.plate}${veiculo.model ? ` - ${veiculo.model}` : ''}`}
                              className="w-20 h-20 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-brand-light flex items-center justify-center border border-border">
                              <Truck className="h-8 w-8 text-brand" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="h-5 w-5 text-brand" />
                              <h3 className="font-bold text-lg">{veiculo.plate}</h3>
                              <Badge variant={veiculo.is_active ? "default" : "secondary"}>
                                {veiculo.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                              {veiculo.hasExpiringDocs && (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {veiculo.expiringDocsCount} doc(s) vencendo
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium mb-1">{veiculo.model || "Sem modelo"}</p>
                            <div className="flex gap-4 text-sm text-ink-muted">
                              <span>Ano: {veiculo.year || "N/A"}</span>
                              <span>Capacidade: {veiculo.capacity || "N/A"} lugares</span>
                              {veiculo.lastMaintenance && (
                                <span className="flex items-center gap-1">
                                  <Wrench className="h-3 w-3" />
                                  Última manutenção: {formatDate(veiculo.lastMaintenance.completed_date || veiculo.lastMaintenance.scheduled_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVeiculo(veiculo.id)
                              loadVehicleDocuments(veiculo.id)
                              setActiveTab('documents')
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Documentos
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/transportadora/mapa?veiculo_id=${veiculo.id}`)
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Ver no Mapa
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
            {filteredVeiculos.length === 0 && (
              <Card className="p-12 text-center">
                <Truck className="h-12 w-12 text-ink-light mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum veículo encontrado</h3>
                <p className="text-sm text-ink-muted">
                  {searchQuery ? "Tente ajustar sua busca" : "Não há veículos cadastrados"}
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="bg-transparent border-0 p-0 shadow-none space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Documentos dos Veículos</h2>
              {selectedVeiculo && (
                <Button onClick={() => {
                  setIsUploadModalOpen(true)
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documento
                </Button>
              )}
            </div>

            {selectedVeiculo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Label>Veículo:</Label>
                  <Select value={selectedVeiculo} onValueChange={(value) => {
                    setSelectedVeiculo(value)
                    loadVehicleDocuments(value)
                  }}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculos.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plate} - {v.model || 'Sem modelo'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Timeline de Documentos */}
                <div className="space-y-4">
                  {documents.length === 0 ? (
                    <Card className="p-12 text-center">
                      <FileText className="h-12 w-12 text-ink-light mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum documento encontrado</h3>
                      <p className="text-sm text-ink-muted mb-4">
                        Faça upload dos documentos do veículo
                      </p>
                      <Button onClick={() => setIsUploadModalOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Fazer Upload
                      </Button>
                    </Card>
                  ) : (
                    <DocumentList
                      documents={documents}
                      getDaysToExpiry={getDaysToExpiry}
                    />
                  )}
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-ink-light mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione um veículo</h3>
                <p className="text-sm text-ink-muted mb-4">
                  Escolha um veículo da lista para visualizar seus documentos
                </p>
                <Button onClick={() => setActiveTab('list')}>
                  Ver Lista de Veículos
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="maintenances" className="bg-transparent border-0 p-0 shadow-none space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Manutenções dos Veículos</h2>
              {selectedVeiculo && (
                <Button onClick={() => setIsMaintenanceModalOpen(true)}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Nova Manutenção
                </Button>
              )}
            </div>

            {selectedVeiculo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Label>Veículo:</Label>
                  <Select value={selectedVeiculo} onValueChange={(value) => {
                    setSelectedVeiculo(value)
                    loadVehicleMaintenances(value)
                  }}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculos.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plate} - {v.model || 'Sem modelo'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Timeline de Manutenções */}
                <div className="space-y-4">
                  {maintenances.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Wrench className="h-12 w-12 text-ink-light mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhuma manutenção encontrada</h3>
                      <p className="text-sm text-ink-muted mb-4">
                        Registre manutenções do veículo
                      </p>
                      <Button onClick={() => setIsMaintenanceModalOpen(true)}>
                        <Wrench className="h-4 w-4 mr-2" />
                        Nova Manutenção
                      </Button>
                    </Card>
                  ) : (
                    <MaintenanceTimeline
                      maintenances={maintenances.map(m => ({
                        id: m.id,
                        maintenance_type: m.maintenance_type,
                        status: m.status,
                        description: m.description,
                        scheduled_date: m.scheduled_date,
                        completed_date: m.completed_date,
                        next_maintenance_date: undefined,
                        odometer_km: m.odometer_km ?? undefined,
                        workshop_name: m.workshop_name,
                        mechanic_name: m.mechanic_name,
                        cost_parts_brl: m.cost_parts_brl,
                        cost_labor_brl: m.cost_labor_brl,
                      }))}
                      formatCurrency={formatCurrency}
                    />
                  )}
                </div>

                {/* Gráfico de Custos de Manutenção */}
                {maintenances.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Histórico de Custos de Manutenção</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={maintenances
                            .filter(m => m.status === 'completed')
                            .map(m => ({
                              date: formatDate(m.completed_date || m.scheduled_date || ''),
                              custo: parseFloat(m.cost_parts_brl?.toString() || '0') + parseFloat(m.cost_labor_brl?.toString() || '0')
                            }))
                            .slice(-10)
                          }>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                              dataKey="date"
                              stroke="var(--ink-muted)"
                              style={{ fontSize: '12px' }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis
                              stroke="var(--ink-muted)"
                              style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{
                                backgroundColor: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar dataKey="custo" fill="var(--brand)" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Wrench className="h-12 w-12 text-ink-light mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione um veículo</h3>
                <p className="text-sm text-ink-muted mb-4">
                  Escolha um veículo da lista para visualizar suas manutenções
                </p>
                <Button onClick={() => setActiveTab('list')}>
                  Ver Lista de Veículos
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal de Upload de Documento */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl p-4 sm:p-6 mx-auto">
            <DialogHeader>
              <DialogTitle>Upload de Documento do Veículo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crlv">CRLV (Certificado de Registro e Licenciamento)</SelectItem>
                    <SelectItem value="ipva">IPVA</SelectItem>
                    <SelectItem value="seguro">Seguro</SelectItem>
                    <SelectItem value="inspecao">Inspeção Veicular</SelectItem>
                    <SelectItem value="alvara">Alvará de Funcionamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedVeiculo && (
                <DocumentUpload
                  vehicleId={selectedVeiculo}
                  folder="vehicle-documents"
                  documentType={documentType}
                  onSuccess={() => {
                    setIsUploadModalOpen(false)
                    loadVehicleDocuments(selectedVeiculo)
                  }}
                  onError={(error) => {
                    logError('Erro no upload', { error }, 'TransportadoraVeiculosPage')
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Nova Manutenção */}
        <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
          <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
            <DialogHeader>
              <DialogTitle>Nova Manutenção</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Manutenção</Label>
                <Select
                  value={maintenanceForm.maintenance_type}
                  onValueChange={(value: string) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventiva">Preventiva</SelectItem>
                    <SelectItem value="corretiva">Corretiva</SelectItem>
                    <SelectItem value="revisao">Revisão</SelectItem>
                    <SelectItem value="troca_oleo">Troca de Óleo</SelectItem>
                    <SelectItem value="pneus">Pneus</SelectItem>
                    <SelectItem value="freios">Freios</SelectItem>
                    <SelectItem value="suspensao">Suspensão</SelectItem>
                    <SelectItem value="eletrica">Elétrica</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descrição *</Label>
                <Textarea
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  placeholder="Descreva a manutenção realizada..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Agendada</Label>
                  <Input
                    type="date"
                    value={maintenanceForm.scheduled_date}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, scheduled_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Odômetro (km)</Label>
                  <Input
                    type="number"
                    value={maintenanceForm.odometer_km || ''}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, odometer_km: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Ex: 50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Custo de Peças (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={maintenanceForm.cost_parts_brl}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost_parts_brl: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Custo de Mão de Obra (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={maintenanceForm.cost_labor_brl}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost_labor_brl: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Oficina</Label>
                  <Input
                    value={maintenanceForm.workshop_name || ''}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, workshop_name: e.target.value })}
                    placeholder="Nome da oficina"
                  />
                </div>
                <div>
                  <Label>Mecânico</Label>
                  <Input
                    value={maintenanceForm.mechanic_name || ''}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, mechanic_name: e.target.value })}
                    placeholder="Nome do mecânico"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={maintenanceForm.status}
                  onValueChange={(value: string) => setMaintenanceForm({ ...maintenanceForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsMaintenanceModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveMaintenance} disabled={!maintenanceForm.description}>
                  Salvar Manutenção
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}

