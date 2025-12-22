/**
 * Tipos relacionados a Contratos
 */

/**
 * Contrato
 */
export interface Contract {
  id: string
  number: string
  company_id: string
  company_name?: string
  transportadora_id: string
  transportadora_name?: string
  start_date: string
  end_date: string
  status: ContractStatus
  type: ContractType
  value: number
  payment_terms?: string
  description?: string
  terms_url?: string
  signed_at?: string
  signed_by?: string
  created_at: string
  updated_at: string
}

/**
 * Status do Contrato
 */
export type ContractStatus = 
  | 'draft' 
  | 'pending_signature' 
  | 'active' 
  | 'suspended' 
  | 'expired' 
  | 'cancelled'

/**
 * Tipo de Contrato
 */
export type ContractType = 
  | 'fixed' 
  | 'per_km' 
  | 'per_trip' 
  | 'per_passenger' 
  | 'mixed'

/**
 * Renovação de Contrato
 */
export interface ContractRenewal {
  id: string
  contract_id: string
  original_end_date: string
  new_end_date: string
  value_adjustment?: number
  adjustment_percent?: number
  reason?: string
  approved_by?: string
  approved_at?: string
  created_at: string
}

/**
 * Aditivo de Contrato
 */
export interface ContractAmendment {
  id: string
  contract_id: string
  number: string
  description: string
  changes: Record<string, { from: unknown; to: unknown }>
  effective_date: string
  approved_by?: string
  approved_at?: string
  created_at: string
}

/**
 * Filtros de Contrato
 */
export interface ContractFilters {
  status?: ContractStatus[]
  type?: ContractType[]
  companyId?: string
  transportadoraId?: string
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
}

