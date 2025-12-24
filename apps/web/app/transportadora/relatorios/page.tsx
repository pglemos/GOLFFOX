"use client"

import { useEffect, useState } from "react"

import { motion } from "framer-motion"
import { BarChart3, Download, FileText, Calendar, Filter } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF
} from "@/lib/export-utils"
import { useRouter } from "@/lib/next-navigation"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { logError } from "@/lib/logger"


interface ReportConfig {
  id: string
  title: string
  description: string
  icon: typeof FileText
}

export default function TransportadoraRelatoriosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateStart, setDateStart] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0])
  const [loadingReport, setLoadingReport] = useState<string | null>(null)

  const reports: ReportConfig[] = [
    { 
      id: 'fleet',
      title: 'Frota em Uso', 
      description: 'Relatório de utilização da frota',
      icon: BarChart3
    },
    { 
      id: 'motoristas',
      title: 'Performance de Motoristas', 
      description: 'Análise de desempenho dos motoristas',
      icon: BarChart3
    },
    { 
      id: 'trips',
      title: 'Viagens Realizadas', 
      description: 'Relatório de viagens completadas',
      icon: FileText
    },
    { 
      id: 'costs',
      title: 'Relatório de Custos', 
      description: 'Análise detalhada de custos por veículo e rota',
      icon: FileText
    },
    { 
      id: 'maintenances',
      title: 'Relatório de Manutenções', 
      description: 'Histórico e custos de manutenções',
      icon: FileText
    },
    { 
      id: 'documents',
      title: 'Relatório de Documentos', 
      description: 'Status e vencimentos de documentos',
      icon: FileText
    },
  ]

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }

      const { data } = await supabase
        .from("users")
        .select("transportadora_id")
        .eq("id", session.user.id)
        .single()

      setUser({ ...session.user })
      setUserData(data || null)
      setLoading(false)
    }
    getUser()
  }, [router])

  const handleExport = async (report: ReportConfig, format: 'csv' | 'excel' | 'pdf') => {
    const transportadoraId = userData?.transportadora_id
    if (!transportadoraId) {
      notifyError(null, 'Erro: Transportadora não encontrada', {})
      return
    }

    setLoadingReport(report.id)
    try {
      let apiUrl = ''
      let headers: string[] = []
      let rows: any[][] = []
      let summary: any = null

      // Buscar dados da API
      switch (report.id) {
        case 'fleet':
          apiUrl = `/api/transportadora/relatorios/fleet-usage?transportadora_id=${transportadoraId}&start_date=${dateStart}&end_date=${dateEnd}`
          const fleetRes = await fetch(apiUrl)
          const fleetData = await fleetRes.json()
          if (fleetData.success) {
            headers = ['Placa', 'Modelo', 'Status', 'Total de Viagens', 'Viagens no Período', 'Taxa de Utilização (%)']
            rows = fleetData.data.map((v: any) => [
              v.plate,
              v.model || 'N/A',
              v.is_active ? 'Ativo' : 'Inativo',
              v.total_trips,
              v.trips_in_period,
              v.utilization_rate.toFixed(2)
            ])
            summary = fleetData.summary
          }
          break
        case 'motoristas':
          apiUrl = `/api/transportadora/relatorios/motorista-performance?transportadora_id=${transportadoraId}&start_date=${dateStart}&end_date=${dateEnd}`
          const driversRes = await fetch(apiUrl)
          const driversData = await driversRes.json()
          if (driversData.success) {
            headers = ['Nome', 'Email', 'Total de Viagens', 'Viagens no Período', 'Pontuação', 'Avaliação', 'Pontualidade (%)']
            rows = driversData.data.map((d: any) => [
              d.name,
              d.email || 'N/A',
              d.total_trips,
              d.trips_in_period,
              d.total_points,
              d.rating,
              d.on_time_percentage.toFixed(2)
            ])
            summary = driversData.summary
          }
          break
        case 'trips':
          apiUrl = `/api/transportadora/relatorios/trips?transportadora_id=${transportadoraId}&start_date=${dateStart}&end_date=${dateEnd}`
          const tripsRes = await fetch(apiUrl)
          const tripsData = await tripsRes.json()
          if (tripsData.success) {
            headers = ['Rota', 'Motorista', 'Data de Criação', 'Data de Conclusão', 'Status', 'Passageiros', 'Duração (min)']
            rows = tripsData.data.map((t: any) => [
              t.route_name,
              t.motorista_name,
              new Date(t.created_at).toLocaleDateString('pt-BR'),
              t.completed_at ? new Date(t.completed_at).toLocaleDateString('pt-BR') : 'N/A',
              t.status,
              t.passenger_count,
              t.duration_minutes || 'N/A'
            ])
            summary = tripsData.summary
          }
          break
        case 'costs':
          // Buscar custos de veículos e rotas
          const [costsVehicleRes, costsRouteRes] = await Promise.all([
            fetch(`/api/transportadora/custos/veiculo?start_date=${dateStart}&end_date=${dateEnd}`),
            fetch(`/api/transportadora/custos/route?start_date=${dateStart}&end_date=${dateEnd}`)
          ])
          const costsVehicleData = costsVehicleRes.ok ? await costsVehicleRes.json() : []
          const costsRouteData = costsRouteRes.ok ? await costsRouteRes.json() : []
          
          headers = ['Tipo', 'Veículo/Rota', 'Categoria', 'Data', 'Valor (R$)', 'Descrição']
          rows = [
            ...(costsVehicleData || []).map((c: any) => [
              'Veículo',
              c.veiculos?.plate || 'N/A',
              c.cost_category || 'N/A',
              new Date(c.cost_date || c.created_at).toLocaleDateString('pt-BR'),
              parseFloat(c.amount_brl?.toString() || '0').toFixed(2),
              c.description || 'N/A'
            ]),
            ...(costsRouteData || []).map((r: any) => [
              'Rota',
              r.routes?.name || 'N/A',
              'Rota',
              new Date(r.created_at).toLocaleDateString('pt-BR'),
              parseFloat(r.total_cost_brl?.toString() || '0').toFixed(2),
              'Custos da rota'
            ])
          ]
          const totalCosts = [...(costsVehicleData || []), ...(costsRouteData || [])].reduce((sum: number, item: any) => 
            sum + parseFloat(item.amount_brl?.toString() || item.total_cost_brl?.toString() || '0'), 0
          )
          summary = {
            total_costs: totalCosts,
            vehicle_costs: (costsVehicleData || []).reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl?.toString() || '0'), 0),
            route_costs: (costsRouteData || []).reduce((sum: number, r: any) => sum + parseFloat(r.total_cost_brl?.toString() || '0'), 0)
          }
          break
        case 'maintenances':
          // Buscar manutenções
          const { data: maintenancesData } = await supabase
            .from('vehicle_maintenances' as any)
            .select(`
              *,
              veiculos!inner(transportadora_id, plate)
            `)
            .eq('veiculos.transportadora_id', transportadoraId)
            .gte('scheduled_date', dateStart)
            .lte('scheduled_date', dateEnd)
          
          headers = ['Veículo', 'Tipo', 'Status', 'Data Agendada', 'Data Concluída', 'Custo Total (R$)', 'Oficina', 'Descrição']
          rows = (maintenancesData || []).map((m: any) => [
            m.veiculos?.plate || 'N/A',
            m.maintenance_type || 'N/A',
            m.status === 'completed' ? 'Concluída' : m.status === 'in_progress' ? 'Em Andamento' : m.status === 'scheduled' ? 'Agendada' : 'Cancelada',
            m.scheduled_date ? new Date(m.scheduled_date).toLocaleDateString('pt-BR') : 'N/A',
            m.completed_date ? new Date(m.completed_date).toLocaleDateString('pt-BR') : 'N/A',
            (parseFloat(m.cost_parts_brl?.toString() || '0') + parseFloat(m.cost_labor_brl?.toString() || '0')).toFixed(2),
            m.workshop_name || 'N/A',
            m.description || 'N/A'
          ])
          const totalMaintenanceCosts = (maintenancesData || []).reduce((sum: number, m: any) => 
            sum + parseFloat(m.cost_parts_brl?.toString() || '0') + parseFloat(m.cost_labor_brl?.toString() || '0'), 0
          )
          summary = {
            total_maintenances: maintenancesData?.length || 0,
            completed: (maintenancesData || []).filter((m: any) => m.status === 'completed').length,
            total_costs: totalMaintenanceCosts
          }
          break
        case 'documents':
          // Buscar documentos vencendo
          const { data: documentsData } = await supabase
            .from('v_carrier_expiring_documents')
            .select('*')
            .eq('transportadora_id', transportadoraId)
            .gte('expiry_date', dateStart)
            .lte('expiry_date', dateEnd)
          
          headers = ['Tipo', 'Entidade', 'Documento', 'Nível de Alerta', 'Data de Vencimento', 'Dias Restantes']
          rows = (documentsData || []).map((d: any) => [
            d.item_type === 'motorista_document' ? 'Motorista' : d.item_type === 'veiculo_document' ? 'Veículo' : 'Exame',
            d.entity_name || 'N/A',
            d.document_type || 'N/A',
            d.alert_level === 'expired' ? 'Vencido' : d.alert_level === 'critical' ? 'Crítico' : 'Atenção',
            d.expiry_date ? new Date(d.expiry_date).toLocaleDateString('pt-BR') : 'N/A',
            d.days_to_expiry || 0
          ])
          summary = {
            total_documents: documentsData?.length || 0,
            expired: (documentsData || []).filter((d: any) => d.alert_level === 'expired').length,
            critical: (documentsData || []).filter((d: any) => d.alert_level === 'critical').length,
            warning: (documentsData || []).filter((d: any) => d.alert_level === 'warning').length
          }
          break
      }

      if (rows.length === 0) {
        notifyError(null, 'Nenhum dado encontrado para o período selecionado', {})
        setLoadingReport(null)
        return
      }

      // Adicionar resumo ao início
      const summaryRows: any[][] = []
      if (summary) {
        summaryRows.push(['Resumo do Relatório'])
        summaryRows.push([])
        Object.entries(summary).forEach(([key, value]) => {
          summaryRows.push([key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), String(value)])
        })
        summaryRows.push([])
        summaryRows.push(['Dados Detalhados'])
        summaryRows.push([])
      }

      const formattedData = {
        title: report.title,
        description: `${report.description} - Período: ${new Date(dateStart).toLocaleDateString('pt-BR')} a ${new Date(dateEnd).toLocaleDateString('pt-BR')}`,
        headers,
        rows: [...summaryRows, ...rows]
      }

      const filename = `${report.id}-${dateStart}-${dateEnd}.${format === 'excel' ? 'xlsx' : format}`

      switch (format) {
        case 'csv':
          exportToCSV(formattedData, filename)
          notifySuccess('', { i18n: { ns: 'common', key: 'success.exportCsv' } })
          break
        case 'excel':
          exportToExcel(formattedData, filename)
          notifySuccess('', { i18n: { ns: 'common', key: 'success.exportGenerated', params: { format: 'Excel' } } })
          break
        case 'pdf':
          exportToPDF(formattedData, filename)
          notifySuccess('', { i18n: { ns: 'common', key: 'success.exportGenerated', params: { format: 'PDF' } } })
          break
      }
    } catch (error: any) {
      logError("Erro ao exportar", { error }, 'TransportadoraRelatoriosPage')
      notifyError(error, `Erro ao exportar: ${error.message}`, { i18n: { ns: 'common', key: 'errors.export' } })
    } finally {
      setLoadingReport(null)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Gestor da Transportadora", email: user?.email || "", role: user?.role || "gestor_transportadora", avatar_url: user?.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Relatórios</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Relatórios da transportadora</p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-brand" />
            <h3 className="font-semibold">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                setDateStart(today.toISOString().split('T')[0])
                setDateEnd(today.toISOString().split('T')[0])
              }}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const weekAgo = new Date(today)
                weekAgo.setDate(today.getDate() - 7)
                setDateStart(weekAgo.toISOString().split('T')[0])
                setDateEnd(today.toISOString().split('T')[0])
              }}
            >
              Últimos 7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const monthAgo = new Date(today)
                monthAgo.setDate(today.getDate() - 30)
                setDateStart(monthAgo.toISOString().split('T')[0])
                setDateEnd(today.toISOString().split('T')[0])
              }}
            >
              Últimos 30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                setDateStart(firstDay.toISOString().split('T')[0])
                setDateEnd(today.toISOString().split('T')[0])
              }}
            >
              Este mês
            </Button>
          </div>
        </Card>

        {/* Cards de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report, i) => {
            const Icon = report.icon
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:border-text-brand/30">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft w-fit mb-2">
                        <Icon className="h-6 w-6 text-brand" />
                      </div>
                      <h3 className="font-bold text-lg mb-1 group-hover:text-brand transition-colors">{report.title}</h3>
                      <p className="text-sm text-ink-muted">{report.description}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        disabled={loadingReport === report.id}
                      >
                        {loadingReport === report.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleExport(report, 'csv')}
                        disabled={loadingReport === report.id}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleExport(report, 'excel')}
                        disabled={loadingReport === report.id}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Exportar Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleExport(report, 'pdf')}
                        disabled={loadingReport === report.id}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Exportar PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

