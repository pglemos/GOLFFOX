"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Award, Phone, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function CarrierMotoristasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [motoristas, setMotoristas] = useState<any[]>([])
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
      loadMotoristas()
    }
    getUser()
  }, [router])

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
                  <Button variant="outline" size="sm">
                    <Award className="h-4 w-4 mr-2" />
                    Ranking
                  </Button>
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
      </div>
    </AppShell>
  )
}

