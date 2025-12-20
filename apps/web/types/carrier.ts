/**
 * Tipos TypeScript para transportadora/Transportadora
 * Baseados nos schemas Zod definidos nas rotas de API
 */

export interface transportadora {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  contact_person?: string | null
  email?: string | null
  cnpj?: string | null
  state_registration?: string | null
  municipal_registration?: string | null
  address_zip_code?: string | null
  address_street?: string | null
  address_number?: string | null
  address_neighborhood?: string | null
  address_complement?: string | null
  address_city?: string | null
  address_state?: string | null
  // Banking Information
  bank_name?: string | null
  bank_code?: string | null
  bank_agency?: string | null
  bank_account?: string | null
  bank_account_type?: 'corrente' | 'poupanca' | null
  pix_key?: string | null
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria' | null
  // Legal Representative
  legal_rep_name?: string | null
  legal_rep_cpf?: string | null
  legal_rep_rg?: string | null
  legal_rep_email?: string | null
  legal_rep_phone?: string | null
  created_at?: string
  updated_at?: string
}

export interface CarrierInsert {
  name: string
  address?: string | null
  phone?: string | null
  contact_person?: string | null
  email?: string | null
  cnpj?: string | null
  state_registration?: string | null
  municipal_registration?: string | null
  address_zip_code?: string | null
  address_street?: string | null
  address_number?: string | null
  address_neighborhood?: string | null
  address_complement?: string | null
  address_city?: string | null
  address_state?: string | null
}

export interface CarrierUpdate extends Partial<CarrierInsert> {
  name: string
  updated_at?: string
}

