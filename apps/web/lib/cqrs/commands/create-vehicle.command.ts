/**
 * Create veiculo Command
 * 
 * Command para criar um novo veículo
 */

export interface CreateVehicleCommandPayload {
  plate: string
  model: string
  brand?: string
  year?: number
  capacity?: number
  company_id?: string
  is_active?: boolean
}

export class CreateVeiculoCommand {
  readonly type = 'CreateVeiculoCommand'
  constructor(public readonly payload: CreateVehicleCommandPayload) {}
}

