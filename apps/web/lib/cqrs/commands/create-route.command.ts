/**
 * Create Route Command
 * 
 * Command para criar uma nova rota
 */

export interface CreateRouteCommandPayload {
  name: string
  origin: string
  destination: string
  company_id: string
  distance_km?: number
  estimated_duration_minutes?: number
  is_active?: boolean
}

export class CreateRouteCommand {
  readonly type = 'CreateRouteCommand'
  constructor(public readonly payload: CreateRouteCommandPayload) {}
}

