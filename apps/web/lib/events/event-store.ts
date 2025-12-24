/**
 * Event Store
 * 
 * Armazena eventos de domínio para event sourcing
 */

import { createClient } from '@supabase/supabase-js'

import { logError, debug } from '@/lib/logger'

export interface DomainEvent {
  eventId: string
  eventType: string
  aggregateId: string
  aggregateType: string
  occurredAt: Date
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
}

class EventStore {
  private supabase: ReturnType<typeof createClient> | null = null

  private getSupabase() {
    if (this.supabase) {
      return this.supabase
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      throw new Error('Supabase não configurado')
    }

    this.supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    return this.supabase
  }

  /**
   * Salvar evento no event store
   */
  async save(event: DomainEvent): Promise<void> {
    try {
      const supabase = this.getSupabase()

      const { error } = await supabase.from('gf_event_store').insert({
        event_id: event.eventId,
        event_type: event.eventType,
        aggregate_id: event.aggregateId,
        aggregate_type: event.aggregateType,
        occurred_at: event.occurredAt.toISOString(),
        event_data: event.data,
        metadata: event.metadata || {},
        created_at: new Date().toISOString(),
      })

      if (error) {
        logError('Erro ao salvar evento no event store', { error, event }, 'EventStore')
        throw error
      }

      debug('Evento salvo no event store', { 
        eventType: event.eventType, 
        aggregateId: event.aggregateId 
      }, 'EventStore')
      
      // Publicar evento após salvar (para handlers)
      // Importação dinâmica para evitar dependência circular
      const { eventPublisher } = await import('./event-publisher')
      await eventPublisher.publish(event)
    } catch (error) {
      logError('Falha ao salvar evento', { error, event }, 'EventStore')
      throw error
    }
  }

  /**
   * Buscar eventos por aggregate
   */
  async getEventsByAggregate(
    aggregateType: string,
    aggregateId: string
  ): Promise<DomainEvent[]> {
    try {
      const supabase = this.getSupabase()

      const { data, error } = await supabase
        .from('gf_event_store')
        .select('id, event_id, event_type, aggregate_id, aggregate_type, occurred_at, event_data, metadata, created_at')
        .eq('aggregate_type', aggregateType)
        .eq('aggregate_id', aggregateId)
        .order('occurred_at', { ascending: true })

      if (error) {
        logError('Erro ao buscar eventos', { error, aggregateType, aggregateId }, 'EventStore')
        throw error
      }

      return (data || []).map(this.mapToDomainEvent)
    } catch (error) {
      logError('Falha ao buscar eventos', { error, aggregateType, aggregateId }, 'EventStore')
      throw error
    }
  }

  /**
   * Mapear dados do banco para DomainEvent
   */
  private mapToDomainEvent(row: any): DomainEvent {
    return {
      eventId: row.event_id,
      eventType: row.event_type,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      occurredAt: new Date(row.occurred_at),
      data: row.event_data || {},
      metadata: row.metadata || {},
    }
  }
}

// Singleton
export const eventStore = new EventStore()
