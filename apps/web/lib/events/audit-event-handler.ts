/**
 * Audit Event Handler
 * 
 * Handler que registra eventos de domínio em gf_audit_log para auditoria
 */

import { DomainEvent } from './event-store'
import { EventHandler } from './event-publisher'
import { createClient } from '@supabase/supabase-js'
import { logError, debug } from '@/lib/logger'

class AuditEventHandler {
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

  async handle(event: DomainEvent): Promise<void> {
    try {
      const supabase = this.getSupabase()

      // Extrair userId do metadata (se disponível)
      const userId = (event.metadata?.userId as string) || 'system'

      // Criar log de auditoria
      // Usar 'as any' porque gf_audit_log pode não estar nos tipos gerados do Supabase
      const { error } = await (supabase.from('gf_audit_log') as any).insert({
        actor_id: userId,
        action_type: event.eventType,
        resource_type: event.aggregateType,
        resource_id: event.aggregateId,
        details: {
          eventId: event.eventId,
          eventData: event.data,
          occurredAt: event.occurredAt.toISOString(),
          ...event.metadata,
        },
        created_at: new Date().toISOString(),
      })

      if (error) {
        logError('Erro ao registrar evento em audit log', {
          error,
          eventType: event.eventType,
          eventId: event.eventId,
        }, 'AuditEventHandler')
        // Não propagar erro - auditoria não deve quebrar o fluxo
        return
      }

      debug('Evento registrado em audit log', {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
      }, 'AuditEventHandler')
    } catch (error) {
      logError('Exceção ao registrar evento em audit log', {
        error,
        eventType: event.eventType,
      }, 'AuditEventHandler')
      // Não propagar erro
    }
  }
}

// Singleton
export const auditEventHandler = new AuditEventHandler()

// Criar função handler compatível com EventHandler
const auditHandlerFn: EventHandler<DomainEvent> = async (event: DomainEvent) => {
  return auditEventHandler.handle(event)
}

// Registrar handler para todos os eventos
import { eventPublisher } from './event-publisher'

// Registrar para eventos específicos (pode ser expandido)
eventPublisher.subscribe('CompanyCreated', auditHandlerFn)
eventPublisher.subscribe('CompanyUpdated', auditHandlerFn)
eventPublisher.subscribe('VehicleCreated', auditHandlerFn)
eventPublisher.subscribe('VehicleUpdated', auditHandlerFn)
