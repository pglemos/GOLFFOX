"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Users, Search, Award, Phone, Mail, FileText, Stethoscope, AlertCircle, Calendar, ExternalLink, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DocumentUpload } from "@/components/carrier/document-upload"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function CarrierMotoristasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("list")
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadType, setUploadType] = useState<'document' | 'exam'>('document')
  const [documentType, setDocumentType] = useState<string>('cnh')

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadMotoristas()
    }
    getUser()
  }, [router])

  useEffect(() => {
    if (user && activeTab === 'alerts') {
      loadAlerts()
    }
  }, [user, activeTab])

  const loadMotoristas = async () => {
    try {
      // Buscar motoristas da transportadora
      const { data: userData } = await supabase
        .from('users')
        .select('carrier_id')
        .eq('id', user?.id)
        .single()

      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'driver')

      if (userData?.carrier_id) {
        query = query.eq('carrier_id', userData.carrier_id)
      }

      const { data, error } = await query

      if (error) throw error
      setMotoristas(data || [])
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error)
    }
  }

  const loadDriverDocuments = async (driverId: string) => {
    try {
      const res = await fetch(`/api/carrier/drivers/${driverId}/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
    }
  }

  const loadDriverExams = async (driverId: string) => {
    try {
      const res = await fetch(`/api/carrier/drivers/${driverId}/exams`)
      if (res.ok) {
        const data = await res.json()
        setExams(data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar exames:", error)
    }
  }

  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/carrier/alerts?alert_level=critical,warning,expired')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error("Erro ao carregar alertas:", error)
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  const filteredMotoristas = motoristas.filter(m => 
    searchQuery === "" || 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Transportadora", email: user?.email || "", role: "carrier" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Motoristas</h1>
            <p className="text-[var(--ink-muted)]">Gerencie os motoristas da transportadora</p>
          </div>
        </div>

        <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="exams">Exames</TabsTrigger>
            <TabsTrigger value="alerts">
              Alertas
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.filter((a: any) => a.alert_level === 'critical' || a.alert_level === 'expired').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar motoristas por nome, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4">
              {filteredMotoristas.map((motorista, index) => (
                <motion.div
                  key={motorista.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-[var(--brand)]" />
                          <h3 className="font-bold text-lg">{motorista.name}</h3>
                          <Badge variant="outline">Motorista</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-[var(--ink-muted)]">
                          {motorista.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{motorista.email}</span>
                            </div>
                          )}
                          {motorista.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{motorista.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedDriver(motorista.id)
                            loadDriverDocuments(motorista.id)
                            setActiveTab('documents')
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Documentos
                        </Button>
                        <Button variant="outline" size="sm">
                          <Award className="h-4 w-4 mr-2" />
                          Ranking
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
              {filteredMotoristas.length === 0 && (
                <Card className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum motorista encontrado</h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {searchQuery ? "Tente ajustar sua busca" : "Não há motoristas cadastrados"}
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Documentos dos Motoristas</h2>
              {selectedDriver && (
                <Button onClick={() => {
                  setIsUploadModalOpen(true)
                  setUploadType('document')
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documento
                </Button>
              )}
            </div>

            {selectedDriver ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Label>Motorista:</Label>
                  <Select value={selectedDriver} onValueChange={(value) => {
                    setSelectedDriver(value)
                    loadDriverDocuments(value)
                  }}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {motoristas.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
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
                        Faça upload dos documentos do motorista
                      </p>
                      <Button onClick={() => {
                        setIsUploadModalOpen(true)
                        setUploadType('document')
                      }}>
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
                              <h3 className="font-bold">{doc.document_type.toUpperCase()}</h3>
                              <Badge variant={doc.status === 'valid' ? 'default' : 'destructive'}>
                                {doc.status === 'valid' ? 'Válido' : doc.status === 'expired' ? 'Vencido' : 'Pendente'}
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
                <h3 className="text-lg font-medium mb-2">Selecione um motorista</h3>
                <p className="text-sm text-[var(--ink-muted)] mb-4">
                  Escolha um motorista da lista para visualizar seus documentos
                </p>
                <Button onClick={() => setActiveTab('list')}>
                  Ver Lista de Motoristas
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="exams" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Exames Médicos</h2>
              {selectedDriver && (
                <Button onClick={() => {
                  setIsUploadModalOpen(true)
                  setUploadType('exam')
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar Exame
                </Button>
              )}
            </div>

            {selectedDriver ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Label>Motorista:</Label>
                  <Select value={selectedDriver} onValueChange={(value) => {
                    setSelectedDriver(value)
                    loadDriverExams(value)
                  }}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {motoristas.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4">
                  {exams.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum exame encontrado</h3>
                      <p className="text-sm text-[var(--ink-muted)] mb-4">
                        Adicione exames médicos do motorista
                      </p>
                      <Button onClick={() => {
                        setIsUploadModalOpen(true)
                        setUploadType('exam')
                      }}>
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Exame
                      </Button>
                    </Card>
                  ) : (
                    exams.map((exam) => (
                      <Card key={exam.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Stethoscope className="h-5 w-5 text-[var(--brand)]" />
                              <h3 className="font-bold capitalize">{exam.exam_type.replace('_', ' ')}</h3>
                              <Badge variant={exam.result === 'apto' ? 'default' : 'destructive'}>
                                {exam.result === 'apto' ? 'Apto' : exam.result === 'inapto' ? 'Inapto' : 'Apto com Restrições'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-[var(--ink-muted)]">
                              <p>Data do exame: {formatDate(exam.exam_date)}</p>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Vence em: {formatDate(exam.expiry_date)}</span>
                                {getDaysToExpiry(exam.expiry_date) !== null && getDaysToExpiry(exam.expiry_date)! < 30 && (
                                  <Badge variant={getDaysToExpiry(exam.expiry_date)! < 0 ? 'destructive' : 'warning'}>
                                    {getDaysToExpiry(exam.expiry_date)! < 0 
                                      ? `Vencido há ${Math.abs(getDaysToExpiry(exam.expiry_date)!)} dias`
                                      : `${getDaysToExpiry(exam.expiry_date)} dias restantes`}
                                  </Badge>
                                )}
                              </div>
                              {exam.clinic_name && <p>Clínica: {exam.clinic_name}</p>}
                              {exam.doctor_name && <p>Médico: {exam.doctor_name} {exam.doctor_crm && `(CRM: ${exam.doctor_crm})`}</p>}
                              {exam.file_url && (
                                <a href={exam.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--brand)] hover:underline">
                                  <ExternalLink className="h-4 w-4" />
                                  Ver laudo
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
                <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione um motorista</h3>
                <p className="text-sm text-[var(--ink-muted)] mb-4">
                  Escolha um motorista da lista para visualizar seus exames
                </p>
                <Button onClick={() => setActiveTab('list')}>
                  Ver Lista de Motoristas
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <h2 className="text-2xl font-bold">Alertas de Vencimento</h2>

            <div className="grid gap-4">
              {alerts.length === 0 ? (
                <Card className="p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    Todos os documentos e exames estão em dia
                  </p>
                </Card>
              ) : (
                alerts.map((alert) => (
                  <Alert 
                    key={alert.id} 
                    variant={alert.alert_level === 'critical' || alert.alert_level === 'expired' ? 'destructive' : 'warning'}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {alert.entity_name} - {alert.document_type}
                    </AlertTitle>
                    <AlertDescription>
                      {alert.alert_level === 'expired' 
                        ? `Vencido há ${Math.abs(alert.days_to_expiry || 0)} dias`
                        : alert.alert_level === 'critical'
                        ? `Vence em ${alert.days_to_expiry || 0} dias - Ação urgente necessária!`
                        : `Vence em ${alert.days_to_expiry || 0} dias - Renovação recomendada`}
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de Upload */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {uploadType === 'document' ? 'Upload de Documento' : 'Adicionar Exame Médico'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {uploadType === 'document' && (
                <div>
                  <Label>Tipo de Documento</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cnh">CNH</SelectItem>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="rg">RG</SelectItem>
                      <SelectItem value="comprovante_residencia">Comprovante de Residência</SelectItem>
                      <SelectItem value="foto_3x4">Foto 3x4</SelectItem>
                      <SelectItem value="certidao_criminal">Certidão Criminal</SelectItem>
                      <SelectItem value="certidao_civil">Certidão Cível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedDriver && (
                <DocumentUpload
                  driverId={selectedDriver}
                  folder={uploadType === 'document' ? 'driver-documents' : 'medical-exams'}
                  documentType={uploadType === 'document' ? documentType : 'periodico'}
                  onSuccess={() => {
                    setIsUploadModalOpen(false)
                    if (uploadType === 'document') {
                      loadDriverDocuments(selectedDriver)
                    } else {
                      loadDriverExams(selectedDriver)
                    }
                    loadAlerts()
                  }}
                  onError={(error) => {
                    console.error('Erro no upload:', error)
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}

