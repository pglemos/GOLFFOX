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

export class CreateVehicleCommand {
  readonly type = 'CreateVehicleCommand'
  constructor(public readonly payload: CreateVehicleCommandPayload) {}
}

