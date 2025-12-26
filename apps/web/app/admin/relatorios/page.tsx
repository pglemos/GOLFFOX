"use client"

import { useEffect, useState, useMemo, Suspense } from "react"

import dynamic from "next/dynamic"

import { motion } from "framer-motion"
import { BarChart3, Download, FileText, Calendar, Filter, Clock, Mail, ChevronDown, ChevronUp, Save, X } from "lucide-react"
import { Edit, Trash2 } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SkeletonList } from "@/components/ui/skeleton"
import { useAuth } from "@/components/providers/auth-provider"
import {
  formatDelaysReport,
  formatOccupancyReport,
  formatNotBoardedReport
} from "@/lib/export-utils"
import { t } from "@/lib/i18n"
import { useRouter } from "@/lib/next-navigation"
import { logError } from "@/lib/logger"
import { withToast, notifySuccess, notifyError } from "@/lib/toast"

// Lazy load modal pesado
const ScheduleReportModal = dynamic(
  () => import("@/components/modals/schedule-report-modal").then(m => ({ default: m.ScheduleReportModal })),
  {
    ssr: false,
    loading: () => null
  }
)

interface ReportConfig {
  id: string
  title: string
  description: string
  icon: typeof FileText
  viewName?: string
  formatter?: (rows: Record<string, unknown>[]) => Record<string, unknown>[]
}

export default function RelatoriosPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [tempDateStart, setTempDateStart] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [tempDateEnd, setTempDateEnd] = useState(new Date().toISOString().split('T')[0])
  const [tempSelectedCompany, setTempSelectedCompany] = useState<string>("")
  const [dateStart, setDateStart] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0])
  const [selectedCompany, setSelectedCompany] = useState<string>("")

  const handleSaveFilters = () => {
    setDateStart(tempDateStart)
    setDateEnd(tempDateEnd)
    setSelectedCompany(tempSelectedCompany)
    setFiltersExpanded(false)
  }

  const handleResetFilters = () => {
    const resetDateStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const resetDateEnd = new Date().toISOString().split('T')[0]
    setTempDateStart(resetDateStart)
    setTempDateEnd(resetDateEnd)
    setTempSelectedCompany("")
    setDateStart(resetDateStart)
    setDateEnd(resetDateEnd)
    setSelectedCompany("")
    setFiltersExpanded(false)
  }
  const [schedules, setSchedules] = useState<Array<{ id: string; [key: string]: unknown }>>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedReportForSchedule, setSelectedReportForSchedule] = useState<string | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<{ id: string; [key: string]: unknown } | null>(null)

  // Memoizar reports para evitar recriação
  const reports: ReportConfig[] = useMemo(() => [
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
      id: 'motoristas',
      title: 'Ranking de Motoristas',
      description: 'Ranking por pontualidade, eficiência e conclusão',
      icon: BarChart3
    },
  ], [])

  useEffect(() => {
    if (user && !authLoading) {
      loadSchedules()
    }

  }, [user, authLoading])

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/reports/schedule')
      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (error) {
      logError('Erro ao carregar agendamentos', { error }, 'AdminRelatoriosPage')
    }
  }

  const handleExport = async (report: ReportConfig, format: 'csv' | 'excel' | 'pdf') => {
    await withToast(
      (async () => {
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
        return true
      })(),
      {
        loading: 'Gerando relatório...',
        success: t('operador', 'reports.exportSuccess', { title: report.title }),
        error: t('operador', 'reports.exportError')
      },
      { id: 'export' }
    )
  }

  if (authLoading || !user) {
    return (
      <AppShell user={{ id: "", name: "Admin", email: "", role: "admin" }}>
        <SkeletonList count={3} />
      </AppShell>
    )
  }

  return (
    <AppShell user={{ id: user.id, name: user.name || "Admin", email: user.email, role: user.role || "admin", avatar_url: user.avatar_url }}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden pb-12 sm:pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Relatórios</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Visões de operação e análises</p>
          </div>
        </div>

        {/* Filtros */}
        <Card variant="premium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-brand" />
                <CardTitle className="text-lg">Filtros</CardTitle>
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
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Início</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                    <Input
                      type="date"
                      value={tempDateStart}
                      onChange={(e) => setTempDateStart(e.target.value)}
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
                      value={tempDateEnd}
                      onChange={(e) => setTempDateEnd(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Empresa</label>
                  <Input
                    placeholder="Todas as empresas"
                    value={tempSelectedCompany}
                    onChange={(e) => setTempSelectedCompany(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
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
                <Card variant="premium" className="p-3 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-bg-brand-light to-bg-brand-soft w-fit mb-2 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-6 w-6 text-brand" />
                      </div>
                      <h3 className="font-bold text-lg mb-1 group-hover:text-brand transition-colors">{report.title}</h3>
                      <p className="text-sm text-ink-muted">{report.description}</p>
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

        {/* Agendamentos Existentes */}
        {schedules.length > 0 && (
          <Card variant="premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-brand" />
                Agendamentos de Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-bg-hover transition-colors">
                    <div className="flex-1">
                      <div className="font-semibold">
                        {reports.find(r => r.id === schedule.report_key)?.title || schedule.report_key}
                      </div>
                      <div className="text-sm text-ink-muted">
                        {schedule.cron} para {schedule.recipients?.join(', ') || 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                        {schedule.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSchedule(schedule)
                          setSelectedReportForSchedule(schedule.report_key)
                          setShowScheduleModal(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Tem certeza que deseja deletar este agendamento?')) {
                            try {
                              const response = await fetch(`/api/reports/schedule?scheduleId=${schedule.id}`, {
                                method: 'DELETE'
                              })
                              if (!response.ok) throw new Error('Erro ao deletar')
                              notifySuccess('Agendamento deletado com sucesso!')
                              loadSchedules()
                            } catch (error: unknown) {
                              const err = error as { message?: string }
                              notifyError(`Erro: ${err.message}`, undefined, {
                                i18n: { ns: 'common', key: 'errors.generic' }
                              })
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Agendamento */}
        {showScheduleModal && selectedReportForSchedule && (
          <ScheduleReportModal
            isOpen={showScheduleModal}
            onClose={() => {
              setShowScheduleModal(false)
              setSelectedReportForSchedule(null)
              setSelectedSchedule(null)
            }}
            onSave={loadSchedules}
            reportKey={selectedReportForSchedule}
            companyId={selectedCompany || undefined}
            schedule={selectedSchedule}
          />
        )}
      </div>
    </AppShell>
  )
}

