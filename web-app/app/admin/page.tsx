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
  TrendingUp
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { staggerContainer, listItem } from "@/lib/animations"
import { useSupabaseCount } from "@/hooks/use-supabase-query"

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    empresa: '',
    data: new Date().toISOString().split('T')[0],
    turno: ''
  })

  // Usar o novo hook para cada consulta de KPI
  const { data: colaboradoresTransito, loading: loadingColaboradores } = useSupabaseCount(
    'trip_passengers',
    {},
    { cacheKey: 'colaboradores_transito', retryAttempts: 3 }
  )

  const { data: veiculosAtivos, loading: loadingVeiculos } = useSupabaseCount(
    'trips',
    { status: 'inProgress' },
    { cacheKey: 'veiculos_ativos', retryAttempts: 3 }
  )

  const { data: rotasDia, loading: loadingRotas } = useSupabaseCount(
    'trips',
    { scheduled_at: { gte: new Date().toISOString().split('T')[0] } },
    { cacheKey: 'rotas_dia', retryAttempts: 3 }
  )

  const { data: alertasCriticos, loading: loadingAlertas } = useSupabaseCount(
    'gf_alerts',
    { severity: 'critical', is_resolved: false },
    { cacheKey: 'alertas_criticos', retryAttempts: 3 }
  )

  const kpis = {
    colaboradoresTransito: colaboradoresTransito || 0,
    veiculosAtivos: veiculosAtivos || 0,
    rotasDia: rotasDia || 0,
    alertasCriticos: alertasCriticos || 0
  }

  const kpisLoading = loadingColaboradores || loadingVeiculos || loadingRotas || loadingAlertas

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
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

  // Remover o useEffect complexo de KPIs, pois agora usamos hooks individuais

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

  const activities = [
    { 
      title: "Viagem #84A1D2C0", 
      subtitle: "Rota Curvelo → Matriz", 
      status: "Em andamento",
      statusColor: "bg-[var(--brand)]"
    },
    { 
      title: "Alerta #C202", 
      subtitle: "12 min de atraso • Ônibus 03", 
      status: "Aberto",
      statusColor: "bg-[var(--error)]"
    },
    { 
      title: "Usuário criado", 
      subtitle: "Operador: Maria Silva", 
      status: "Concluído",
      statusColor: "bg-[var(--success)]"
    },
  ]

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
              value={kpis.colaboradoresTransito}
              hint="Ativo agora"
              trend={5}
            />
          </motion.div>
          <motion.div variants={listItem}>
            <Stat
              icon={Truck}
              label="Veículos Ativos"
              value={kpis.veiculosAtivos}
              hint="Em rota"
              trend={2}
            />
          </motion.div>
          <motion.div variants={listItem}>
            <Stat
              icon={Navigation}
              label="Rotas do Dia"
              value={kpis.rotasDia}
              hint="Hoje"
            />
          </motion.div>
          <motion.div variants={listItem}>
            <Stat
              icon={AlertCircle}
              label="Alertas Críticos"
              value={kpis.alertasCriticos}
              hint="Atenção necessária"
              trend={-3}
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
            <div className="divide-y divide-[var(--border)]">
              {activities.map((activity, i) => (
                <div key={i} className="p-4 sm:p-6 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${activity.statusColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base sm:text-lg truncate">{activity.title}</p>
                    <p className="text-xs sm:text-sm text-[var(--ink-muted)] truncate">{activity.subtitle}</p>
                  </div>
                  <Badge className="text-xs">{activity.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
