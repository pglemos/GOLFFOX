"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Truck, Search, Edit, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useRouter as useRouterNext } from "next/navigation"

export default function CarrierVeiculosPage() {
  const router = useRouter()
  const routerNext = useRouterNext()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [veiculos, setVeiculos] = useState<any[]>([])
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => routerNext.push(`/carrier/mapa?vehicle_id=${veiculo.id}`)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Ver no Mapa
                  </Button>
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
      </div>
    </AppShell>
  )
}

