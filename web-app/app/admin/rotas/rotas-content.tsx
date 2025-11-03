"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  Route, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Truck, 
  Edit, 
  Navigation 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/app-shell"
import { QuickNavigation, AdvancedNavigationButton } from "@/components/advanced-navigation-button"
import { useAdvancedNavigation } from "@/hooks/use-advanced-navigation"
import { supabase } from "@/lib/supabase"

export function RotasPageContent() {
  const router = useRouter()
  const { TransitionOverlay } = useAdvancedNavigation()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rotas, setRotas] = useState<any[]>([])
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
      loadRotas()
    }
    getUser()
  }, [router])

  const loadRotas = async () => {
    try {
      const { data, error } = await supabase
        .from("routes")
        .select("*, companies(name)")

      if (error) throw error
      setRotas(data || [])
    } catch (error) {
      console.error("Erro ao carregar rotas:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando rotas...</p>
        </div>
      </div>
    )
  }

  const filteredRotas = rotas.filter(rota =>
    rota.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rota.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rota.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell user={user}>
      <TransitionOverlay>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Route className="h-8 w-8 text-blue-600" />
                Rotas
              </h1>
              <p className="text-gray-600 mt-1">Gerencie as rotas do sistema</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/rotas/nova">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Rota
                </Link>
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar rotas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Navigation */}
          <QuickNavigation currentTab="rotas" />

          {/* Routes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRotas.map((rota, index) => (
              <motion.div
                key={rota.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{rota.name}</h3>
                      <p className="text-sm text-gray-600">{rota.companies?.name}</p>
                    </div>
                    <Badge variant={rota.is_active ? "default" : "secondary"}>
                      {rota.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{rota.description || "Sem descrição"}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Duração: {rota.estimated_duration || "N/A"} min</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Paradas: {rota.stops?.length || 0}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="h-4 w-4 mr-2" />
                      <span>Distância: {rota.distance || "N/A"} km</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/admin/rotas/${rota.id}/editar`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </Button>
                    <AdvancedNavigationButton
                      routeId={rota.id}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Ver no Mapa
                    </AdvancedNavigationButton>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredRotas.length === 0 && (
            <div className="text-center py-12">
              <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma rota encontrada</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? "Tente ajustar sua busca" : "Comece criando sua primeira rota"}
              </p>
              <Button asChild>
                <Link href="/admin/rotas/nova">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Rota
                </Link>
              </Button>
            </div>
          )}
        </div>
      </TransitionOverlay>
    </AppShell>
  )
}
