"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Plus, Award, FileText, Edit, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { DriverModal } from "@/components/modals/driver-modal"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

export default function MotoristasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
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
      loadMotoristas()
    }
    getUser()
  }, [router])

  const loadMotoristas = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "driver")

      if (error) throw error
      setMotoristas(data || [])
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error)
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
                    <Button variant="outline" size="sm">
                      <Award className="h-4 w-4 mr-2" />
                      Ranking
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Documentos
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

        {/* Modal */}
        <DriverModal
          driver={selectedDriver}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedDriver(null)
          }}
          onSave={loadMotoristas}
        />
      </div>
    </AppShell>
  )
}

