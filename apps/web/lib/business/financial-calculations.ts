/**
 * Lógica de negócio para cálculos financeiros
 * Extrai cálculos financeiros dos componentes para facilitar testes e reutilização
 */

import type { ManualCost, ManualRevenue, Budget, AdminFinancialKPIs } from '@/types/financial'

export interface CategoryBreakdown {
  name: string
  value: number
  color: string
}

export interface BudgetVariance {
  name: string
  budgeted: number
  actual: number
  variance: number
}

/**
 * Calcular KPIs financeiros a partir de custos e receitas
 */
export function calculateFinancialKPIs(
  costs: ManualCost[],
  revenues: ManualRevenue[]
): AdminFinancialKPIs {
  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0)
  const totalRevenues = revenues.reduce((sum, r) => sum + r.amount, 0)

  return {
    total_costs_30d: totalCosts,
    total_revenues_30d: totalRevenues,
    margin_30d: totalRevenues - totalCosts,
    cost_entries_30d: costs.length,
    revenue_entries_30d: revenues.length,
    critical_alerts: 0,
    warning_alerts: 0,
    recurring_costs_count: costs.filter((c) => c.is_recurring).length,
  }
}

/**
 * Calcular breakdown por categoria de custos
 */
export function calculateCategoryBreakdown(
  costs: ManualCost[],
  colors: string[] = []
): CategoryBreakdown[] {
  const byCategory: Record<string, number> = {}

  costs.forEach((cost) => {
    const catName = cost.category?.name || 'Sem categoria'
    byCategory[catName] = (byCategory[catName] || 0) + cost.amount
  })

  return Object.entries(byCategory)
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length] || '#8884d8',
    }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Calcular variação entre orçado e real
 */
export function calculateBudgetVariance(
  budgets: Budget[],
  costs: ManualCost[]
): BudgetVariance[] {
  return budgets.map((budget) => {
    const actual = costs
      .filter((c) => c.category_id === budget.category_id)
      .reduce((sum, c) => sum + c.amount, 0)

    return {
      name: budget.category?.name || budget.category_name || 'Categoria',
      budgeted: budget.budgeted_amount,
      actual,
      variance: actual - budget.budgeted_amount,
    }
  })
}

/**
 * Calcular margem percentual
 */
export function calculateMarginPercent(
  margin: number,
  revenues: number
): string {
  if (revenues === 0) return '0'
  return ((margin / revenues) * 100).toFixed(1)
}

/**
 * Calcular total de custos recorrentes
 */
export function calculateRecurringCostsCount(costs: ManualCost[]): number {
  return costs.filter((c) => c.is_recurring).length
}

/**
 * Calcular total de receitas recorrentes
 */
export function calculateRecurringRevenuesCount(revenues: ManualRevenue[]): number {
  return revenues.filter((r) => r.is_recurring).length
}

