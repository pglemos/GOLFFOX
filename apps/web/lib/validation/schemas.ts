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

// Schema base de usuário (sem refinements, para permitir .partial())
const baseUserSchema = z.object({
  email: emailSchema.optional().nullable(),
  password: passwordSchema.optional().nullable(),
  name: nameSchema,
  role: z.enum(['admin', 'gestor_empresa', 'gestor_transportadora', 'motorista', 'passageiro']),
  company_id: uuidSchema.optional().nullable(),
  empresa_id: uuidSchema.optional().nullable(),
  transportadora_id: uuidSchema.optional().nullable(),
  phone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  // Endereço
  address_zip_code: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_neighborhood: z.string().optional().nullable(),
  address_complement: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),
})

export const createUserSchema = baseUserSchema.refine(data => data.email || data.cpf, {
  message: 'Email ou CPF é obrigatório',
  path: ['email']
})

export const updateUserSchema = baseUserSchema.partial().extend({
  id: uuidSchema,
})

// ============================================
// Schemas de Empresa
// ============================================

export const createCompanySchema = z.object({
  name: nameSchema,
  cnpj: z.string().optional().nullable(),
  email: emailSchema.optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  address_zip_code: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_neighborhood: z.string().optional().nullable(),
  address_complement: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: uuidSchema.optional(),
})

/**
 * Schema para criação de login de empresa
 */
export const createCompanyLoginSchema = z.object({
  company_id: uuidSchema,
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: z.string().optional().nullable(),
})

/**
 * Schema para criação de empresa + operador
 */
export const createOperatorSchema = z.object({
  company_name: z.string().min(1, 'Nome da empresa é obrigatório'),
  cnpj: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  company_phone: z.string().optional().nullable(),
  company_email: z.string().optional().nullable(),
  operator_email: z.string().email('Email do operador inválido'),
  operator_password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().nullable(),
  operator_name: z.string().min(1, 'Nome do operador é obrigatório'),
  operator_phone: z.string().optional().nullable(),
  // Endereço detalhado
  address_zip_code: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_neighborhood: z.string().optional().nullable(),
  address_complement: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),
  // Registros
  state_registration: z.string().optional().nullable(),
  municipal_registration: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
})

/**
 * Schema para criação de empresa / usuário (usado em fluxos integrados)
 */
export const createCompanyUserSchema = z.object({
  company_id: uuidSchema.optional(),
  company_name: z.string().optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  name: nameSchema.optional(),
  phone: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  // Fallbacks para camelCase
  companyName: z.string().optional(),
  companyId: uuidSchema.optional(),
  operatorEmail: z.string().optional(),
  operatorPassword: z.string().optional(),
  operatorName: z.string().optional(),
  operatorPhone: z.string().optional(),
}).refine(data => (data.company_id || data.companyId) || (data.company_name || data.companyName), {
  message: 'ID ou Nome da empresa é obrigatório'
})

// ============================================
// Schemas de Transportadora
// ============================================

export const createTransportadoraSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional().nullable(),
  phone: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  address_zip_code: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_neighborhood: z.string().optional().nullable(),
  address_complement: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),
  state_registration: z.string().optional().nullable(),
  municipal_registration: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export const updateTransportadoraSchema = createTransportadoraSchema.partial().extend({
  id: uuidSchema.optional(),
  // Campos do Representante Legal
  legal_rep_name: z.string().optional().nullable(),
  legal_rep_cpf: z.string().optional().nullable(),
  legal_rep_rg: z.string().optional().nullable(),
  legal_rep_email: z.string().optional().nullable(),
  legal_rep_phone: z.string().optional().nullable(),
  // Campos Bancários
  bank_name: z.string().optional().nullable(),
  bank_code: z.string().optional().nullable(),
  bank_agency: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_account_type: z.string().optional().nullable(),
  pix_key: z.string().optional().nullable(),
  pix_key_type: z.string().optional().nullable()
})

export const transportadoraLoginSchema = z.object({
  transportadora_id: uuidSchema.optional(),
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
}).refine(data => data.transportadora_id, {
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
  empresa_id: uuidSchema.optional().nullable(),
  transportadora_id: uuidSchema.optional().nullable(),
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
  empresa_id: uuidSchema.optional().nullable(),
  transportadora_id: uuidSchema.optional().nullable(),
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
  id: uuidSchema.optional(),
})

/**
 * Schema para compensação de motorista
 */
export const driverCompensationSchema = z.object({
  base_salary: z.number().positive().optional().nullable(),
  currency: z.string().default('BRL'),
  payment_frequency: z.enum(['weekly', 'biweekly', 'monthly']).default('monthly'),
  contract_type: z.enum(['clt', 'pj', 'autonomo', 'temporario']).default('clt'),
  has_meal_allowance: z.boolean().default(false),
  meal_allowance_value: z.number().optional().nullable(),
  has_transport_allowance: z.boolean().default(false),
  transport_allowance_value: z.number().optional().nullable(),
  has_health_insurance: z.boolean().default(false),
  health_insurance_value: z.number().optional().nullable(),
  has_dental_insurance: z.boolean().default(false),
  dental_insurance_value: z.number().optional().nullable(),
  has_life_insurance: z.boolean().default(false),
  life_insurance_value: z.number().optional().nullable(),
  has_fuel_card: z.boolean().default(false),
  fuel_card_limit: z.number().optional().nullable(),
  other_benefits: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// ============================================
// Schemas de Custos
// ============================================

export const createCostSchema = z.object({
  category_id: uuidSchema.optional().nullable(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  cost_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  rota_id: uuidSchema.optional().nullable(),
  veiculo_id: uuidSchema.optional().nullable(),
  motorista_id: uuidSchema.optional().nullable(),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  attachment_url: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).default('confirmed'),
})

export const updateCostSchema = createCostSchema.partial().extend({
  id: uuidSchema.optional(),
})

/**
 * Schema para custo de rota (específico transportadora)
 */
export const routeCostSchema = z.object({
  rota_id: uuidSchema,
  viagem_id: uuidSchema.optional().nullable(),
  cost_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  fuel_cost_brl: z.number().min(0).default(0),
  labor_cost_brl: z.number().min(0).default(0),
  maintenance_cost_brl: z.number().min(0).default(0),
  toll_cost_brl: z.number().min(0).default(0),
  fixed_cost_brl: z.number().min(0).default(0),
  passengers_transported: z.number().int().min(0).default(0),
  distance_km: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * Schema para custo de veículo (específico transportadora)
 */
export const vehicleCostSchema = z.object({
  veiculo_id: uuidSchema,
  cost_category: z.enum(['combustivel', 'manutencao', 'seguro', 'ipva', 'depreciacao', 'pneus', 'lavagem', 'pedagio', 'multas', 'outros']),
  cost_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  amount_brl: z.number().positive(),
  quantity: z.number().positive().optional().nullable(),
  unit_measure: z.string().optional().nullable(),
  odometer_km: z.number().int().positive().optional().nullable(),
  description: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
})

// ============================================
// Schemas de Orçamento
// ============================================

export const budgetSchema = z.object({
  empresa_id: uuidSchema.optional().nullable(),
  transportadora_id: uuidSchema.optional().nullable(),
  category_id: uuidSchema.optional().nullable(),
  period_month: z.number().min(1).max(12),
  period_year: z.number().min(2020),
  budgeted_amount: z.number().min(0),
  alert_threshold_percent: z.number().min(0).max(100).default(80),
  notes: z.string().optional().nullable(),
})

// ============================================
// Schemas de Operação e Logística
// ============================================

/**
 * Schema para despacho de emergência
 */
export const emergencyDispatchSchema = z.object({
  routeId: uuidSchema,
  driverId: uuidSchema,
  vehicleId: uuidSchema,
})

/**
 * Schema para geração de paradas
 */
export const generateStopsSchema = z.object({
  route_id: uuidSchema.optional(),
  routeId: uuidSchema.optional(),
  employee_db: z.string().optional(),
  employeeDb: z.string().optional(),
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  avg_speed_kmh: z.number().optional(),
  avgSpeedKmh: z.number().optional(),
  db_save: z.boolean().optional(),
  dbSave: z.boolean().optional(),
  table_name: z.string().optional(),
  tableName: z.string().optional(),
  items_per_page: z.number().optional(),
  itemsPerPage: z.number().optional(),
}).refine(data => data.route_id || data.routeId, {
  message: 'ID da rota é obrigatório'
})

/**
 * Schema para otimização de rota
 */
export const optimizeRouteSchema = z.object({
  companyId: uuidSchema,
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  waypoints: z.array(z.object({
    id: z.string(),
    lat: z.number(),
    lng: z.number(),
  })),
  departureTimeIso: z.string().optional(),
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
// Schemas de Viagem (Trip)
// ============================================

export const createTripSchema = z.object({
  rota_id: uuidSchema,
  veiculo_id: uuidSchema.optional().nullable(),
  motorista_id: uuidSchema.optional().nullable(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)').optional(),
  scheduled_start_time: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'inProgress', 'completed', 'cancelled']).default('scheduled'),
  passenger_count: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateTripSchema = createTripSchema.partial().extend({
  id: uuidSchema,
})

// ============================================
// Schemas de Documentos
// ============================================

export const documentSchema = z.object({
  document_type: z.string().min(1, 'Tipo de documento é obrigatório'),
  document_number: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  file_url: z.string().url('URL inválida').optional().nullable(),
  file_name: z.string().optional().nullable(),
  file_size: z.number().optional().nullable(),
  file_type: z.string().optional().nullable(),
  status: z.enum(['valid', 'expired', 'pending', 'rejected']).default('valid'),
  notes: z.string().optional().nullable(),
})

/**
 * Schema para manutenção de veículo
 */
export const vehicleMaintenanceSchema = z.object({
  maintenance_type: z.enum(['preventiva', 'corretiva', 'revisao', 'troca_oleo', 'pneus', 'freios', 'suspensao', 'eletrica', 'outra']),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  completed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  next_maintenance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  odometer_km: z.number().int().positive().optional().nullable(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  cost_parts_brl: z.number().min(0).default(0),
  cost_labor_brl: z.number().min(0).default(0),
  workshop_name: z.string().optional().nullable(),
  mechanic_name: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  notes: z.string().optional().nullable(),
})

/**
 * Schema para exame médico de motorista
 */
export const driverExamSchema = z.object({
  exam_type: z.enum(['admissional', 'periodico', 'toxicologico', 'demissional', 'retorno_trabalho']),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  result: z.enum(['apto', 'inapto', 'apto_com_restricoes']).optional(),
  file_url: z.string().url().optional().nullable(),
  file_name: z.string().optional().nullable(),
  clinic_name: z.string().optional().nullable(),
  doctor_name: z.string().optional().nullable(),
  doctor_crm: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// ============================================
// Schemas de Alertas
// ============================================

export const updateAlertSchema = z.object({
  title: z.string().optional(),
  status: z.enum(['open', 'assigned', 'resolved']).optional(),
  assigned_to: uuidSchema.optional().nullable(),
  description: z.string().optional(),
  message: z.string().optional(),
  severity: z.enum(['critical', 'warning', 'info', 'error']).optional(),
  resolved_at: z.string().optional(),
  resolved_by: uuidSchema.optional().nullable(),
  resolution_notes: z.string().optional(),
})

/**
 * Schema para exclusão de alertas
 */
export const deleteAlertSchema = z.object({
  ids: z.array(uuidSchema).min(1, 'Pelo menos um ID é obrigatório'),
})

/**
 * Schema para atualização de solicitação de assistência
 */
export const updateAssistanceRequestByIdSchema = z.object({
  status: z.enum(['open', 'dispatched', 'in_progress', 'resolved', 'cancelled']).optional(),
  description: z.string().optional(),
  severity: z.enum(['critical', 'warning', 'info', 'error']).optional(),
  request_type: z.string().optional(),
  address: z.string().optional().nullable(),
  route_id: uuidSchema.optional().nullable(),
  dispatched_driver_id: uuidSchema.optional().nullable(),
  dispatched_vehicle_id: uuidSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * Schema para exclusão de solicitações de assistência
 */
export const deleteAssistanceRequestSchema = z.object({
  ids: z.array(uuidSchema).min(1, 'Pelo menos um ID é obrigatório'),
})

// ============================================
// Schemas de Sistema
// ============================================

export const changeRoleSchema = z.object({
  userId: uuidSchema,
  newRole: z.string().min(1, 'Novo papel é obrigatório'),
  oldRole: z.string().optional(),
})

// ============================================
// Schemas de Paginação
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
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
// Schemas de Listagem (Query Parameters)
// ============================================

export const alertListQuerySchema = paginationSchema.extend({
  severity: z.enum(['critical', 'warning', 'info', 'error']).optional(),
  status: z.enum(['open', 'assigned', 'resolved']).optional(),
  empresa_id: uuidSchema.optional(),
  company_id: uuidSchema.optional(),
})

// Schemas de listagem movidos para a seção abaixo (após helpers)
// para evitar redeclaração de variáveis

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
export const routeCostQuerySchema = paginationSchema.extend({
  rota_id: uuidSchema.optional(),
  route_id: uuidSchema.optional(),
  viagem_id: uuidSchema.optional(),
  trip_id: uuidSchema.optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
export const vehicleCostQuerySchema = paginationSchema.extend({
  veiculo_id: uuidSchema.optional(),
  vehicle_id: uuidSchema.optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
export const maintenanceQuerySchema = paginationSchema.extend({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  type: z.string().optional(),
})
export const driverExamQuerySchema = paginationSchema.extend({
  type: z.string().optional(),
  result: z.string().optional(),
})
export const assistanceRequestListQuerySchema = paginationSchema.extend({
  status: z.enum(['open', 'dispatched', 'in_progress', 'resolved', 'cancelled', 'all']).optional(),
  type: z.string().optional(),
})
export const driverListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.string().optional(),
  transportadora_id: uuidSchema.optional(),
})
export const employeeListQuerySchema = paginationSchema.extend({
  empresa_id: uuidSchema.optional(),
  company_id: uuidSchema.optional(),
})
export const routeListQuerySchema = paginationSchema.extend({
  empresa_id: uuidSchema.optional(),
  company_id: uuidSchema.optional(),
})
export const companyListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.string().optional(),
})
export const seedCostCategoriesPostSchema = z.object({
  categories: z.array(z.object({
    id: uuidSchema.optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
  })).optional(),
})
export const vehicleListQuerySchema = paginationSchema.extend({
  transportadora_id: uuidSchema.optional(),
  carrier_id: uuidSchema.optional(),
  status: z.string().optional(),
})

export const userListQuerySchema = paginationSchema.extend({
  role: z.string().optional(),
  status: z.string().optional(),
  company_id: uuidSchema.optional(),
  empresa_id: uuidSchema.optional(),
})

export const carrierListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.string().optional(),
})
export const idQuerySchema = z.object({
  id: uuidSchema,
})

export const tripListQuerySchema = paginationSchema.extend({
  company_id: uuidSchema.optional(),
  companyId: uuidSchema.optional(),
  veiculo_id: uuidSchema.optional(),
  vehicle_id: uuidSchema.optional(),
  route_id: uuidSchema.optional(),
  rota_id: uuidSchema.optional(),
  motorista_id: uuidSchema.optional(),
  driver_id: uuidSchema.optional(),
  status: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const auditLogQuerySchema = paginationSchema.extend({
  actor_id: uuidSchema.optional(),
  action_type: z.string().optional(),
  resource_type: z.string().optional(),
})
