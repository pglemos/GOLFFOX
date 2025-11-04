"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BarChart3, Download, FileText, Calendar, Filter, Clock, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF,
  formatDelaysReport,
  formatOccupancyReport,
  formatNotBoardedReport
} from "@/lib/export-utils"
import toast from "react-hot-toast"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

interface ReportConfig {
  id: string
  title: string
  description: string
  icon: typeof FileText
  viewName?: string
  formatter?: (rows: any[]) => any
}

export default function RelatoriosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateStart, setDateStart] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0])
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [schedules, setSchedules] = useState<any[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedReportForSchedule, setSelectedReportForSchedule] = useState<string | null>(null)

  const reports: ReportConfig[] = [
    { 
      id: 'delays',
      title: 'Atrasos', 
      description: 'Análise de atrasos por rota, motorista e horário',
      icon: BarChart3,
      viewName: 'v_reports_delays',
      formatter: formatDelaysReport
    },
    { 
      id: 'occupancy',
      title: 'Ocupação', 
      description: 'Ocupação por horário (heatmap)',
      icon: BarChart3,
      viewName: 'v_reports_occupancy',
      formatter: formatOccupancyReport
    },
    { 
      id: 'not_boarded',
      title: 'Não Embarcados', 
      description: 'Passageiros que não embarcaram',
      icon: FileText,
      viewName: 'v_reports_not_boarded',
      formatter: formatNotBoardedReport
    },
    { 
      id: 'routes',
      title: 'Rotas Eficientes', 
      description: 'Análise de eficiência das rotas',
      icon: FileText
    },
    { 
      id: 'drivers',
      title: 'Ranking de Motoristas', 
      description: 'Ranking por pontualidade, eficiência e conclusão',
      icon: BarChart3
    },
  ]

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadSchedules()
    }
    getUser()
  }, [router])

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/reports/schedule')
      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    }
  }

  const handleExport = async (report: ReportConfig, format: 'csv' | 'excel' | 'pdf') => {
    try {
      toast.loading('Gerando relatório...', { id: 'export' })

      // Usar API server-side
      const response = await fetch('/api/reports/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportKey: report.id,
          format,
          filters: {
            companyId: selectedCompany || null,
            periodStart: dateStart || null,
            periodEnd: dateEnd || null
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao gerar relatório')
      }

      // Obter blob e fazer download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `${report.id}-${dateStart}-${dateEnd}.${format === 'excel' ? 'xlsx' : format}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Relatório exportado com sucesso!', { id: 'export' })
    } catch (error: any) {
      console.error("Erro ao exportar:", error)
      toast.error(`Erro ao exportar: ${error.message}`, { id: 'export' })
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Admin", email: user?.email || "", role: "admin" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
          <p className="text-[var(--ink-muted)]">Visões de operação e análises</p>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-[var(--brand)]" />
            <h3 className="font-semibold">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
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
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Input
                placeholder="Todas as empresas"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              />
            </div>
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
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Icon className="h-8 w-8 text-[var(--brand)] mb-2" />
                      <h3 className="font-bold text-lg mb-1">{report.title}</h3>
                      <p className="text-sm text-[var(--ink-muted)]">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExport(report, 'csv')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Exportar CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport(report, 'excel')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Exportar Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport(report, 'pdf')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Exportar PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setSelectedReportForSchedule(report.id)
                        setShowScheduleModal(true)
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Agendar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

