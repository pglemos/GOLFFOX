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
    totalCosts30d: totalCosts,
    totalRevenues30d: totalRevenues,
    margin30d: totalRevenues - totalCosts,
    costEntries30d: costs.length,
    revenueEntries30d: revenues.length,
    criticalAlerts: 0,
    warningAlerts: 0,
    recurringCostsCount: costs.filter((c) => c.isRecurring).length,
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
      .filter((c) => c.categoryId === budget.categoryId)
      .reduce((sum, c) => sum + c.amount, 0)

    return {
      name: budget.category?.name || budget.categoryName || 'Categoria',
      budgeted: budget.budgetedAmount,
      actual,
      variance: actual - budget.budgetedAmount,
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
  return costs.filter((c) => c.isRecurring).length
}

/**
 * Calcular total de receitas recorrentes
 */
export function calculateRecurringRevenuesCount(revenues: ManualRevenue[]): number {
  return revenues.filter((r) => r.isRecurring).length
}

