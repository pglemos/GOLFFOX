"use client"

// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Button } from "@/components/ui/button"
import { Download, FileText, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
// @ts-ignore
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export-utils"

export default function CustosOperatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState<any>({ total: 0, divergencias: 0 })
  const [custos, setCustos] = useState<any[]>([])
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', session.user.id)
        .single()

      if (userData?.company_id) {
        setEmpresaId(userData.company_id)
      }
      
      setUser({ ...session.user })
      setLoading(false)
      loadResumo()
    }
    run()
  }, [router])

  useEffect(() => {
    if (empresaId) {
      loadResumo()
    }
  }, [empresaId])

  const loadResumo = async () => {
    try {
      let query = supabase.from('v_operator_costs').select('*')
      
      if (empresaId) {
        query = query.eq('empresa_id', empresaId)
      }
      
      const { data, error } = await query.limit(100)
      
      if (error) throw error
      
      setCustos(data || [])
      const total = (data || []).reduce((acc: number, r: any) => acc + Number(r.total_cost || 0), 0)
      const divergencias = (data || []).reduce((acc: number, r: any) => acc + Number(r.total_discrepancy || 0), 0)
      setResumo({ total, divergencias })
    } catch (error: any) {
      console.error("Erro ao carregar custos:", error)
      toast.error("Erro ao carregar custos")
    }
  }

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const reportData = {
        title: 'Relatório de Custos e Faturas',
        description: `Período: ${new Date().toLocaleDateString('pt-BR')} - Total: ${custos.length} registros`,
        headers: ['Período', 'Rota', 'Custo Total', 'Faturado', 'Divergência', 'Status'],
        rows: custos.map((c: any) => [
          c.period_start || '-',
          c.route_name || '-',
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.total_cost || 0),
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.invoiced_amount || 0),
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.total_discrepancy || 0),
          c.reconciliation_status || 'pendente'
        ])
      }

      if (format === 'csv') {
        exportToCSV(reportData, `custos_${new Date().toISOString().split('T')[0]}.csv`)
      } else if (format === 'excel') {
        exportToExcel(reportData, `custos_${new Date().toISOString().split('T')[0]}.xlsx`)
      } else {
        exportToPDF(reportData, `custos_${new Date().toISOString().split('T')[0]}.pdf`)
      }

      toast.success(`Exportação ${format.toUpperCase()} gerada com sucesso!`)
    } catch (error: any) {
      toast.error(`Erro ao exportar: ${error.message}`)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Custos & Faturas</h1>
            <p className="text-[var(--ink-muted)]">Resumo dos custos faturados pela GOLF FOX</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4 mr-2" /> CSV</Button>
            <Button variant="outline" onClick={() => handleExport('excel')}><Download className="h-4 w-4 mr-2" /> Excel</Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}><Download className="h-4 w-4 mr-2" /> PDF</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6">
            <p className="text-sm text-[var(--ink-muted)]">Custo Total (período)</p>
            <p className="text-3xl font-bold mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.total)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-[var(--ink-muted)]">Divergências</p>
            <p className="text-3xl font-bold mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.divergencias)}</p>
          </Card>
        </div>

        {custos.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Detalhamento de Custos</h3>
            <div className="space-y-3">
              {custos.slice(0, 10).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[var(--bg-soft)] rounded-lg">
                  <div>
                    <p className="font-medium">{c.route_name || 'N/A'}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{c.period_start} — {c.period_end || 'atual'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.total_cost || 0)}</p>
                    {c.total_discrepancy !== 0 && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Divergência: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(c.total_discrepancy))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
