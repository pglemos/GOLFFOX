"use client"

// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Button } from "@/components/ui/button"
import { FileText, Download, BarChart3 } from "lucide-react"
import { useEffect, useState } from "react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
// @ts-ignore
import { exportToCSV, exportToExcel, exportToPDF, formatDelaysReport, formatOccupancyReport, formatNotBoardedReport, type ReportData } from "@/lib/export-utils"
// @ts-ignore
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

      // Tentar buscar dados de views seguras se disponíveis
      if (report.viewName) {
        // Views seguras já filtram por company_id via RLS
        const { data, error } = await supabase
          .from(report.viewName)
          .select('*')
          .limit(100)
        
        if (error) throw error
        
        if (report.formatter && data) {
          reportData = report.formatter(data)
        } else {
          // Formato genérico
          reportData.headers = Object.keys(data[0] || {})
          reportData.rows = data.map((row: any) => Object.values(row))
        }
      } else {
        // Dados mockados para relatórios sem view
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

      toast.success(`Relatório ${report.title} exportado com sucesso!`)
    } catch (error: any) {
      console.error("Erro ao exportar relatório:", error)
      toast.error(`Erro ao exportar: ${error.message}`)
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
      title: 'Ocupação', 
      desc: 'Ocupação por horário/rota',
      icon: BarChart3,
      viewName: 'v_reports_occupancy',
      formatter: formatOccupancyReport
    },
    { 
      id: 'nao-embarcados', 
      title: 'Não embarcados', 
      desc: 'Motivos e frequência',
      icon: FileText,
      viewName: 'v_reports_not_boarded',
      formatter: formatNotBoardedReport
    },
    { 
      id: 'eficiencia', 
      title: 'Eficiência', 
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
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
            <p className="text-[var(--ink-muted)]">Geração e exportação de relatórios</p>
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
