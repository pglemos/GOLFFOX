"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Stat } from "@/components/ui/Stat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Hero } from "@/components/ui/Hero"
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
  Clock
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { staggerContainer, listItem } from "@/lib/animations"
import { formatCount, formatRelativeTime } from "@/lib/kpi-utils"

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
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [kpisData, setKpisData] = useState<KpiData[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [kpisLoading, setKpisLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [filters, setFilters] = useState({
    empresa: '',
    data: new Date().toISOString().split('T')[0],
    turno: ''
  })

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
        // Estratégia: tentar materialized view -> view admin -> view operador
        const tryFetch = async (viewName: string) => {
          const { data, error } = await supabase.from(viewName as any).select('*')
          if (error) {
            // Tratar erro de view inexistente (PGRST205) como "não disponível"
            const code = (error as any)?.code
            if (code === 'PGRST205') {
              return { ok: false, data: null }
            }
            // Outros erros: logar e seguir para próximo fallback
            console.warn(`Falha ao ler ${viewName}:`, error.message)
            return { ok: false, data: null }
          }
          if (!data || data.length === 0) {
            return { ok: false, data: null }
          }
          return { ok: true, data }
        }

        // 1) Materialized view
        const mv = await tryFetch('mv_admin_kpis')
        if (mv.ok) {
          setKpisData(mv.data as any)
          return
        }

        // 2) View admin
        const adminView = await tryFetch('v_admin_dashboard_kpis')
        if (adminView.ok) {
          setKpisData(adminView.data as any)
          return
        }

        // 3) Fallback: usar view do operador se disponível
        const operatorView = await tryFetch('v_operator_dashboard_kpis')
        if (operatorView.ok) {
          // Mapeia campos do operador para KpiData se necessário
          const mapped = (operatorView.data as any[]).map((row) => ({
            company_id: row.company_id || row.company || '',
            company_name: row.company_name || row.company || 'Empresa',
            trips_today: row.trips_today ?? row.trips ?? 0,
            vehicles_active: row.vehicles_active ?? row.vehicles ?? 0,
            employees_in_transit: row.employees_in_transit ?? row.employees ?? 0,
            critical_alerts: row.critical_alerts ?? row.alerts ?? 0,
            routes_today: row.routes_today ?? row.routes ?? 0,
          }))
          setKpisData(mapped)
          return
        }

        // 4) Último recurso: sem views, evitar erro e exibir vazio
        // Views de KPIs não disponíveis; exibindo dados vazios
        setKpisData([])
      } catch (err: unknown) {
        logError('Erro ao carregar KPIs', { error: err }, 'AdminPage')
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
        const { data, error } = await supabase
          .from('gf_audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (error) {
          console.error('Erro ao carregar atividades:', error)
          setAuditLogs([])
        } else {
          setAuditLogs(data || [])
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

  useEffect(() => {
    const getUser = async () => {
      // Primeiro, tentar obter usuário do cookie de sessão customizado
      if (typeof document !== 'undefined') {
        const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
        if (cookieMatch) {
          try {
            const decoded = atob(cookieMatch[1])
            const u = JSON.parse(decoded)
            if (u?.id && u?.email) {
              setUser({ id: u.id, email: u.email, name: u.email.split('@')[0], role: u.role || 'admin' })
              setLoading(false)
              return
            }
          } catch {}
        }
      }

      // Fallback: tentar sessão do Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Sem sessão detectada; deixar o middleware proteger o acesso
        // Evitar loop de redirect no cliente
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()

      setUser({ ...session.user, ...data })
      setLoading(false)
    }

    getUser()
  }, [router])

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

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Admin",
      email: user?.email || "",
      role: "admin"
    }}>
      <div className="space-y-8 animate-fade-in">
        {/* Hero Header com Glassmorphism */}
        <Hero 
          glass 
          title="Painel Administrativo"
          description="Gerencie rotas, usuários, transportadoras e métricas em tempo real"
        />

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[var(--brand)]" />
              <CardTitle className="text-lg">Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Empresa</label>
                <Input
                  placeholder="Todas as empresas"
                  value={filters.empresa}
                  onChange={(e) => setFilters({ ...filters, empresa: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
                  <Input
                    type="date"
                    value={filters.data}
                    onChange={(e) => setFilters({ ...filters, data: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Turno</label>
                <select
                  className="w-full px-3 py-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-20"
                  value={filters.turno}
                  onChange={(e) => setFilters({ ...filters, turno: e.target.value })}
                >
                  <option value="">Todos os turnos</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                </select>
              </div>
            </div>
          </CardContent>
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
            <Link href="/admin/mapa">
              <Card hover className="card-glass cursor-pointer p-4 sm:p-6 lg:p-8">
                <div className="flex items-start justify-between mb-4 lg:mb-6">
                  <div>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl mb-2">Mapa da Frota</CardTitle>
                    <p className="text-xs sm:text-sm text-[var(--ink-muted)]">Visualize veículos em tempo real</p>
                  </div>
                  <div className="p-2 lg:p-3 rounded-full bg-[var(--brand-light)] group-hover:bg-[var(--brand)] transition-colors">
                    <MapPin className="h-5 w-5 lg:h-6 lg:w-6 text-[var(--brand)] group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div className="h-32 sm:h-36 lg:h-40 bg-gradient-to-br from-[var(--brand)]/10 to-[var(--accent)]/10 rounded-xl flex items-center justify-center group-hover:from-[var(--brand)]/20 group-hover:to-[var(--accent)]/20 transition-all">
                  <MapPin className="h-12 w-12 lg:h-16 lg:w-16 text-[var(--brand)] opacity-30 group-hover:opacity-50 transition-opacity" />
                </div>
              </Card>
            </Link>
          </motion.div>

          {/* Notificações Recentes */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <div className="flex items-start justify-between mb-4 lg:mb-6">
                <div>
                  <CardTitle className="text-lg sm:text-xl mb-2">Notificações Recentes</CardTitle>
                  <p className="text-xs sm:text-sm text-[var(--ink-muted)]">Últimas atualizações do sistema</p>
                </div>
                <Button variant="ghost" size="sm" className="btn-responsive" asChild>
                  <Link href="/admin/alertas">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Ver todas</span>
                    <span className="sm:hidden">Ver</span>
                  </Link>
                </Button>
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse-glow flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Alerta #{i}</p>
                      <p className="text-xs text-[var(--ink-muted)] truncate">Há {i} minutos</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Atividades Recentes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">Atividades Recentes</h2>
            <Button variant="ghost" size="sm" className="btn-responsive">
              <span className="hidden sm:inline">Ver todas</span>
              <span className="sm:hidden">Ver</span>
            </Button>
          </div>
          <Card>
            {activitiesLoading ? (
              <div className="p-8 text-center text-[var(--ink-muted)]">
                Carregando atividades...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-[var(--ink-muted)]">
                Nenhuma atividade recente
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
                    <div key={log.id} className="p-4 sm:p-6 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${actionColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <ActionIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base sm:text-lg truncate">
                          {actionText}: {resourceName}
                        </p>
                        <p className="text-xs sm:text-sm text-[var(--ink-muted)] truncate">
                          {formatRelativeTime(log.created_at)}
                          {log.details?.companyId && ` • Empresa: ${log.details.companyId.slice(0, 8)}`}
                        </p>
                      </div>
                      <Badge className="text-xs">{log.action_type}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
