/**
 * Update Vehicle Command
 * 
 * Command para atualizar um veículo
 */

export interface UpdateVehicleCommandPayload {
  vehicleId: string
  plate?: string
  model?: string
  brand?: string | null
  year?: number | null
  capacity?: number | null
  company_id?: string | null
  transportadora_id?: string | null
  is_active?: boolean
}

export class UpdateVehicleCommand {
  readonly type = 'UpdateVehicleCommand'
  constructor(public readonly payload: UpdateVehicleCommandPayload) {}
}
