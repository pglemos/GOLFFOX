/**
 * Create Company Command
 * 
 * Command para criar uma nova empresa
 */

export interface CreateCompanyCommandPayload {
  name: string
  email?: string | null
  phone?: string | null
  is_active?: boolean
}

export class CreateCompanyCommand {
  readonly type = 'CreateCompanyCommand'
  constructor(public readonly payload: CreateCompanyCommandPayload) {}
}
