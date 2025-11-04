"use client"

// @ts-ignore
import { AppShell } from "@/components/app-shell"
// @ts-ignore
import { Card } from "@/components/ui/card"
// @ts-ignore
import { Button } from "@/components/ui/button"
import { Download, FileText, AlertCircle, DollarSign, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
// @ts-ignore
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export-utils"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"
import operatorI18n from "@/i18n/operator.json"

export default function CustosOperatorPage() {
  const router = useRouter()
  const { tenantCompanyId, companyName, loading: tenantLoading } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState<any>({ total: 0, divergencias: 0 })
  const [custos, setCustos] = useState<any[]>([])
  const [selectedCusto, setSelectedCusto] = useState<any>(null)
  const [showReconciliation, setShowReconciliation] = useState(false)

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/"); return }
      setUser({ ...session.user })
      setLoading(false)
    }
    run()
  }, [router])

  useEffect(() => {
    if (tenantCompanyId && !tenantLoading) {
      loadResumo()
    }
  }, [tenantCompanyId, tenantLoading])

  const loadResumo = async () => {
    if (!tenantCompanyId) return

    try {
      const { data, error } = await supabase
        .from('v_operator_costs_secure')
        .select('*')
        .eq('company_id', tenantCompanyId)
        .limit(100)

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
        title: `Relatório de Custos - ${companyName}`,
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

  const handleReconciliation = (custo: any) => {
    setSelectedCusto(custo)
    setShowReconciliation(true)
  }

  const handleApproveReconciliation = async () => {
    if (!selectedCusto || !tenantCompanyId) return

    try {
      // Atualizar status de reconciliação
      const { error } = await supabase
        .from('gf_invoices')
        .update({ reconciliation_status: 'approved' })
        .eq('id', selectedCusto.invoice_id)

      if (error) throw error

      toast.success("Fatura aprovada com sucesso!")
      setShowReconciliation(false)
      setSelectedCusto(null)
      await loadResumo()
    } catch (error: any) {
      console.error("Erro ao aprovar reconciliação:", error)
      toast.error("Erro ao aprovar reconciliação")
    }
  }

  if (loading || tenantLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operator" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{operatorI18n.costs_title}</h1>
            <p className="text-[var(--ink-muted)]">{operatorI18n.costs_subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4 mr-2" /> CSV</Button>
            <Button variant="outline" onClick={() => handleExport('excel')}><Download className="h-4 w-4 mr-2" /> Excel</Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}><Download className="h-4 w-4 mr-2" /> PDF</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-[var(--brand)]" />
              <p className="text-sm text-[var(--ink-muted)]">Custo Total (período)</p>
            </div>
            <p className="text-3xl font-bold mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.total)}</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-[var(--ink-muted)]">Divergências</p>
            </div>
            <p className="text-3xl font-bold mt-1 text-red-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.divergencias)}</p>
          </Card>
        </div>

        {custos.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Detalhamento de Custos</h3>
            <div className="space-y-3">
              {custos.slice(0, 10).map((c: any, i: number) => {
                const hasDiscrepancy = Math.abs(c.total_discrepancy || 0) > 0.01
                const isSignificant = hasDiscrepancy && (Math.abs(c.total_discrepancy) > 100 || Math.abs(c.total_discrepancy / (c.total_cost || 1)) > 0.05)

                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-[var(--bg-soft)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{c.route_name || 'N/A'}</p>
                      <p className="text-xs text-[var(--ink-muted)]">{c.period_start} — {c.period_end || 'atual'}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.total_cost || 0)}</p>
                      {hasDiscrepancy && (
                        <p className={`text-xs flex items-center gap-1 justify-end ${isSignificant ? 'text-red-500' : 'text-orange-500'}`}>
                          <AlertCircle className="h-3 w-3" />
                          Divergência: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(c.total_discrepancy))}
                        </p>
                      )}
                    </div>
                    {hasDiscrepancy && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReconciliation(c)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Reconciliar
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {custos.length === 0 && (
          <Card className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum custo encontrado</h3>
            <p className="text-sm text-[var(--ink-muted)]">
              Os custos aparecerão aqui conforme as rotas forem executadas
            </p>
          </Card>
        )}

        {/* Modal de Reconciliação - Implementação básica */}
        {showReconciliation && selectedCusto && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowReconciliation(false)}>
            <Card className="p-6 max-w-2xl w-full m-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">{operatorI18n.reconciliation.title}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Rota</p>
                  <p className="font-medium">{selectedCusto.route_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--ink-muted)]">Custo Medido</p>
                    <p className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCusto.total_cost || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--ink-muted)]">Custo Faturado</p>
                    <p className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCusto.invoiced_amount || 0)}</p>
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-semibold text-red-700">Divergência Detectada</p>
                  <p className="text-2xl font-bold text-red-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(selectedCusto.total_discrepancy || 0))}</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowReconciliation(false)}>
                    {operatorI18n.actions.cancel}
                  </Button>
                  <Button variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
                    {operatorI18n.reconciliation.request_revision}
                  </Button>
                  <Button variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">
                    {operatorI18n.reconciliation.reject}
                  </Button>
                  <Button onClick={handleApproveReconciliation}>
                    {operatorI18n.reconciliation.approve}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
