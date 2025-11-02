"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Navigation, Plus, Search, Edit, MapPin, Route, Clock, Users, Truck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { AdvancedNavigationButton, QuickNavigation } from "@/components/advanced-navigation-button"
import { useAdvancedNavigation } from "@/hooks/use-advanced-navigation"


export default function RotasPage() {
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
          <div className="loader-spinner mx-auto"></div>
          <p className="mt-4 text-[var(--ink-muted)]">Carregando...</p>
        </div>
      </div>
    )
  }

  const filteredRotas = rotas.filter(rota =>
    rota.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rota.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rota.destination?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <TransitionOverlay>
        <div className="space-y-6 animate-fade-in">
          {/* Navegação rápida */}
          <div className="flex items-center justify-between">
            <QuickNavigation currentTab="rotas" className="hidden md:flex" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Rotas</h1>
              <p className="text-[var(--ink-muted)] text-lg">Gerencie itinerários e pontos de parada</p>
            </div>
            <Button className="shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Criar Rota
            </Button>
          </div>

        {/* Search */}
        <Card className="p-4 border-[var(--border)] bg-[var(--bg-soft)]">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[var(--ink-muted)]" />
            <Input 
              placeholder="Buscar por nome, origem ou destino..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </Card>

        {/* Lista de Rotas */}
        <div className="grid gap-4">
          {filteredRotas.length === 0 ? (
            <Card className="p-12 text-center border-[var(--border)] bg-[var(--bg-soft)]">
              <Route className="h-16 w-16 mx-auto mb-4 text-[var(--ink-muted)] opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma rota encontrada</h3>
              <p className="text-[var(--ink-muted)] mb-4">Comece criando sua primeira rota</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Rota
              </Button>
            </Card>
          ) : (
            filteredRotas.map((rota, i) => (
              <motion.div
                key={rota.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-6 border-[var(--border)] bg-[var(--bg-soft)] hover:border-[var(--brand)]/30 transition-colors cursor-pointer hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-[var(--brand-light)]">
                          <Route className="h-5 w-5 text-[var(--brand)]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl">{rota.name}</h3>
                          <p className="text-sm text-[var(--ink-muted)]">
                            {rota.companies?.name || "Sem empresa"}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {rota.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[var(--brand)]" />
                          <span className="font-medium">{rota.origin || "Origem"}</span>
                        </div>
                        <span className="text-[var(--ink-muted)]">→</span>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[var(--success)]" />
                          <span className="font-medium">{rota.destination || "Destino"}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8 text-sm text-[var(--ink-muted)]">
                        {rota.distance && (
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4" />
                            <span>{rota.distance} km</span>
                          </div>
                        )}
                        {rota.estimated_duration && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{rota.estimated_duration} min</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <AdvancedNavigationButton 
                        routeId={rota.id}
                        variant="outline" 
                        size="sm"
                      >
                        Mapa
                      </AdvancedNavigationButton>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
      </TransitionOverlay>
    </AppShell>
  )
}
