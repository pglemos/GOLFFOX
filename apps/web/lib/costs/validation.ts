import { z } from 'zod'

/**
 * Schema de validação para custo
 */
export const costSchema = z.object({
  company_id: z.string().uuid('ID da empresa inválido'),
  carrier_id: z.string().uuid('ID da transportadora inválido').optional().nullable(),
  route_id: z.string().uuid('ID da rota inválido').optional().nullable(),
  vehicle_id: z.string().uuid('ID do veículo inválido').optional().nullable(),
  driver_id: z.string().uuid('ID do motorista inválido').optional().nullable(),
  cost_category_id: z.string().uuid('ID da categoria inválido'),
  cost_center_id: z.string().uuid('ID do centro de custo inválido').optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  qty: z.number().min(0, 'Quantidade deve ser positiva').optional().nullable(),
  unit: z.string().optional().nullable(),
  currency: z.string().default('BRL'),
  notes: z.string().optional().nullable(),
  source: z.enum(['manual', 'import', 'invoice', 'calc']).default('manual')
})

/**
 * Schema de validação para orçamento
 */
export const budgetSchema = z.object({
  company_id: z.string().uuid('ID da empresa inválido'),
  period_month: z.number().min(1, 'Mês deve ser entre 1 e 12').max(12, 'Mês deve ser entre 1 e 12'),
  period_year: z.number().min(2020, 'Ano deve ser >= 2020'),
  category_id: z.string().uuid('ID da categoria inválido').optional().nullable(),
  amount_budgeted: z.number().min(0, 'Valor orçado deve ser positivo'),
  notes: z.string().optional().nullable()
})

/**
 * Schema de validação para conciliação
 */
export const reconciliationSchema = z.object({
  invoice_id: z.string().uuid('ID da fatura inválido'),
  route_id: z.string().uuid('ID da rota inválido').optional().nullable(),
  action: z.enum(['approve', 'reject', 'request_revision']),
  notes: z.string().optional().nullable(),
  discrepancy_threshold_percent: z.number().default(5),
  discrepancy_threshold_amount: z.number().default(100)
})

/**
 * Regras de negócio para divergência significativa
 */
export function hasSignificantDiscrepancy(
  measuredAmount: number,
  invoicedAmount: number,
  thresholdPercent: number = 5,
  thresholdAmount: number = 100
): boolean {
  const discrepancyAbsolute = Math.abs(invoicedAmount - measuredAmount)
  const discrepancyPercent = measuredAmount > 0 
    ? (discrepancyAbsolute / measuredAmount) * 100 
    : 0

  return discrepancyAbsolute > thresholdAmount || discrepancyPercent > thresholdPercent
}

/**
 * Validar importação de custos
 */
export const importCostRowSchema = z.object({
  date: z.string(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  amount: z.number().min(0.01, 'Valor deve ser positivo'),
  qty: z.number().min(0).optional(),
  unit: z.string().optional(),
  route_name: z.string().optional(),
  vehicle_plate: z.string().optional(),
  driver_email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().optional()
})

