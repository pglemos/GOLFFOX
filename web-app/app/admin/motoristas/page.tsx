"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Plus, Award, FileText, Edit, Search, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { DriverModal } from "@/components/modals/driver-modal"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Calendar, ExternalLink } from "lucide-react"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { useGlobalSync } from "@/hooks/use-global-sync"
import { notifySuccess, notifyError } from "@/lib/toast"

export default function MotoristasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthFast()
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingDriver, setViewingDriver] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("dados")
  const [documents, setDocuments] = useState<any[]>([])
  const [ranking, setRanking] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user && !authLoading) {
      loadMotoristas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  // Escutar eventos de sincronização global (apenas após carregamento inicial)
  useGlobalSync(
    ['driver.created', 'driver.updated', 'driver.deleted', 'user.created', 'user.updated'],
    () => {
      // Recarregar motoristas quando houver mudanças (apenas se não estiver carregando)
      if (!dataLoading && user && !authLoading) {
        loadMotoristas()
      }
    },
    [dataLoading, user, authLoading]
  )

  const loadMotoristas = async () => {
    try {
      setDataLoading(true)
      // Usar API route para bypass RLS
      const response = await fetch('/api/admin/drivers-list')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        setMotoristas(result.drivers || [])
      } else {
        throw new Error(result.error || 'Erro ao carregar motoristas')
      }
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error)
      setMotoristas([])
    } finally {
      setDataLoading(false)
    }
  }

  const handleDeleteMotorista = async (motoristaId: string, motoristaName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o motorista "${motoristaName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/drivers/delete?id=${motoristaId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Erro ao excluir motorista'
        const errorDetails = result.details ? ` (${result.details})` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      if (result.success) {
        notifySuccess('Motorista excluído com sucesso')
        await new Promise(resolve => setTimeout(resolve, 300))
        await loadMotoristas()
      } else {
        throw new Error(result.error || 'Erro ao excluir motorista')
      }
    } catch (error: any) {
      console.error('Erro ao excluir motorista:', error)
      const errorMessage = error.message || 'Erro desconhecido ao excluir motorista'
      notifyError(error, errorMessage)
    }
  }

  const loadDocuments = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from("gf_driver_documents")
        .select("*")
        .eq("driver_id", driverId)
        .order("expires_at", { ascending: true })

      if (error) throw error
      
      // Calcular status automaticamente
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      const documentsWithStatus = (data || []).map((doc: any) => {
        let status = 'valid'
        if (doc.expires_at) {
          const expiryDate = new Date(doc.expires_at)
          if (expiryDate < now) {
            status = 'expired'
          } else if (expiryDate <= thirtyDaysFromNow) {
            status = 'expiring_soon'
          }
        }
        return { ...doc, status }
      })
      
      setDocuments(documentsWithStatus)
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
      setDocuments([])
    }
  }

  const loadRanking = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from("v_reports_driver_ranking")
        .select("*")
        .eq("driver_id", driverId)
        .single()

      if (error) {
        // PGRST116 = no rows returned, não é erro
        if ((error as any).code !== 'PGRST116') throw error
      }
      setRanking(data || null)
    } catch (error) {
      console.error("Erro ao carregar ranking:", error)
      setRanking(null)
    }
  }

  const handleViewDriver = (driver: any) => {
    setViewingDriver(driver.id)
    setSelectedDriver(driver)
    setActiveTab("dados")
    loadDocuments(driver.id)
    loadRanking(driver.id)
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Motoristas</h1>
            <p className="text-[var(--muted)]">Gerencie os motoristas do sistema</p>
          </div>
          <Button onClick={() => {
            setSelectedDriver(null)
            setIsModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Motorista
          </Button>
        </div>

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
          {motoristas
            .filter(m => 
              searchQuery === "" || 
              m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.email?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((motorista) => (
            <motion.div
              key={motorista.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-[var(--brand)]" />
                      <h3 className="font-bold text-lg">{motorista.name}</h3>
                      <Badge variant="outline">{motorista.role || "driver"}</Badge>
                    </div>
                    <p className="text-sm text-[var(--ink-muted)] mb-1">{motorista.email}</p>
                    {motorista.phone && (
                      <p className="text-xs text-[var(--ink-muted)]">{motorista.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedDriver(motorista)
                        setIsModalOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDriver(motorista)}
                    >
                      Ver Detalhes
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteMotorista(motorista.id, motorista.name || motorista.email || 'Motorista')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          {motoristas.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum motorista encontrado</h3>
              <p className="text-sm text-[var(--ink-muted)] mb-4">
                {searchQuery ? "Tente ajustar sua busca" : "Comece cadastrando seu primeiro motorista"}
              </p>
              <Button onClick={() => {
                setSelectedDriver(null)
                setIsModalOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Motorista
              </Button>
            </Card>
          )}
        </div>

        {/* Modal de Motorista */}
        <DriverModal
          driver={selectedDriver}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedDriver(null)
          }}
          onSave={loadMotoristas}
        />

        {/* Modal de Detalhes do Motorista com Tabs */}
        {viewingDriver && selectedDriver && (
          <Dialog open={!!viewingDriver} onOpenChange={() => {
            setViewingDriver(null)
            setSelectedDriver(null)
            setDocuments([])
            setRanking(null)
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {selectedDriver.name} - {selectedDriver.email}
                </DialogTitle>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dados">Dados</TabsTrigger>
                  <TabsTrigger value="documentos">
                    Documentos
                    {documents.some(d => d.status === 'expiring_soon' || d.status === 'expired') && (
                      <AlertTriangle className="h-3 w-3 ml-1 text-orange-500" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="ranking">Ranking</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nome</Label>
                      <p className="text-sm">{selectedDriver.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{selectedDriver.email}</p>
                    </div>
                    {selectedDriver.phone && (
                      <div>
                        <Label className="text-sm font-medium">Telefone</Label>
                        <p className="text-sm">{selectedDriver.phone}</p>
                      </div>
                    )}
                    {selectedDriver.cpf && (
                      <div>
                        <Label className="text-sm font-medium">CPF</Label>
                        <p className="text-sm">{selectedDriver.cpf}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium">Papel</Label>
                      <Badge variant="outline">{selectedDriver.role || "driver"}</Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Documentos do Motorista</h3>
                  </div>
                  <div className="space-y-2">
                    {documents.length === 0 ? (
                      <Card className="p-8 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-[var(--ink-muted)]">Nenhum documento cadastrado</p>
                      </Card>
                    ) : (
                      documents.map((doc) => {
                        const isExpiring = doc.status === 'expiring_soon'
                        const isExpired = doc.status === 'expired'
                        
                        return (
                          <Card key={doc.id} className={`p-4 ${isExpired ? 'border-red-300 bg-red-50' : isExpiring ? 'border-orange-300 bg-orange-50' : ''}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={
                                    isExpired ? 'destructive' :
                                    isExpiring ? 'default' : 'secondary'
                                  }>
                                    {doc.type}
                                  </Badge>
                                  {isExpired && (
                                    <Badge variant="destructive">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Expirado
                                    </Badge>
                                  )}
                                  {isExpiring && (
                                    <Badge variant="default">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Vencendo em breve
                                    </Badge>
                                  )}
                                </div>
                                {doc.expires_at && (
                                  <p className="text-sm text-[var(--ink-muted)]">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    Vencimento: {new Date(doc.expires_at).toLocaleDateString('pt-BR')}
                                    {isExpiring && (
                                      <span className="ml-2 text-orange-600 font-medium">
                                        ({Math.ceil((new Date(doc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias restantes)
                                      </span>
                                    )}
                                    {isExpired && (
                                      <span className="ml-2 text-red-600 font-medium">
                                        (Expirado há {Math.ceil((Date.now() - new Date(doc.expires_at).getTime()) / (1000 * 60 * 60 * 24))} dias)
                                      </span>
                                    )}
                                  </p>
                                )}
                                {doc.file_url && (
                                  <a
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[var(--brand)] hover:underline flex items-center gap-1 mt-2"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Ver documento
                                  </a>
                                )}
                              </div>
                            </div>
                          </Card>
                        )
                      })
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="ranking" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Ranking do Motorista</h3>
                  </div>
                  {ranking ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <Card className="p-4">
                          <div className="text-xs text-[var(--ink-muted)] mb-1">Pontualidade</div>
                          <div className="text-2xl font-bold text-green-600">
                            {ranking.punctuality_score ? `${ranking.punctuality_score.toFixed(1)}%` : 'N/A'}
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-xs text-[var(--ink-muted)] mb-1">Rotas Cumpridas</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {ranking.routes_completed || 0}
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-xs text-[var(--ink-muted)] mb-1">Eficiência</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {ranking.efficiency_score ? `${ranking.efficiency_score.toFixed(1)}` : 'N/A'}
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-xs text-[var(--ink-muted)] mb-1">Rotas no Prazo</div>
                          <div className="text-2xl font-bold text-[var(--brand)]">
                            {ranking.on_time_routes || 0}
                          </div>
                        </Card>
                      </div>
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-5 w-5 text-[var(--brand)]" />
                          <span className="font-semibold">Estatísticas Detalhadas</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-[var(--ink-muted)]">Rotas Completadas: </span>
                            <span className="font-medium">{ranking.routes_completed || 0}</span>
                          </div>
                          {ranking.avg_delay_minutes !== null && ranking.avg_delay_minutes !== undefined && (
                            <div>
                              <span className="text-[var(--ink-muted)]">Atraso Médio: </span>
                              <span className="font-medium">{ranking.avg_delay_minutes.toFixed(1)} min</span>
                            </div>
                          )}
                          {ranking.on_time_routes !== null && ranking.on_time_routes !== undefined && (
                            <div>
                              <span className="text-[var(--ink-muted)]">Rotas no Prazo: </span>
                              <span className="font-medium">{ranking.on_time_routes}</span>
                            </div>
                          )}
                          {ranking.total_passengers_transported !== null && ranking.total_passengers_transported !== undefined && (
                            <div>
                              <span className="text-[var(--ink-muted)]">Passageiros Transportados: </span>
                              <span className="font-medium">{ranking.total_passengers_transported}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <Card className="p-8 text-center">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-[var(--ink-muted)]">Nenhum dado de ranking disponível ainda</p>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppShell>
  )
}

