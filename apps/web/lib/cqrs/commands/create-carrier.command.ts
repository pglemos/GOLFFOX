/**
 * Create transportadora Command
 * 
 * Command para criar uma nova transportadora
 */

export interface CreateCarrierCommandPayload {
  name: string
  cnpj?: string
  address?: string
  phone?: string
  email?: string
  is_active?: boolean
}

export class CreateCarrierCommand {
  readonly type = 'CreateCarrierCommand'
  constructor(public readonly payload: CreateCarrierCommandPayload) {}
}

