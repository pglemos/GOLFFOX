/**
 * Tipos relacionados a Custos e Finanças
 * 
 * Centralizados aqui para evitar duplicação em componentes
 */

import { z } from 'zod'

/**
 * Centro de Custo
 */
export interface CostCenter {
  id: string
  name: string
  code: string
  parent_id?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Categoria de Custo
 */
export interface CostCategory {
  id: string
  name: string
  group: string
  type: 'fixed' | 'variable'
  is_active: boolean
}

/**
 * Detalhe de Custo
 */
export interface CostDetail {
  id: string
  category_id: string
  category_name: string
  category_group: string
  amount: number
  date: string
  description?: string
  vehicle_id?: string
  vehicle_plate?: string
  route_id?: string
  route_name?: string
  invoice_number?: string
  created_by?: string
  created_at: string
}

/**
 * KPIs de Custo
 */
export interface CostKPIs {
  totalCosts: number
  fixedCosts: number
  variableCosts: number
  fuelCosts: number
  maintenanceCosts: number
  laborCosts: number
  costPerKm: number
  costPerTrip: number
  costPerPassenger: number
  monthOverMonth: number
  yearOverYear: number
  budgetVariance: number
}

/**
 * Orçamento
 */
export interface Budget {
  id: string
  year: number
  month: number
  category_id: string
  category_name?: string
  planned_amount: number
  actual_amount?: number
  variance?: number
  variance_percent?: number
  status?: 'under' | 'on_track' | 'over'
}

/**
 * Comparativo Orçamento vs Real
 */
export interface BudgetVsActual {
  category: string
  group: string
  planned: number
  actual: number
  variance: number
  variancePercent: number
}

/**
 * Linha de Preview de Importação
 */
export interface ImportPreviewRow {
  rowNumber: number
  date: string
  category: string
  amount: number
  description?: string
  isValid: boolean
  errors?: string[]
}

/**
 * Payload para Custo Manual
 */
export interface ManualCostPayload {
  category_id: string
  amount: number
  date: string
  description?: string
  vehicle_id?: string
  route_id?: string
  invoice_number?: string
}

/**
 * Nível de Agrupamento
 */
export type GroupingLevel = 'group' | 'category' | 'none'

/**
 * Schema de validação para formulário de custo
 */
export const costFormSchema = z.object({
  category_id: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
  vehicle_id: z.string().optional(),
  route_id: z.string().optional(),
  invoice_number: z.string().optional(),
})

export type CostFormValues = z.infer<typeof costFormSchema>

/**
 * Filtros de Custo
 */
export interface CostFilters {
  dateFrom?: string
  dateTo?: string
  categoryIds?: string[]
  groupIds?: string[]
  vehicleIds?: string[]
  routeIds?: string[]
  minAmount?: number
  maxAmount?: number
}

/**
 * Resumo de Custos por Período
 */
export interface CostSummary {
  period: string
  total: number
  fixed: number
  variable: number
  byCategory: Record<string, number>
  byGroup: Record<string, number>
}

