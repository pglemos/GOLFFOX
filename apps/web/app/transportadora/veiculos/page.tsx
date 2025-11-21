"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Truck, Search, Edit, MapPin, FileText, Wrench, AlertCircle, Calendar, ExternalLink, Upload, DollarSign, Clock, Grid3x3, List, Filter, Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useRouter as useRouterNext } from "next/navigation"
import { DocumentUpload } from "@/components/transportadora/document-upload"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export default function TransportadoraVeiculosPage() {
  const router = useRouter()
  const routerNext = useRouterNext()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [vehiclesWithDetails, setVehiclesWithDetails] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
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
      const res = await fetch(`/api/transportadora/vehicles/${vehicleId}/documents`)
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
      const res = await fetch(`/api/transportadora/vehicles/${vehicleId}/maintenances`)
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
      const res = await fetch(`/api/transportadora/vehicles/${selectedVehicle}/maintenances`, {
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
              .select('*')
              .eq('entity_type', 'vehicle')
              .eq('entity_id', v.id)
              .in('alert_level', ['expired', 'critical'])
              .limit(1)

            // Buscar última manutenção
            const { data: lastMaintenance } = await supabase
              .from('vehicle_maintenances')
              .select('*')
              .eq('vehicle_id', v.id)
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
            console.error(`Erro ao carregar detalhes do veículo ${v.id}:`, error)
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
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
    <AppShell user={{ id: user?.id || "", name: user?.name || "Transportadora", email: user?.email || "", role: "transportadora" }}>
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
            {/* Filtros e Busca */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Busca */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                  <motion.div
                    key={veiculo.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                      setSelectedVehicle(veiculo.id)
                      loadVehicleDocuments(veiculo.id)
                      loadVehicleMaintenances(veiculo.id)
                    }}>
                      <div className="space-y-3">
                        {/* Foto e Status */}
                        <div className="relative">
                          {veiculo.photo_url ? (
                            <img 
                              src={veiculo.photo_url} 
                              alt={veiculo.plate}
                              className="w-full h-40 rounded-lg object-cover border border-[var(--border)]"
                            />
                          ) : (
                            <div className="w-full h-40 rounded-lg bg-[var(--brand-light)] flex items-center justify-center border border-[var(--border)]">
                              <Truck className="h-12 w-12 text-[var(--brand)]" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge variant={veiculo.is_active ? "default" : "secondary"} className="shadow-lg">
                              {veiculo.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          {veiculo.hasExpiringDocs && (
                            <div className="absolute top-2 left-2">
                              <Badge variant="destructive" className="shadow-lg">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {veiculo.expiringDocsCount}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Informações */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="h-4 w-4 text-[var(--brand)]" />
                            <h3 className="font-bold text-lg">{veiculo.plate}</h3>
                          </div>
                          <p className="font-medium text-sm mb-2">{veiculo.model || "Sem modelo"}</p>
                          <div className="space-y-1 text-xs text-[var(--ink-muted)]">
                            <div className="flex justify-between">
                              <span>Ano:</span>
                              <span className="font-medium">{veiculo.year || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Capacidade:</span>
                              <span className="font-medium">{veiculo.capacity || "N/A"} lugares</span>
                            </div>
                            {veiculo.lastMaintenance && (
                              <div className="flex justify-between items-center pt-1 border-t border-[var(--border)]">
                                <span className="flex items-center gap-1">
                                  <Wrench className="h-3 w-3" />
                                  Última manutenção:
                                </span>
                                <span className="font-medium">
                                  {formatDate(veiculo.lastMaintenance.completed_date || veiculo.lastMaintenance.scheduled_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVehicle(veiculo.id)
                              loadVehicleDocuments(veiculo.id)
                              setActiveTab('documents')
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Docs
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              routerNext.push(`/transportadora/mapa?vehicle_id=${veiculo.id}`)
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            Mapa
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
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
                      setSelectedVehicle(veiculo.id)
                      loadVehicleDocuments(veiculo.id)
                      loadVehicleMaintenances(veiculo.id)
                    }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 flex-1">
                          {veiculo.photo_url ? (
                            <img 
                              src={veiculo.photo_url} 
                              alt={veiculo.plate}
                              className="w-20 h-20 rounded-lg object-cover border border-[var(--border)]"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-[var(--brand-light)] flex items-center justify-center border border-[var(--border)]">
                              <Truck className="h-8 w-8 text-[var(--brand)]" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="h-5 w-5 text-[var(--brand)]" />
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
                            <div className="flex gap-4 text-sm text-[var(--ink-muted)]">
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
                            onClick={(e) => {
                              e.stopPropagation()
                              routerNext.push(`/transportadora/mapa?vehicle_id=${veiculo.id}`)
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
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum veículo encontrado</h3>
                <p className="text-sm text-[var(--ink-muted)]">
                  {searchQuery ? "Tente ajustar sua busca" : "Não há veículos cadastrados"}
                </p>
              </Card>
            )}
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

                {/* Timeline de Documentos */}
                <div className="space-y-4">
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
                    <div className="relative">
                      {/* Timeline vertical */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--border)]"></div>
                      <div className="space-y-6">
                        {documents
                          .sort((a, b) => {
                            const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : 0
                            const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : 0
                            return dateB - dateA
                          })
                          .map((doc, index) => {
                            const daysToExpiry = getDaysToExpiry(doc.expiry_date || '')
                            const isExpiring = daysToExpiry !== null && daysToExpiry < 30
                            return (
                              <div key={doc.id} className="relative pl-12">
                                {/* Timeline dot */}
                                <div className={`absolute left-4 top-6 w-4 h-4 rounded-full border-2 ${
                                  doc.status === 'expired' ? 'bg-red-500 border-red-500' :
                                  isExpiring ? 'bg-yellow-500 border-yellow-500' :
                                  'bg-green-500 border-green-500'
                                }`}></div>
                                
                                <Card className="p-4 hover:shadow-lg transition-shadow">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-3">
                                        <FileText className="h-5 w-5 text-[var(--brand)]" />
                                        <h3 className="font-bold uppercase">{doc.document_type}</h3>
                                        <Badge variant={doc.status === 'valid' ? 'default' : doc.status === 'expired' ? 'destructive' : 'secondary'}>
                                          {doc.status === 'valid' ? 'Válido' : doc.status === 'expired' ? 'Vencido' : doc.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                        </Badge>
                                        {isExpiring && (
                                          <Badge variant={daysToExpiry! < 0 ? 'destructive' : 'warning'}>
                                            {daysToExpiry! < 0 
                                              ? `Vencido há ${Math.abs(daysToExpiry!)} dias`
                                              : `${daysToExpiry} dias restantes`}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {/* Preview do documento se for imagem */}
                                      {doc.file_url && (
                                        <div className="mb-3">
                                          {doc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <div className="relative w-full max-w-xs">
                                              <img 
                                                src={doc.file_url} 
                                                alt={doc.document_type}
                                                className="w-full h-32 object-cover rounded-lg border border-[var(--border)] cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(doc.file_url, '_blank')}
                                              />
                                              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                                                <ExternalLink className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="w-full max-w-xs p-8 bg-[var(--bg-hover)] rounded-lg border border-[var(--border)] flex items-center justify-center">
                                              <FileText className="h-12 w-12 text-[var(--ink-muted)]" />
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[var(--ink-muted)]">
                                        {doc.document_number && (
                                          <div>
                                            <span className="font-medium">Número:</span> {doc.document_number}
                                          </div>
                                        )}
                                        {doc.expiry_date && (
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>Vence em: {formatDate(doc.expiry_date)}</span>
                                          </div>
                                        )}
                                        {doc.value_brl && (
                                          <div>
                                            <span className="font-medium">Valor:</span> {formatCurrency(parseFloat(doc.value_brl.toString()))}
                                          </div>
                                        )}
                                        {doc.insurance_company && (
                                          <div>
                                            <span className="font-medium">Seguradora:</span> {doc.insurance_company}
                                          </div>
                                        )}
                                        {doc.policy_number && (
                                          <div>
                                            <span className="font-medium">Apólice:</span> {doc.policy_number}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {doc.file_url && (
                                        <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                          <a 
                                            href={doc.file_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="inline-flex items-center gap-2 text-[var(--brand)] hover:underline"
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                            Ver documento completo
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            )
                          })}
                      </div>
                    </div>
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

                {/* Timeline de Manutenções */}
                <div className="space-y-4">
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
                    <div className="relative">
                      {/* Timeline vertical */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--border)]"></div>
                      <div className="space-y-6">
                        {maintenances
                          .sort((a, b) => {
                            const dateA = a.completed_date || a.scheduled_date || ''
                            const dateB = b.completed_date || b.scheduled_date || ''
                            return new Date(dateB).getTime() - new Date(dateA).getTime()
                          })
                          .map((maint, index) => {
                            const totalCost = (parseFloat(maint.cost_parts_brl?.toString() || '0') + parseFloat(maint.cost_labor_brl?.toString() || '0'))
                            return (
                              <div key={maint.id} className="relative pl-12">
                                {/* Timeline dot */}
                                <div className={`absolute left-4 top-6 w-4 h-4 rounded-full border-2 ${
                                  maint.status === 'completed' ? 'bg-green-500 border-green-500' :
                                  maint.status === 'in_progress' ? 'bg-blue-500 border-blue-500' :
                                  maint.status === 'cancelled' ? 'bg-red-500 border-red-500' :
                                  'bg-yellow-500 border-yellow-500'
                                }`}></div>
                                
                                <Card className="p-4 hover:shadow-lg transition-shadow">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Wrench className="h-5 w-5 text-[var(--brand)]" />
                                        <h3 className="font-bold capitalize">{maint.maintenance_type.replace('_', ' ')}</h3>
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
                                      
                                      <p className="text-sm text-[var(--ink)] mb-3">{maint.description}</p>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        {maint.scheduled_date && (
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-[var(--ink-muted)]" />
                                            <span className="text-[var(--ink-muted)]">Agendada:</span>
                                            <span className="font-medium">{formatDate(maint.scheduled_date)}</span>
                                          </div>
                                        )}
                                        {maint.completed_date && (
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-[var(--ink-muted)]" />
                                            <span className="text-[var(--ink-muted)]">Concluída:</span>
                                            <span className="font-medium">{formatDate(maint.completed_date)}</span>
                                          </div>
                                        )}
                                        {maint.next_maintenance_date && (
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-[var(--ink-muted)]" />
                                            <span className="text-[var(--ink-muted)]">Próxima:</span>
                                            <span className="font-medium">{formatDate(maint.next_maintenance_date)}</span>
                                          </div>
                                        )}
                                        {maint.odometer_km && (
                                          <div className="flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-[var(--ink-muted)]" />
                                            <span className="text-[var(--ink-muted)]">Odômetro:</span>
                                            <span className="font-medium">{maint.odometer_km.toLocaleString('pt-BR')} km</span>
                                          </div>
                                        )}
                                        {maint.workshop_name && (
                                          <div>
                                            <span className="text-[var(--ink-muted)]">Oficina:</span>
                                            <span className="font-medium ml-1">{maint.workshop_name}</span>
                                          </div>
                                        )}
                                        {maint.mechanic_name && (
                                          <div>
                                            <span className="text-[var(--ink-muted)]">Mecânico:</span>
                                            <span className="font-medium ml-1">{maint.mechanic_name}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {totalCost > 0 && (
                                        <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                          <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-[var(--ink-muted)]" />
                                            <span className="text-sm text-[var(--ink-muted)]">Custo Total:</span>
                                            <span className="font-semibold text-lg">{formatCurrency(totalCost)}</span>
                                          </div>
                                          {(maint.cost_parts_brl > 0 || maint.cost_labor_brl > 0) && (
                                            <div className="flex gap-4 mt-2 text-xs text-[var(--ink-muted)]">
                                              {maint.cost_parts_brl > 0 && (
                                                <span>Peças: {formatCurrency(parseFloat(maint.cost_parts_brl.toString()))}</span>
                                              )}
                                              {maint.cost_labor_brl > 0 && (
                                                <span>Mão de Obra: {formatCurrency(parseFloat(maint.cost_labor_brl.toString()))}</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            )
                          })}
                      </div>
                    </div>
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

