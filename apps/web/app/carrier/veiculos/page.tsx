"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Truck, Search, Edit, MapPin, FileText, Wrench, AlertCircle, Calendar, ExternalLink, Upload, DollarSign, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useRouter as useRouterNext } from "next/navigation"
import { DocumentUpload } from "@/components/carrier/document-upload"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export default function CarrierVeiculosPage() {
  const router = useRouter()
  const routerNext = useRouterNext()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("list")
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [maintenances, setMaintenances] = useState<any[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [documentType, setDocumentType] = useState<string>('crlv')
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_type: 'preventiva',
    description: '',
    scheduled_date: '',
    cost_parts_brl: 0,
    cost_labor_brl: 0,
    workshop_name: '',
    mechanic_name: '',
    odometer_km: null as number | null,
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadVeiculos()
    }
    getUser()
  }, [router])

  const loadVeiculos = async () => {
    try {
      // Buscar veículos da transportadora
      const { data: userData } = await supabase
        .from('users')
        .select('carrier_id')
        .eq('id', user?.id)
        .single()

      let query = supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (userData?.carrier_id) {
        query = query.eq('carrier_id', userData.carrier_id)
      }

      const { data, error } = await query

      if (error) throw error
      setVeiculos(data || [])
    } catch (error) {
      console.error("Erro ao carregar veículos:", error)
    }
  }

  const loadVehicleDocuments = async (vehicleId: string) => {
    try {
      const res = await fetch(`/api/carrier/vehicles/${vehicleId}/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
    }
  }

  const loadVehicleMaintenances = async (vehicleId: string) => {
    try {
      const res = await fetch(`/api/carrier/vehicles/${vehicleId}/maintenances`)
      if (res.ok) {
        const data = await res.json()
        setMaintenances(data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar manutenções:", error)
    }
  }

  const handleSaveMaintenance = async () => {
    if (!selectedVehicle || !maintenanceForm.description) return

    try {
      const res = await fetch(`/api/carrier/vehicles/${selectedVehicle}/maintenances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceForm)
      })

      if (res.ok) {
        setIsMaintenanceModalOpen(false)
        setMaintenanceForm({
          maintenance_type: 'preventiva',
          description: '',
          scheduled_date: '',
          cost_parts_brl: 0,
          cost_labor_brl: 0,
          workshop_name: '',
          mechanic_name: '',
          odometer_km: null,
          status: 'scheduled'
        })
        loadVehicleMaintenances(selectedVehicle)
      }
    } catch (error) {
      console.error("Erro ao salvar manutenção:", error)
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  const filteredVeiculos = veiculos.filter(v => 
    searchQuery === "" || 
    v.plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Transportadora", email: user?.email || "", role: "carrier" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Veículos</h1>
            <p className="text-[var(--ink-muted)]">Gerencie a frota da transportadora</p>
          </div>
        </div>

        <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="maintenances">Manutenções</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
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

            <div className="grid gap-4">
              {filteredVeiculos.map((veiculo, index) => (
                <motion.div
                  key={veiculo.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 flex gap-4">
                        {veiculo.photo_url && (
                          <img 
                            src={veiculo.photo_url} 
                            alt={veiculo.plate}
                            className="w-20 h-20 rounded-lg object-cover border border-[var(--border)]"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="h-5 w-5 text-[var(--brand)]" />
                            <h3 className="font-bold text-lg">{veiculo.plate}</h3>
                            <Badge variant={veiculo.is_active ? "default" : "secondary"}>
                              {veiculo.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <p className="font-medium mb-1">{veiculo.model || "Sem modelo"}</p>
                          <div className="flex gap-4 text-sm text-[var(--ink-muted)]">
                            <span>Ano: {veiculo.year || "N/A"}</span>
                            <span>Capacidade: {veiculo.capacity || "N/A"} lugares</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedVehicle(veiculo.id)
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
                          onClick={() => routerNext.push(`/carrier/mapa?vehicle_id=${veiculo.id}`)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Ver no Mapa
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
              {filteredVeiculos.length === 0 && (
                <Card className="p-12 text-center">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum veículo encontrado</h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {searchQuery ? "Tente ajustar sua busca" : "Não há veículos cadastrados"}
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Documentos dos Veículos</h2>
              {selectedVehicle && (
                <Button onClick={() => {
                  setIsUploadModalOpen(true)
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documento
                </Button>
              )}
            </div>

            {selectedVehicle ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Label>Veículo:</Label>
                  <Select value={selectedVehicle} onValueChange={(value) => {
                    setSelectedVehicle(value)
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

                <div className="grid gap-4">
                  {documents.length === 0 ? (
                    <Card className="p-12 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum documento encontrado</h3>
                      <p className="text-sm text-[var(--ink-muted)] mb-4">
                        Faça upload dos documentos do veículo
                      </p>
                      <Button onClick={() => setIsUploadModalOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Fazer Upload
                      </Button>
                    </Card>
                  ) : (
                    documents.map((doc) => (
                      <Card key={doc.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-[var(--brand)]" />
                              <h3 className="font-bold uppercase">{doc.document_type}</h3>
                              <Badge variant={doc.status === 'valid' ? 'default' : doc.status === 'expired' ? 'destructive' : 'secondary'}>
                                {doc.status === 'valid' ? 'Válido' : doc.status === 'expired' ? 'Vencido' : doc.status === 'pending' ? 'Pendente' : 'Cancelado'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-[var(--ink-muted)]">
                              {doc.document_number && (
                                <p>Número: {doc.document_number}</p>
                              )}
                              {doc.expiry_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Vence em: {formatDate(doc.expiry_date)}</span>
                                  {getDaysToExpiry(doc.expiry_date) !== null && getDaysToExpiry(doc.expiry_date)! < 30 && (
                                    <Badge variant={getDaysToExpiry(doc.expiry_date)! < 0 ? 'destructive' : 'warning'}>
                                      {getDaysToExpiry(doc.expiry_date)! < 0 
                                        ? `Vencido há ${Math.abs(getDaysToExpiry(doc.expiry_date)!)} dias`
                                        : `${getDaysToExpiry(doc.expiry_date)} dias restantes`}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {doc.value_brl && (
                                <p>Valor: {formatCurrency(parseFloat(doc.value_brl.toString()))}</p>
                              )}
                              {doc.insurance_company && (
                                <p>Seguradora: {doc.insurance_company}</p>
                              )}
                              {doc.policy_number && (
                                <p>Apólice: {doc.policy_number}</p>
                              )}
                              {doc.file_url && (
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--brand)] hover:underline">
                                  <ExternalLink className="h-4 w-4" />
                                  Ver documento
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione um veículo</h3>
                <p className="text-sm text-[var(--ink-muted)] mb-4">
                  Escolha um veículo da lista para visualizar seus documentos
                </p>
                <Button onClick={() => setActiveTab('list')}>
                  Ver Lista de Veículos
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="maintenances" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Manutenções dos Veículos</h2>
              {selectedVehicle && (
                <Button onClick={() => setIsMaintenanceModalOpen(true)}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Nova Manutenção
                </Button>
              )}
            </div>

            {selectedVehicle ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Label>Veículo:</Label>
                  <Select value={selectedVehicle} onValueChange={(value) => {
                    setSelectedVehicle(value)
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

                <div className="grid gap-4">
                  {maintenances.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhuma manutenção encontrada</h3>
                      <p className="text-sm text-[var(--ink-muted)] mb-4">
                        Registre manutenções do veículo
                      </p>
                      <Button onClick={() => setIsMaintenanceModalOpen(true)}>
                        <Wrench className="h-4 w-4 mr-2" />
                        Nova Manutenção
                      </Button>
                    </Card>
                  ) : (
                    maintenances.map((maint) => (
                      <Card key={maint.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Wrench className="h-5 w-5 text-[var(--brand)]" />
                              <h3 className="font-bold capitalize">{maint.maintenance_type}</h3>
                              <Badge variant={
                                maint.status === 'completed' ? 'default' : 
                                maint.status === 'in_progress' ? 'secondary' : 
                                maint.status === 'cancelled' ? 'destructive' : 'outline'
                              }>
                                {maint.status === 'scheduled' ? 'Agendada' :
                                 maint.status === 'in_progress' ? 'Em Andamento' :
                                 maint.status === 'completed' ? 'Concluída' : 'Cancelada'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-[var(--ink-muted)]">
                              <p>{maint.description}</p>
                              {maint.scheduled_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Agendada para: {formatDate(maint.scheduled_date)}</span>
                                </div>
                              )}
                              {maint.completed_date && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>Concluída em: {formatDate(maint.completed_date)}</span>
                                </div>
                              )}
                              {maint.next_maintenance_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Próxima manutenção: {formatDate(maint.next_maintenance_date)}</span>
                                </div>
                              )}
                              {maint.odometer_km && (
                                <p>Odômetro: {maint.odometer_km.toLocaleString('pt-BR')} km</p>
                              )}
                              {(maint.cost_parts_brl > 0 || maint.cost_labor_brl > 0) && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border)]">
                                  <DollarSign className="h-4 w-4" />
                                  <span className="font-semibold">
                                    Custo Total: {formatCurrency(parseFloat(maint.total_cost_brl.toString()))}
                                  </span>
                                  {maint.cost_parts_brl > 0 && (
                                    <span className="text-xs">(Peças: {formatCurrency(parseFloat(maint.cost_parts_brl.toString()))}</span>
                                  )}
                                  {maint.cost_labor_brl > 0 && (
                                    <span className="text-xs">, Mão de Obra: {formatCurrency(parseFloat(maint.cost_labor_brl.toString()))})</span>
                                  )}
                                </div>
                              )}
                              {maint.workshop_name && (
                                <p>Oficina: {maint.workshop_name}</p>
                              )}
                              {maint.mechanic_name && (
                                <p>Mecânico: {maint.mechanic_name}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione um veículo</h3>
                <p className="text-sm text-[var(--ink-muted)] mb-4">
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
          <DialogContent className="max-w-2xl">
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
              
              {selectedVehicle && (
                <DocumentUpload
                  vehicleId={selectedVehicle}
                  folder="vehicle-documents"
                  documentType={documentType}
                  onSuccess={() => {
                    setIsUploadModalOpen(false)
                    loadVehicleDocuments(selectedVehicle)
                  }}
                  onError={(error) => {
                    console.error('Erro no upload:', error)
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Nova Manutenção */}
        <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Manutenção</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Manutenção</Label>
                <Select 
                  value={maintenanceForm.maintenance_type} 
                  onValueChange={(value: any) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: value })}
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
                  onValueChange={(value: any) => setMaintenanceForm({ ...maintenanceForm, status: value })}
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

