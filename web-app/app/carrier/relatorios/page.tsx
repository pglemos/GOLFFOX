"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, FileText, Calendar, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF
} from "@/lib/export-utils"
import toast from "react-hot-toast"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

interface ReportConfig {
  id: string
  title: string
  description: string
  icon: typeof FileText
}

export default function CarrierRelatoriosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateStart, setDateStart] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0])

  const reports: ReportConfig[] = [
    { 
      id: 'fleet',
      title: 'Frota em Uso', 
      description: 'Relatório de utilização da frota',
      icon: BarChart3
    },
    { 
      id: 'drivers',
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
    }
    getUser()
  }, [router])

  const handleExport = async (report: ReportConfig, format: 'csv' | 'excel' | 'pdf') => {
    try {
      // Dados básicos para o relatório
      const formattedData = {
        title: report.title,
        description: report.description,
        headers: ['Data', 'Informações'],
        rows: [[new Date().toLocaleDateString('pt-BR'), `Relatório ${report.title} - Em desenvolvimento`]]
      }

      const filename = `${report.id}-${dateStart}-${dateEnd}.${format === 'excel' ? 'xlsx' : format}`

      switch (format) {
        case 'csv':
          exportToCSV(formattedData, filename)
          toast.success('Relatório exportado como CSV!')
          break
        case 'excel':
          exportToExcel(formattedData, filename)
          toast.success('Relatório exportado como Excel!')
          break
        case 'pdf':
          exportToPDF(formattedData, filename)
          toast.success('Abrindo relatório para impressão/PDF!')
          break
      }
    } catch (error: any) {
      console.error("Erro ao exportar:", error)
      toast.error(`Erro ao exportar: ${error.message}`)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Transportadora", email: user?.email || "", role: "carrier" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
          <p className="text-[var(--ink-muted)]">Relatórios da transportadora</p>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-[var(--brand)]" />
            <h3 className="font-semibold">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

