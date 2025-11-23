"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  AlertCircle,
  Info,
  TruckIcon,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react"
import { notifyError, notifySuccess } from "@/lib/toast"
import { cn } from "@/lib/utils"

interface Alert {
  id: string
  type: 'veiculo_parado' | 'critico' | 'aviso' | 'informativo'
  title: string
  description: string
  timestamp: Date
  vehicle?: string
  driver?: string
  location?: string
  status: 'pending' | 'acknowledged' | 'resolved'
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)

  // Contadores por tipo
  const alertCounts = {
    veiculo_parado: alerts.filter(a => a.type === 'veiculo_parado' && a.status === 'pending').length,
    critico: alerts.filter(a => a.type === 'critico' && a.status === 'pending').length,
    aviso: alerts.filter(a => a.type === 'aviso' && a.status === 'pending').length,
    informativo: alerts.filter(a => a.type === 'informativo' && a.status === 'pending').length,
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      // TODO: Implementar chamada real à API
      // Dados mockados
      const mockAlerts: Alert[] = []

      setAlerts(mockAlerts)
    } catch (error) {
      notifyError(error, "Erro ao carregar alertas")
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledge = async (alertId: string) => {
    try {
      // TODO: Implementar chamada à API
      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, status: 'acknowledged' } : a
      ))
      notifySuccess("Alerta marcado como lido")
    } catch (error) {
      notifyError(error, "Erro ao marcar alerta")
    }
  }

  const handleResolve = async (alertId: string) => {
    try {
      // TODO: Implementar chamada à API
      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, status: 'resolved' } : a
      ))
      notifySuccess("Alerta resolvido")
    } catch (error) {
      notifyError(error, "Erro ao resolver alerta")
    }
  }

  const getAlertTypeConfig = (type: Alert['type']) => {
    switch (type) {
      case 'veiculo_parado':
        return {
          icon: TruckIcon,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Veículo Parado'
        }
      case 'critico':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Crítico'
        }
      case 'aviso':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          label: 'Aviso'
        }
      case 'informativo':
        return {
          icon: Info,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Informativo'
        }
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.vehicle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.driver?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === "all" || alert.type === selectedType
    const matchesUnread = !showOnlyUnread || alert.status === 'pending'

    return matchesSearch && matchesType && matchesUnread
  })

  return (
    <AppShell panel="transportadora">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Sistema de Alertas</h1>
            <p className="text-sm text-[var(--ink-muted)] mt-1">
              Monitore e gerencie alertas operacionais em tempo real
            </p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            Criar Alerta
          </Button>
        </div>

        {/* Contadores de Alertas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              selectedType === "veiculo_parado" && "ring-2 ring-red-500"
            )}
            onClick={() => setSelectedType(selectedType === "veiculo_parado" ? "all" : "veiculo_parado")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Veículos Parados</p>
                <p className="text-3xl font-bold text-red-600">{alertCounts.veiculo_parado}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <TruckIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              selectedType === "critico" && "ring-2 ring-red-500"
            )}
            onClick={() => setSelectedType(selectedType === "critico" ? "all" : "critico")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Críticos</p>
                <p className="text-3xl font-bold text-red-600">{alertCounts.critico}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              selectedType === "aviso" && "ring-2 ring-yellow-500"
            )}
            onClick={() => setSelectedType(selectedType === "aviso" ? "all" : "aviso")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Avisos</p>
                <p className="text-3xl font-bold text-yellow-600">{alertCounts.aviso}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              selectedType === "informativo" && "ring-2 ring-blue-500"
            )}
            onClick={() => setSelectedType(selectedType === "informativo" ? "all" : "informativo")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Informativos</p>
                <p className="text-3xl font-bold text-blue-600">{alertCounts.informativo}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar em todos os alertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showOnlyUnread ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                className={showOnlyUnread ? "bg-orange-500 hover:bg-orange-600" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Apenas não lidos
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Hoje
              </Button>
            </div>
          </div>
        </Card>

        {/* Lista de Alertas */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
            <p className="mt-4 text-[var(--ink-muted)]">Carregando alertas...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-[var(--ink-muted)]">
              Nenhum alerta encontrado
            </p>
            <p className="text-sm text-[var(--ink-muted)] mt-1">
              Não há alertas no momento.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const config = getAlertTypeConfig(alert.type)
              const Icon = config.icon

              return (
                <Card
                  key={alert.id}
                  className={cn(
                    "p-4 transition-all",
                    config.border,
                    alert.status === 'pending' && config.bg
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", config.bg)}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge variant="outline" className={cn("text-xs", config.color)}>
                              {config.label}
                            </Badge>
                            {alert.status === 'resolved' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Resolvido
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-[var(--ink-muted)]">{alert.description}</p>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {alert.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAcknowledge(alert.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolve(alert.id)}
                                className="text-green-600 hover:bg-green-50"
                              >
                                Resolver
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-[var(--ink-muted)]">
                        {alert.vehicle && (
                          <span className="flex items-center gap-1">
                            <TruckIcon className="h-3 w-3" />
                            {alert.vehicle}
                          </span>
                        )}
                        {alert.driver && (
                          <span className="flex items-center gap-1">
                            <users className="h-3 w-3" />
                            {alert.driver}
                          </span>
                        )}
                        {alert.location && (
                          <span className="flex items-center gap-1">
                            <mapPin className="h-3 w-3" />
                            {alert.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
