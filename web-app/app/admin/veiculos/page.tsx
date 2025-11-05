"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Truck, Plus, Search, Wrench, ClipboardCheck, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { VehicleModal } from "@/components/modals/vehicle-modal"
import { VehicleMaintenanceModal } from "@/components/modals/vehicle-maintenance-modal"
import { VehicleChecklistModal } from "@/components/modals/vehicle-checklist-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

export default function VeiculosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [veiculos, setVeiculos] = useState<any[]>([])
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
      console.log("Iniciando carregamento de veículos...")
      
      // Consulta simples sem filtros para testar
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")

      if (error) {
        console.error("Erro do Supabase:", error)
        throw error
      }
      
      console.log("Dados recebidos:", data)
      console.log("Número de veículos encontrados:", data ? data.length : 0)
      console.log("Estrutura dos dados (primeira linha):", data && data[0] ? Object.keys(data[0]) : "Nenhum dado encontrado")
      
      if (data && data.length > 0) {
        console.log("✅ Veículos carregados com sucesso!")
        setVeiculos(data)
      } else {
        console.log("⚠️ Nenhum veículo encontrado na tabela")
        setVeiculos([])
      }
    } catch (error) {
      console.error("Erro ao carregar veículos:", error)
      
      // Fallback com dados mock se houver erro de conexão
      const mockVeiculos = [
        {
          id: "1",
          plate: "ABC-1234",
          model: "Mercedes-Benz Sprinter",
          year: 2022,
          capacity: 20,
          status: "active",
          company_id: "mock-company"
        },
        {
          id: "2", 
          plate: "DEF-5678",
          model: "Volkswagen Crafter",
          year: 2021,
          capacity: 18,
          status: "maintenance",
          company_id: "mock-company"
        },
        {
          id: "3",
          plate: "GHI-9012", 
          model: "Iveco Daily",
          year: 2023,
          capacity: 22,
          status: "active",
          company_id: "mock-company"
        }
      ]
      
      console.log("Usando dados mock devido ao erro")
      setVeiculos(mockVeiculos)
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
      console.error("Erro ao carregar manutenções:", error)
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
      console.error("Erro ao carregar checklists:", error)
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Veículos</h1>
            <p className="text-[var(--muted)]">Gerencie a frota de veículos</p>
          </div>
          <Button onClick={() => {
            setSelectedVehicle(null)
            setIsModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Veículo
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

        <div className="grid gap-4">
          {veiculos
            .filter(v => 
              searchQuery === "" || 
              v.plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              v.model?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((veiculo) => (
            <motion.div
              key={veiculo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 flex gap-4">
                    {veiculo.photo_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
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
                        {veiculo.prefix && (
                          <Badge variant="outline">Prefixo: {veiculo.prefix}</Badge>
                        )}
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
                        setSelectedVehicle(veiculo)
                        setIsModalOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewVehicle(veiculo)}
                    >
                      Ver Detalhes
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
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Veículo
              </Button>
            </Card>
          )}
        </div>

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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {selectedVehicle.plate} - {selectedVehicle.model}
                </DialogTitle>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dados">Dados</TabsTrigger>
                  <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
                  <TabsTrigger value="checklist">Checklist</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <Label className="text-sm font-medium">Capacidade</Label>
                      <p className="text-sm">{selectedVehicle.capacity || "N/A"} lugares</p>
                    </div>
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
      </div>
    </AppShell>
  )
}

