"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Truck, Plus, Search, Wrench, ClipboardCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function VeiculosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [veiculos, setVeiculos] = useState<any[]>([])

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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Veículo
          </Button>
        </div>

        <div className="grid gap-4">
          {veiculos.map((veiculo) => (
            <Card key={veiculo.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-[var(--brand)]" />
                    <h3 className="font-bold text-lg">{veiculo.plate}</h3>
                    <Badge>{veiculo.model || "Sem modelo"}</Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-[var(--muted)]">
                    <span>Ano: {veiculo.year || "N/A"}</span>
                    <span>Status: {veiculo.is_active ? "Ativo" : "Inativo"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
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
          ))}
        </div>
      </div>
    </AppShell>
  )
}

