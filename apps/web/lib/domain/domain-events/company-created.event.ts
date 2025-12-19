/**
 * Company Created Domain Event
 * 
 * Evento de domínio disparado quando uma empresa é criada
 */

export interface CompanyCreatedEventData {
  companyId: string
  name: string
  email?: string | null
  createdBy: string
  createdAt: Date
}

export class CompanyCreatedEvent {
  readonly eventId: string
  readonly eventType = 'CompanyCreated'
  readonly occurredAt: Date

  constructor(public readonly data: CompanyCreatedEventData) {
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
        createdAt: this.data.createdAt.toISOString(),
      },
    }
  }
}
