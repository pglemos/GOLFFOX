/**
 * veiculo Updated Domain Event
 * 
 * Evento de domínio disparado quando um veículo é atualizado
 */

export interface VehicleUpdatedEventData {
  vehicleId: string
  changes: Record<string, unknown>
  updatedBy: string
  updatedAt: Date
}

export class VehicleUpdatedEvent {
  readonly eventId: string
  readonly eventType = 'VehicleUpdated'
  readonly occurredAt: Date

  constructor(public readonly data: VehicleUpdatedEventData) {
    this.eventId = crypto.randomUUID()
    this.occurredAt = new Date()
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredAt: this.occurredAt.toISOString(),
      data: {
        ...this.data,
        updatedAt: this.data.updatedAt.toISOString(),
      },
    }
  }
}
