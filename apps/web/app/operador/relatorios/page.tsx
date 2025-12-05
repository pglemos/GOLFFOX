"use client"

import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, BarChart3 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { notifySuccess, notifyError } from "@/lib/toast"
import { exportToCSV, exportToExcel, exportToPDF, formatDelaysReport, formatOccupancyReport, formatNotBoardedReport, type ReportData } from "@/lib/export-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"

export default function RelatoriosOperatorPage() {
  const router = useRouter()
  const { tenantCompanyId, companyName, loading: tenantLoading } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }

      setUser({ ...session.user })
      setLoading(false)
    }
    run()
  }, [router])

  const handleExport = async (report: any, format: 'csv' | 'excel' | 'pdf') => {
    try {
      let reportData: ReportData = {
        title: report.title,
        description: report.desc,
        headers: [],
        rows: []
      }

      // Tentar buscar dados de views seguras se disponÃ­veis
      if (report.viewName) {
        // Views seguras jÃ¡ filtram por company_id via RLS
        const { data, error } = await supabase
          .from(report.viewName)
          .select('*')
          .limit(100)
        
        if (error) throw error
        
        if (report.formatter && data) {
          reportData = report.formatter(data)
        } else {
          // Formato genÃ©rico
          reportData.headers = Object.keys(data[0] || {})
          reportData.rows = data.map((row: any) => Object.values(row))
        }
      } else {
        // Dados mockados para relatÃ³rios sem view
        reportData.headers = ['Data', 'Valor', 'Status']
        reportData.rows = [['2024-01-01', 'Exemplo', 'Ativo']]
      }

      if (format === 'csv') {
        exportToCSV(reportData, `${report.id}_${new Date().toISOString().split('T')[0]}.csv`)
      } else if (format === 'excel') {
        exportToExcel(reportData, `${report.id}_${new Date().toISOString().split('T')[0]}.xlsx`)
      } else {
        exportToPDF(reportData, `${report.id}_${new Date().toISOString().split('T')[0]}.pdf`)
      }

      notifySuccess('', { i18n: { ns: 'operator', key: 'reports.exportSuccess', params: { title: report.title } } })
    } catch (error: any) {
      console.error("Erro ao exportar relatÃ³rio:", error)
      notifyError('Erro ao exportar', undefined, { i18n: { ns: 'operator', key: 'reports.exportError', params: { message: error.message || 'Erro desconhecido' } } })
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  const reports = [
    { 
      id: 'atrasos', 
      title: 'Atrasos', 
      desc: 'Atrasos por rota/turno',
      icon: BarChart3,
      viewName: 'v_reports_delays',
      formatter: formatDelaysReport
    },
    { 
      id: 'ocupacao', 
      title: 'OcupaÃ§Ã£o', 
      desc: 'OcupaÃ§Ã£o por horÃ¡rio/rota',
      icon: BarChart3,
      viewName: 'v_reports_occupancy',
      formatter: formatOccupancyReport
    },
    { 
      id: 'nao-embarcados', 
      title: 'NÃ£o embarcados', 
      desc: 'Motivos e frequÃªncia',
      icon: FileText,
      viewName: 'v_reports_not_boarded',
      formatter: formatNotBoardedReport
    },
    { 
      id: 'eficiencia', 
      title: 'EficiÃªncia', 
      desc: 'Planejado vs realizado',
      icon: BarChart3
    },
    { 
      id: 'sla', 
      title: 'SLA GOLF FOX', 
      desc: 'Pontualidade de resposta',
      icon: FileText
    },
    { 
      id: 'roi', 
      title: 'ROI', 
      desc: 'Custo por colaborador e tempo economizado',
      icon: BarChart3
    },
  ]

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: user?.avatar_url }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">RelatÃ³rios</h1>
            <p className="text-[var(--ink-muted)]">GeraÃ§Ã£o e exportaÃ§Ã£o de relatÃ³rios</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {reports.map(r => {
            const Icon = r.icon || FileText
            return (
              <Card key={r.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">{r.title}</h3>
                    </div>
                    <p className="text-sm text-[var(--ink-muted)]">{r.desc}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" /> Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport(r, 'csv')}>
                        Exportar CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(r, 'excel')}>
                        Exportar Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(r, 'pdf')}>
                        Exportar PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

