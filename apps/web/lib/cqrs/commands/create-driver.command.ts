/**
 * Create Driver Command
 * 
 * Command para criar um novo motorista
 */

export interface CreateDriverCommandPayload {
  name: string
  email: string
  phone?: string
  cpf?: string
  cnh?: string
  cnh_category?: string
  transportadora_id?: string
  company_id?: string
  is_active?: boolean
}

export class CreateDriverCommand {
  readonly type = 'CreateDriverCommand'
  constructor(public readonly payload: CreateDriverCommandPayload) {}
}

