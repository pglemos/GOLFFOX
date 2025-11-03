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
import { motion } from "framer-motion"

export default function VeiculosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
                    <Button variant="outline" size="sm">
                      <Wrench className="h-4 w-4 mr-2" />
                      Manutenção
                    </Button>
                    <Button variant="outline" size="sm">
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Checklist
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

        {/* Modal */}
        <VehicleModal
          vehicle={selectedVehicle}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedVehicle(null)
          }}
          onSave={loadVeiculos}
        />
      </div>
    </AppShell>
  )
}

