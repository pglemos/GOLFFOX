"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Stat } from "@/components/ui/Stat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Truck, 
  Navigation,
  AlertCircle,
  ArrowUpRight,
  MapPin,
  Filter,
  Calendar,
  Activity,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Settings,
  UserPlus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Save,
  X
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { staggerContainer, listItem } from "@/lib/animations"
import { formatCount, formatRelativeTime } from "@/lib/kpi-utils"
import { useAuthFast } from "@/hooks/use-auth-fast"

interface KpiData {
  company_id: string
  company_name: string
  trips_today: number
  vehicles_active: number
  employees_in_transit: number
  critical_alerts: number
  routes_today: number
}

interface AuditLog {
  id: string
  actor_id: string | null
  action_type: string
  resource_type: string | null
  resource_id: string | null
  details: any
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading } = useAuthFast()
  const [kpisData, setKpisData] = useState<KpiData[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [kpisLoading, setKpisLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [tempFilters, setTempFilters] = useState({
    empresa: '',
    data: new Date().toISOString().split('T')[0],
    turno: ''
  })
  const [filters, setFilters] = useState({
    empresa: '',
    data: new Date().toISOString().split('T')[0],
    turno: ''
  })

  const handleSaveFilters = () => {
    setFilters(tempFilters)
    setFiltersExpanded(false)
  }

  const handleResetFilters = () => {
    const resetFilters = {
      empresa: '',
      data: new Date().toISOString().split('T')[0],
      turno: ''
    }
    setTempFilters(resetFilters)
    setFilters(resetFilters)
    setFiltersExpanded(false)
  }

  // Calcular KPIs agregados (todas as empresas ou filtrado)
  const aggregatedKpis = kpisData.reduce((acc, kpi) => {
    if (filters.empresa && kpi.company_id !== filters.empresa) return acc
    return {
      trips_today: acc.trips_today + (kpi.trips_today || 0),
      vehicles_active: acc.vehicles_active + (kpi.vehicles_active || 0),
      employees_in_transit: acc.employees_in_transit + (kpi.employees_in_transit || 0),
      critical_alerts: acc.critical_alerts + (kpi.critical_alerts || 0),
      routes_today: acc.routes_today + (kpi.routes_today || 0),
    }
  }, { trips_today: 0, vehicles_active: 0, employees_in_transit: 0, critical_alerts: 0, routes_today: 0 })

  // Buscar KPIs da view (ou materialized view se disponível)
  useEffect(() => {
    const loadKpis = async () => {
      try {
        setKpisLoading(true)
        // Usar API route para bypass RLS
        const response = await fetch('/api/admin/kpis')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        if (result.success) {
          // Se não houver dados, tentar mapear de views alternativas
          if (result.kpis && result.kpis.length > 0) {
            setKpisData(result.kpis)
          } else {
            // Fallback: dados vazios
            setKpisData([])
          }
        } else {
          setKpisData([])
        }
      } catch (err: unknown) {
        console.error('Erro ao carregar KPIs:', err)
        setKpisData([])
      } finally {
        setKpisLoading(false)
      }
    }

    if (!loading) {
      loadKpis()
    }
  }, [loading, filters.empresa])

  // Buscar atividades recentes (gf_audit_log)
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setActivitiesLoading(true)
        // Usar API route para bypass RLS
        const response = await fetch('/api/admin/audit-log?limit=50')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        if (result.success) {
          setAuditLogs(result.logs || [])
        } else {
          setAuditLogs([])
        }
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
        setAuditLogs([])
      } finally {
        setActivitiesLoading(false)
      }
    }

    if (!loading) {
      loadActivities()
    }
  }, [loading])

  // Função para obter ícone por action_type
  const getActionIcon = (actionType: string) => {
    const iconMap: Record<string, any> = {
      'create': Plus,
      'update': Edit,
      'delete': Trash2,
      'approve': CheckCircle,
      'reject': XCircle,
      'configure': Settings,
      'invite': UserPlus,
      'export': FileText,
      'login': Activity,
      'logout': Activity,
    }
    return iconMap[actionType.toLowerCase()] || Activity
  }

  // Função para obter cor por action_type
  const getActionColor = (actionType: string) => {
    const colorMap: Record<string, string> = {
      'create': 'bg-[var(--success)]',
      'update': 'bg-[var(--brand)]',
      'delete': 'bg-[var(--error)]',
      'approve': 'bg-[var(--success)]',
      'reject': 'bg-[var(--error)]',
      'configure': 'bg-[var(--brand)]',
      'invite': 'bg-[var(--brand)]',
      'export': 'bg-[var(--brand)]',
    }
    return colorMap[actionType.toLowerCase()] || 'bg-[var(--brand)]'
  }

  // useAuthFast já cuida da autenticação

  if (loading || kpisLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="loader-spinner mx-auto"></div>
          <p className="mt-4 text-[var(--ink-muted)]">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.replace('/?next=/admin')
    return null
  }

  if ((user as any).role && (user as any).role !== 'admin') {
    router.replace('/unauthorized')
    return null
  }

  return (
    <AppShell user={{
      id: user.id || "",
      name: user.name || "Admin",
      email: user.email || "",
      role: user.role || "admin"
    }}>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Filtros */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-[var(--brand)]" />
                <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="gap-2"
              >
                {filtersExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Minimizar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Expandir
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {filtersExpanded && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink-strong)]">Empresa</label>
                  <Input
                    placeholder="Todas as empresas"
                    value={tempFilters.empresa}
                    onChange={(e) => setTempFilters({ ...tempFilters, empresa: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink-strong)]">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)] pointer-events-none" />
                    <Input
                      type="date"
                      value={tempFilters.data}
                      onChange={(e) => setTempFilters({ ...tempFilters, data: e.target.value })}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink-strong)]">Turno</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-20 transition-all"
                    value={tempFilters.turno}
                    onChange={(e) => setTempFilters({ ...tempFilters, turno: e.target.value })}
                  >
                    <option value="">Todos os turnos</option>
                    <option value="manha">Manhã</option>
                    <option value="tarde">Tarde</option>
                    <option value="noite">Noite</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveFilters}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar Filtros
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* KPIs */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid-responsive-cards"
        >
          <motion.div variants={listItem}>
            <Stat
              icon={Users}
              label="Colaboradores em Trânsito"
              value={formatCount(aggregatedKpis.employees_in_transit)}
              hint="Ativo agora"
            />
          </motion.div>
          <motion.div variants={listItem}>
            <Stat
              icon={Truck}
              label="Veículos Ativos"
              value={formatCount(aggregatedKpis.vehicles_active)}
              hint="Em rota"
            />
          </motion.div>
          <motion.div variants={listItem}>
            <Stat
              icon={Navigation}
              label="Rotas do Dia"
              value={formatCount(aggregatedKpis.routes_today)}
              hint="Hoje"
            />
          </motion.div>
          <motion.div variants={listItem}>
            <Stat
              icon={AlertCircle}
              label="Alertas Críticos"
              value={formatCount(aggregatedKpis.critical_alerts)}
              hint="Atenção necessária"
            />
          </motion.div>
        </motion.div>

        {/* Cards de Ação Rápida */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Mapa da Frota Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <a href="/admin/mapa" className="block h-full">
              <Card hover className="card-glass cursor-pointer h-full overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <CardTitle className="text-xl font-semibold mb-1.5 truncate">Mapa da Frota</CardTitle>
                      <p className="text-sm text-[var(--ink-muted)] line-clamp-2">Visualize veículos em tempo real</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--brand-light)] group-hover:bg-[var(--brand)] transition-colors flex-shrink-0">
                      <MapPin className="h-5 w-5 text-[var(--brand)] group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-40 bg-gradient-to-br from-[var(--brand)]/10 to-[var(--accent)]/10 rounded-lg flex items-center justify-center group-hover:from-[var(--brand)]/20 group-hover:to-[var(--accent)]/20 transition-all overflow-hidden">
                    <MapPin className="h-16 w-16 text-[var(--brand)] opacity-30 group-hover:opacity-50 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </a>
          </motion.div>

          {/* Notificações Recentes */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <CardTitle className="text-xl font-semibold mb-1.5 truncate">Notificações Recentes</CardTitle>
                    <p className="text-sm text-[var(--ink-muted)] line-clamp-2">Últimas atualizações do sistema</p>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0" asChild>
                    <a href="/admin/alertas">
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors border border-transparent hover:border-[var(--border)]">
                      <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ink-strong)] truncate">Alerta #{i}</p>
                        <p className="text-xs text-[var(--ink-muted)] truncate">Há {i} minutos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Atividades Recentes */}
        <div>
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold mb-1.5">Atividades Recentes</CardTitle>
                  <p className="text-sm text-[var(--ink-muted)]">Histórico de ações do sistema</p>
                </div>
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {activitiesLoading ? (
                <div className="p-12 text-center text-[var(--ink-muted)]">
                  <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm">Carregando atividades...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-12 text-center text-[var(--ink-muted)]">
                  <p className="text-sm">Nenhuma atividade recente</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {auditLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action_type)
                    const actionColor = getActionColor(log.action_type)
                    const resourceName = log.resource_type 
                      ? `${log.resource_type}${log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}`
                      : 'Sistema'
                    const actionText = log.action_type 
                      ? log.action_type.charAt(0).toUpperCase() + log.action_type.slice(1).toLowerCase()
                      : 'Ação'
                    
                    return (
                      <div key={log.id} className="p-4 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-4 group">
                        <div className={`w-10 h-10 rounded-lg ${actionColor} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                          <ActionIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[var(--ink-strong)] truncate">
                            {actionText}: {resourceName}
                          </p>
                          <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5">
                            {formatRelativeTime(log.created_at)}
                            {log.details?.companyId && ` • Empresa: ${log.details.companyId.slice(0, 8)}`}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">{log.action_type}</Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
