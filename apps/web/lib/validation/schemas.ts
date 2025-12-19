/**
 * Schemas Zod Compartilhados
 * 
 * Schemas de validação reutilizáveis para APIs
 * Use estes schemas para garantir validação consistente
 */

import { z } from 'zod'

// ============================================
// Schemas de Usuário
// ============================================

export const emailSchema = z.string().email('Email inválido')

export const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')

export const nameSchema = z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo')

export const uuidSchema = z.string().uuid('ID inválido')

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: z.enum(['admin', 'empresa', 'transportadora', 'motorista', 'passageiro']),
  company_id: uuidSchema.optional().nullable(),
  transportadora_id: uuidSchema.optional().nullable(),
  phone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
})

export const updateUserSchema = createUserSchema.partial().extend({
  id: uuidSchema,
})

// ============================================
// Schemas de Empresa
// ============================================

export const createCompanySchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().nullable(),
  phone: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: uuidSchema,
})

// ============================================
// Schemas de Transportadora
// ============================================

export const createTransportadoraSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().nullable(),
  phone: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export const updateTransportadoraSchema = createTransportadoraSchema.partial().extend({
  id: uuidSchema,
})

export const transportadoraLoginSchema = z.object({
  transportadora_id: uuidSchema.optional(),
  carrier_id: uuidSchema.optional(), // Compatibilidade
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
}).refine(data => data.transportadora_id || data.carrier_id, {
  message: 'ID da transportadora é obrigatório'
})

// ============================================
// Schemas de Veículo
// ============================================

export const createVehicleSchema = z.object({
  plate: z.string().min(1, 'Placa é obrigatória').max(10),
  model: z.string().min(1, 'Modelo é obrigatório'),
  brand: z.string().optional().nullable(),
  prefix: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  capacity: z.number().int().min(1).optional().nullable(),
  company_id: uuidSchema.optional().nullable(),
  transportadora_id: uuidSchema.optional().nullable(),
  carrier_id: uuidSchema.optional().nullable(), // Compatibilidade
  is_active: z.boolean().default(true),
})

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  id: uuidSchema,
})

// ============================================
// Schemas de Rota
// ============================================

export const createRouteSchema = z.object({
  name: nameSchema,
  company_id: uuidSchema.optional().nullable(),
  carrier_id: uuidSchema.optional().nullable(),
  origin: z.string().min(1, 'Origem é obrigatória'),
  destination: z.string().min(1, 'Destino é obrigatório'),
  origin_lat: z.number().min(-90).max(90).optional().nullable(),
  origin_lng: z.number().min(-180).max(180).optional().nullable(),
  destination_lat: z.number().min(-90).max(90).optional().nullable(),
  destination_lng: z.number().min(-180).max(180).optional().nullable(),
  polyline: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export const updateRouteSchema = createRouteSchema.partial().extend({
  id: uuidSchema,
})

// ============================================
// Schemas de Motorista
// ============================================

export const createDriverSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().nullable(),
  phone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  cnh: z.string().optional().nullable(),
  cnh_category: z.string().optional().nullable(),
  transportadora_id: uuidSchema,
  is_active: z.boolean().default(true),
  // Endereço
  address_zip_code: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_neighborhood: z.string().optional().nullable(),
  address_complement: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),
})

export const updateDriverSchema = createDriverSchema.partial().extend({
  id: uuidSchema,
})

// ============================================
// Schemas de Custos
// ============================================

export const createCostSchema = z.object({
  category_id: uuidSchema.optional().nullable(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  cost_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  route_id: uuidSchema.optional().nullable(),
  vehicle_id: uuidSchema.optional().nullable(),
  driver_id: uuidSchema.optional().nullable(),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  attachment_url: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).default('confirmed'),
})

export const updateCostSchema = createCostSchema.partial().extend({
  id: uuidSchema,
})

// ============================================
// Schemas de Orçamento
// ============================================

export const budgetSchema = z.object({
  company_id: uuidSchema.optional().nullable(),
  carrier_id: uuidSchema.optional().nullable(),
  category_id: uuidSchema.optional().nullable(),
  period_month: z.number().min(1).max(12),
  period_year: z.number().min(2020),
  budgeted_amount: z.number().min(0),
  alert_threshold_percent: z.number().min(0).max(100).default(80),
  notes: z.string().optional().nullable(),
})

// ============================================
// Schemas de Receita
// ============================================

export const createRevenueSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  revenue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  contract_reference: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.enum(['monthly', 'yearly']).optional().nullable(),
  attachment_url: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).default('confirmed'),
})

export const updateRevenueSchema = createRevenueSchema.partial().extend({
  id: uuidSchema,
})

// ============================================
// Schemas de Paginação
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

// ============================================
// Schemas de Filtros
// ============================================

export const dateRangeSchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const searchSchema = z.object({
  search: z.string().optional(),
})

// ============================================
// Helpers
// ============================================

/**
 * Valida dados usando um schema Zod e retorna erro formatado
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Valida e lança erro se inválido
 */
export function parseWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}
