/**
 * Tipos TypeScript para Carrier/Transportadora
 * Baseados nos schemas Zod definidos nas rotas de API
 */

export interface Carrier {
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

