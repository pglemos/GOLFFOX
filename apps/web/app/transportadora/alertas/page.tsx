"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Truck,
  Users,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { motion } from "framer-motion"
import { useTransportadoraAlerts, useResolveTransportadoraAlert } from "@/hooks/use-transportadora-data"
import { useTransportadoraTenant } from "@/components/providers/transportadora-tenant-provider"

export default function AlertasPage() {
  const { user } = useAuth()
  const { transportadoraName } = useTransportadoraTenant()
  const { data: alerts = [], isLoading: loading } = useTransportadoraAlerts()
  const { mutate: resolveAlert } = useResolveTransportadoraAlert()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)

  // Contadores
  const alertCounts = {
    veiculo_parado: alerts.filter((a: any) => a.alert_type === "veiculo_parado" && !a.is_resolved).length,
    critico: alerts.filter((a: any) => a.severity === "critical" && !a.is_resolved).length,
    aviso: alerts.filter((a: any) => a.severity === "warning" && !a.is_resolved).length,
    informativo: alerts.filter((a: any) => a.severity === "info" && !a.is_resolved).length,
  }

  const handleResolve = (alertId: string) => {
    resolveAlert(alertId)
  }

  const getAlertTypeConfig = (type: string, severity: string) => {
    // Mapear tipos sistema para UI
    if (type === 'veiculo_parado') return { icon: Truck, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Veículo Parado" }

    // Fallback por severidade
    switch (severity) {
      case "critical":
        return { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Crítico" }
      case "warning":
        return { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", label: "Aviso" }
      case "info":
      default:
        return { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Informativo" }
    }
  }

  const filteredAlerts = alerts.filter((alert: any) => {
    const meta = alert.metadata || {}
    const searchString = `${alert.message} ${alert.alert_type} ${meta.driver_name || ''} ${meta.plate || ''}`.toLowerCase()

    const matchesSearch = searchString.includes(searchTerm.toLowerCase())

    // Mapeamento simples de filtro por tipo (poderia ser melhorado)
    let matchesType = true
    if (selectedType !== 'all') {
      if (selectedType === 'critico') matchesType = alert.severity === 'critical'
      else if (selectedType === 'aviso') matchesType = alert.severity === 'warning'
      else if (selectedType === 'informativo') matchesType = alert.severity === 'info'
      else if (selectedType === 'veiculo_parado') matchesType = alert.alert_type === 'veiculo_parado'
    }

    const matchesUnread = !showOnlyUnread || !alert.is_read // Assumindo is_read ou is_resolved? O filtro UI diz "Apenas não lidos", mas logicamente seria "Não resolvidos".
    // Vou usar !is_resolved para simplificar pois resolucao remove da lista padrao do hook.
    // Espere, o hook filtra is_resolved=false por padrao? Sim.
    // Então todos aqui sao nao resolvidos.

    return matchesSearch && matchesType
  })

  return (
    <AppShell panel="transportadora" user={user ? { id: user.id, name: transportadoraName, email: user.email || '', role: 'transportadora', avatar_url: (user as any).avatar_url } : undefined}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Alertas Operacionais</h1>
            <p className="text-sm text-[var(--ink-muted)] mt-1">
              Monitore a saúde da sua frota e motoristas
            </p>
          </div>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cards de contadores (mantidos da lógica anterior) */}
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
        </div>

        {/* Filtros e Lista */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por placa, motorista ou mensagem..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent" />
            <p className="mt-4 text-[var(--ink-muted)]">Carregando alertas...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-[var(--ink-muted)]">Tudo certo por aqui!</p>
            <p className="text-sm text-[var(--ink-muted)] mt-1">Nenhum alerta pendente.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert: any, index: number) => {
              const cfg = getAlertTypeConfig(alert.alert_type, alert.severity)
              const Icon = cfg.icon
              const meta = alert.metadata || {}

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card
                    key={alert.id}
                    className={cn("p-4 transition-all hover:shadow-xl bg-card/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--brand)]/30", cfg.border, cfg.bg)}
                  >
                    <div className="flex gap-4">
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", cfg.bg)}>
                        <Icon className={cn("h-5 w-5", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {/* Titulo baseado no tipo ou mensagem */}
                              <h3 className="font-semibold capitalize">{alert.alert_type.replace(/_/g, ' ')}</h3>
                              <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                            </div>
                            <p className="text-sm text-[var(--ink-muted)]">{alert.message}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 mt-2">
                          <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => handleResolve(alert.id)}>
                            Resolver / Marcar Visto
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-[var(--ink-muted)] mt-2 border-t pt-2 border-dashed border-gray-200">
                      {meta.plate && (
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" /> {meta.plate}
                        </span>
                      )}
                      {meta.driver_name && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {meta.driver_name}
                        </span>
                      )}
                      {/* Data expiry se houver */}
                      {meta.expiry_date && (
                        <span className="flex items-center gap-1 text-red-500 font-semibold">
                          Vencimento: {new Date(meta.expiry_date).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="h-3 w-3" /> {new Date(alert.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
