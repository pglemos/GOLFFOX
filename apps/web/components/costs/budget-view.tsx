"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Edit,
  Trash2
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"
import { formatCurrency } from "@/lib/kpi-utils"
import { notifySuccess, notifyError } from "@/lib/toast"

interface BudgetViewProps {
  companyId: string
}

interface Budget {
  id: string
  period_month: number
  period_year: number
  category_id: string | null
  amount_budgeted: number
  notes: string | null
}

interface BudgetVsActual {
  period_month: number
  period_year: number
  actual_amount: number
  budgeted_amount: number
  variance_percent: number
  variance_absolute: number
}

export function BudgetView({ companyId }: BudgetViewProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActual[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    category_id: '',
    amount_budgeted: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Buscar orçamentos
      const budgetsRes = await fetch(`/api/costs/budgets?company_id=${companyId}`)
      if (budgetsRes.ok) {
        const { data } = await budgetsRes.ok ? await budgetsRes.json() : { data: [] }
        setBudgets(data || [])
      }

      // Buscar comparação realizado vs orçamento
      const vsRes = await fetch(`/api/costs/vs-budget?company_id=${companyId}`)
      if (vsRes.ok) {
        const result = await vsRes.json()
        setBudgetVsActual(result.data || [])
      }

    } catch (error) {
      console.error('Erro ao carregar dados de orçamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const res = await fetch('/api/costs/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          period_month: formData.period_month,
          period_year: formData.period_year,
          category_id: formData.category_id || null,
          amount_budgeted: parseFloat(formData.amount_budgeted),
          notes: formData.notes || null
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao salvar orçamento')
      }

      notifySuccess('Orçamento salvo com sucesso!')
      setShowForm(false)
      setEditingBudget(null)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error)
      notifyError(error, 'Erro ao salvar orçamento')
    }
  }

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Deseja realmente excluir este orçamento?')) return

    try {
      const res = await fetch(`/api/costs/budgets?id=${budgetId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao excluir orçamento')
      }

      notifySuccess('Orçamento excluído com sucesso!')
      loadData()
    } catch (error: any) {
      console.error('Erro ao excluir orçamento:', error)
      notifyError(error, 'Erro ao excluir orçamento')
    }
  }

  const resetForm = () => {
    setFormData({
      period_month: new Date().getMonth() + 1,
      period_year: new Date().getFullYear(),
      category_id: '',
      amount_budgeted: '',
      notes: ''
    })
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      period_month: budget.period_month,
      period_year: budget.period_year,
      category_id: budget.category_id || '',
      amount_budgeted: budget.amount_budgeted.toString(),
      notes: budget.notes || ''
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted rounded"></div>
          ))}
        </div>
      </Card>
    )
  }

  const chartData = budgetVsActual.map(item => ({
    month: `${item.period_month}/${item.period_year}`,
    Realizado: item.actual_amount,
    Orçado: item.budgeted_amount,
    Variação: item.variance_absolute
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Orçamento & Previsão</h3>
        <Button onClick={() => { setShowForm(true); setEditingBudget(null); resetForm(); }}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Orçamento
        </Button>
      </div>

      {/* Gráfico Realizado vs Orçado */}
      {budgetVsActual.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Realizado vs Orçado (Mensal)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Realizado" fill="#F97316" />
                <Bar dataKey="Orçado" fill="#0A2540" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Orçamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Orçamentos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-ink-muted">
              Nenhum orçamento cadastrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Período</th>
                    <th className="text-left p-2">Categoria</th>
                    <th className="text-right p-2">Valor Orçado</th>
                    <th className="text-right p-2">Realizado</th>
                    <th className="text-right p-2">Variação</th>
                    <th className="text-center p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map(budget => {
                    const actual = budgetVsActual.find(
                      v => v.period_month === budget.period_month && 
                           v.period_year === budget.period_year
                    )
                    const variance = actual 
                      ? (actual.actual_amount - budget.amount_budgeted) 
                      : 0
                    const variancePercent = budget.amount_budgeted > 0
                      ? (variance / budget.amount_budgeted) * 100
                      : 0

                    return (
                      <tr key={budget.id} className="border-b hover:bg-bg-soft">
                        <td className="p-2">
                          {budget.period_month.toString().padStart(2, '0')}/{budget.period_year}
                        </td>
                        <td className="p-2">
                          {budget.category_id ? 'Específica' : 'Geral'}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {formatCurrency(budget.amount_budgeted)}
                        </td>
                        <td className="p-2 text-right">
                          {actual ? formatCurrency(actual.actual_amount) : '-'}
                        </td>
                        <td className="p-2 text-right">
                          {actual && (
                            <Badge 
                              variant={variancePercent > 0 ? 'destructive' : 'default'}
                              className={variancePercent > 0 ? 'bg-error-light text-error' : 'bg-success-light text-success'}
                            >
                              {variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(budget)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(budget.id)}
                            >
                              <Trash2 className="h-4 w-4 text-error" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowForm(false); resetForm(); }}>
          <Card className="p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">
              {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period_month">Mês</Label>
                  <Input
                    id="period_month"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.period_month}
                    onChange={(e) => setFormData({ ...formData, period_month: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_year">Ano</Label>
                  <Input
                    id="period_year"
                    type="number"
                    min="2020"
                    value={formData.period_year}
                    onChange={(e) => setFormData({ ...formData, period_year: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount_budgeted">Valor Orçado (R$)</Label>
                <Input
                  id="amount_budgeted"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount_budgeted}
                  onChange={(e) => setFormData({ ...formData, amount_budgeted: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-brand hover:bg-brand-hover">
                  Salvar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

