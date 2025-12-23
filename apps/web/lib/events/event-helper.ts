/**
 * Event Helper
 * 
 * Helper para facilitar criação e publicação de eventos de domínio
 */

import { randomUUID } from 'crypto'

import { debug, logError } from '@/lib/logger'

import { eventPublisher } from './event-publisher'
import { DomainEvent } from './event-store'
import { eventStore } from './event-store'


/**
 * Cria e publica um evento de domínio
 */
export async function publishDomainEvent(
  eventType: string,
  aggregateType: string,
  aggregateId: string,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const event: DomainEvent = {
      eventId: randomUUID(),
      eventType,
      aggregateType,
      aggregateId,
      occurredAt: new Date(),
      data,
      metadata: metadata || {},
    }

    // Salvar no event store (que já publica automaticamente)
    await eventStore.save(event)

    debug('Evento publicado', {
      eventType,
      aggregateType,
      aggregateId,
    }, 'EventHelper')
  } catch (error) {
    logError('Erro ao publicar evento de domínio', {
      error,
      eventType,
      aggregateType,
      aggregateId,
    }, 'EventHelper')
    // Não propagar erro - eventos não devem quebrar o fluxo principal
  }
}

/**
 * Helper para eventos de criação
 */
export async function publishCreatedEvent(
  aggregateType: string,
  aggregateId: string,
  data: Record<string, unknown>,
  userId?: string
): Promise<void> {
  const eventType = `${aggregateType}Created`
  await publishDomainEvent(
    eventType,
    aggregateType,
    aggregateId,
    data,
    userId ? { userId } : undefined
  )
}

/**
 * Helper para eventos de atualização
 */
export async function publishUpdatedEvent(
  aggregateType: string,
  aggregateId: string,
  changes: Record<string, unknown>,
  userId?: string
): Promise<void> {
  const eventType = `${aggregateType}Updated`
  await publishDomainEvent(
    eventType,
    aggregateType,
    aggregateId,
    { changes },
    userId ? { userId } : undefined
  )
}

/**
 * Helper para eventos de exclusão
 */
export async function publishDeletedEvent(
  aggregateType: string,
  aggregateId: string,
  userId?: string
): Promise<void> {
  const eventType = `${aggregateType}Deleted`
  await publishDomainEvent(
    eventType,
    aggregateType,
    aggregateId,
    {},
    userId ? { userId } : undefined
  )
}

