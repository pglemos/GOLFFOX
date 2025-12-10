"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users,
  DollarSign,
  Navigation,
  Star,
  Search,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  Fuel,
  AlertCircle,
  UserPlus,
} from "lucide-react"
import { motion } from "framer-motion"
import { notifyError } from "@/lib/toast"
import { useAuth } from "@/hooks/use-auth"

interface DriverMetrics {
  id: string
  name: string
  email: string
  phone: string
  avatar_url?: string
  score: number // 0-100
  punctualityScore: number // 0-100
  economyScore: number // 0-100
  safetyScore: number // 0-100
  totalTrips: number
  totalEarnings: number
  avgRating: number
  rank: number
}

export default function MotoristasPage() {
  const { user } = useAuth()
  const [drivers, setDrivers] = useState<DriverMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

  // Métricas gerais
  const [metrics, setMetrics] = useState({
    activeDrivers: 0,
    totalRevenue: 0,
    todayTrips: 0,
    avgRating: 0,
  })

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/transportadora/motoristas')
      const result = await response.json()
      const apiDrivers: DriverMetrics[] = result.drivers
      setDrivers(apiDrivers)

      // Calcular viagens do dia
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStart = today.toISOString()
      const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()

      // Buscar viagens do dia para os motoristas da transportadora
      let todayTripsCount = 0
      try {
        const tripsResponse = await fetch(
          `/api/transportadora/reports/trips?startDate=${todayStart}&endDate=${todayEnd}`
        )
        if (tripsResponse.ok) {
          const tripsData = await tripsResponse.json()
          todayTripsCount = tripsData.total || tripsData.trips?.length || 0
        }
      } catch (err) {
        // Se falhar, usar soma das viagens dos motoristas como fallback
        todayTripsCount = apiDrivers.reduce((sum, d) => sum + (d.totalTrips || 0), 0)
      }

      setMetrics({
        activeDrivers: apiDrivers.length,
        totalRevenue: apiDrivers.reduce((sum, d) => sum + d.totalEarnings, 0),
        todayTrips: todayTripsCount,
        avgRating: apiDrivers.length > 0 
          ? apiDrivers.reduce((sum, d) => sum + d.avgRating, 0) / apiDrivers.length 
          : 0,
      })
    } catch (error) {
      notifyError(error, "Erro ao carregar motoristas")
    } finally {
      setLoading(false)
    }
  }

  const filteredDrivers = drivers.filter((driver) =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
      case 3:
        return "bg-gradient-to-r from-orange-400 to-orange-600 text-white"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <AppShell panel="transportadora" user={user ? { id: user.id, name: user.name || 'Transportadora', email: user.email || 'transp@golffox.com', role: user.role || 'transportadora', avatar_url: (user as any).avatar_url } : { id: 'mock', name: 'Transportadora', email: 'transp@golffox.com', role: 'transportadora' }}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Motoristas</h1>
            <p className="text-sm text-[var(--ink-muted)] mt-1">
              Classificação baseada em performance e indicadores
            </p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Motorista
          </Button>
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-700 mb-1">Motoristas Ativos</p>
                <p className="text-2xl font-bold text-yellow-900">{metrics.activeDrivers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">Faturamento Total</p>
                <p className="text-2xl font-bold text-green-900">
                  R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 mb-1">Corridas do Dia</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.todayTrips}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <Navigation className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700 mb-1">Avaliação Média</p>
                <p className="text-2xl font-bold text-purple-900">{metrics.avgRating.toFixed(1)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs e Busca */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button variant="default" className="bg-orange-500 hover:bg-orange-600">
              Lista de Motoristas
            </Button>
            <Button variant="outline">Ranking de Desempenho</Button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar motorista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Ranking de Desempenho */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Classificação de Desempenho</h2>
          <p className="text-sm text-[var(--ink-muted)] -mt-2">
            Classificação baseada em performance e indicadores de condução
          </p>

          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="space-y-3">
              {filteredDrivers.map((driver, index) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                <Card
                  key={driver.id}
                  className={`p-4 transition-all cursor-pointer hover:shadow-xl bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--brand)]/30 ${selectedDriver === driver.id ? 'ring-2 ring-orange-500' : ''}`}
                  onClick={() => setSelectedDriver(selectedDriver === driver.id ? null : driver.id)}
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Rank Badge e Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-bold text-lg ${getRankBadgeColor(driver.rank)}`}>#{driver.rank}</div>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                          {driver.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base truncate">{driver.name}</p>
                          <p className="text-xs text-[var(--ink-muted)] truncate">{driver.email}</p>
                        </div>
                      </div>
                    </div>
                    {/* Score */}
                    <div className="flex items-center gap-6 flex-wrap lg:flex-nowrap">
                      <div className="text-center">
                        <p className="text-xs text-[var(--ink-muted)] mb-1">Pontuação</p>
                        <p className="text-2xl font-bold text-orange-500">{driver.score}</p>
                        <p className="text-xs text-[var(--ink-muted)]">/100</p>
                      </div>
                      {/* Progress Bars */}
                      <div className="space-y-2 flex-1 min-w-[200px]">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--ink-muted)]">Pontualidade</span>
                            <span className="font-medium">{driver.punctualityScore}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all" style={{ width: `${driver.punctualityScore}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--ink-muted)]">Economia</span>
                            <span className="font-medium">{driver.economyScore}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all" style={{ width: `${driver.economyScore}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--ink-muted)]">Segurança</span>
                            <span className="font-medium">{driver.safetyScore}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all" style={{ width: `${driver.safetyScore}%` }} />
                          </div>
                        </div>
                      </div>
                      {/* Stats */}
                      <div className="flex gap-6">
                        <div className="text-center">
                          <p className="text-xs text-[var(--ink-muted)] mb-1">Corridas</p>
                          <p className="text-lg font-bold">{driver.totalTrips}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[var(--ink-muted)] mb-1">Ganhos</p>
                          <p className="text-lg font-bold text-green-600">
                            R$ {driver.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8"><Award className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="h-8"><Star className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                  {/* Expanded Details */}
                  {selectedDriver === driver.id && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-[var(--ink-muted)]">Pontualidade</p>
                        <p className="text-sm font-medium flex items-center gap-1">{driver.punctualityScore}%<Clock className="h-3 w-3 text-blue-500" /></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-[var(--ink-muted)]">Economia</p>
                        <p className="text-sm font-medium flex items-center gap-1">{driver.economyScore}%<Fuel className="h-3 w-3 text-green-500" /></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-[var(--ink-muted)]">Conformidade</p>
                        <p className="text-sm font-medium flex items-center gap-1">{driver.safetyScore}%<AlertCircle className="h-3 w-3 text-purple-500" /></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-[var(--ink-muted)]">Avaliação</p>
                        <p className="text-sm font-medium flex items-center gap-1">{driver.avgRating.toFixed(1)}<Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /></p>
                      </div>
                    </div>
                  )}
                </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
