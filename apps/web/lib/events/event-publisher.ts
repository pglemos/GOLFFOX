/**
 * Event Publisher
 * 
 * Publica eventos de domínio para handlers
 */

import { debug, logError } from '@/lib/logger'

import { DomainEvent } from './event-store'

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>

class EventPublisher {
  private handlers = new Map<string, EventHandler[]>()

  /**
   * Registrar handler para um tipo de evento
   */
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }

    this.handlers.get(eventType)!.push(handler)
    debug('Handler registrado', { eventType }, 'EventPublisher')
  }

  /**
   * Publicar evento para todos os handlers registrados
   */
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || []

    if (handlers.length === 0) {
      debug('Nenhum handler registrado para evento', { eventType: event.eventType }, 'EventPublisher')
      return
    }

    // Executar todos os handlers em paralelo
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event)
      } catch (error) {
        logError('Erro ao executar handler de evento', {
          error,
          eventType: event.eventType,
          eventId: event.eventId,
        }, 'EventPublisher')
        // Não propagar erro - outros handlers devem executar
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * Publicar múltiplos eventos
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }
}

// Singleton
export const eventPublisher = new EventPublisher()
