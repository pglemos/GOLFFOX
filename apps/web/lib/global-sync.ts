/**
 * Sistema de sincronização global para notificar todos os painéis
 * quando dados são criados/atualizados no Supabase
 */

type SyncEventType = 
  | 'company.created' 
  | 'company.updated' 
  | 'company.deleted'
  | 'user.created'
  | 'user.updated' 
  | 'user.deleted'
  | 'veiculo.created'
  | 'veiculo.updated'
  | 'veiculo.deleted'
  | 'route.created'
  | 'route.updated'
  | 'route.deleted'
  | 'motorista.created'
  | 'motorista.updated'
  | 'motorista.deleted'
  | 'employee.created'
  | 'employee.updated'
  | 'employee.deleted'
  | 'alert.created'
  | 'alert.updated'
  | 'cost.created'
  | 'cost.updated'
  | 'assistance_request.updated'

type SyncCallback = (event: { type: SyncEventType; data: any }) => void

class GlobalSyncManager {
  private listeners: Set<SyncCallback> = new Set()
  private channels: Map<string, any> = new Map()
  private isInitialized = false

  init() {
    if (this.isInitialized || typeof window === 'undefined') return
    this.isInitialized = true

    // Importar supabase dinamicamente
    // NOTA: Realtime desabilitado temporariamente para evitar problemas de carregamento
    // A sincronização manual via triggerSync() ainda funciona
    /*
    import('@/lib/supabase').then(({ supabase }) => {
      // Escutar mudanças em tabelas principais via Supabase Realtime
      const tables = [
        'companies',
        'users',
        'veiculos',
        'routes',
        'gf_employee_company',
        'gf_incidents',
        'gf_costs'
      ]

      tables.forEach(table => {
        const channel = supabase
          .channel(`sync-${table}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table
            },
            (payload) => {
              this.handleChange(table, payload)
            }
          )
          .subscribe()

        this.channels.set(table, channel)
      })
    })
    */
  }

  private handleChange(table: string, payload: any) {
    const eventType = this.mapTableToEventType(table, payload.eventType)
    if (!eventType) return

    const event = {
      type: eventType,
      data: payload.new || payload.old
    }

    // Notificar todos os listeners
    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Erro ao executar callback de sincronização:', error)
      }
    })
  }

  private mapTableToEventType(table: string, eventType: string): SyncEventType | null {
    const eventMap: Record<string, Record<string, SyncEventType>> = {
      'companies': {
        'INSERT': 'company.created',
        'UPDATE': 'company.updated',
        'DELETE': 'company.deleted'
      },
      'users': {
        'INSERT': 'user.created',
        'UPDATE': 'user.updated',
        'DELETE': 'user.deleted'
      },
      'veiculos': {
        'INSERT': 'veiculo.created',
        'UPDATE': 'veiculo.updated',
        'DELETE': 'veiculo.deleted'
      },
      'routes': {
        'INSERT': 'route.created',
        'UPDATE': 'route.updated',
        'DELETE': 'route.deleted'
      },
      'gf_employee_company': {
        'INSERT': 'employee.created',
        'UPDATE': 'employee.updated',
        'DELETE': 'employee.deleted'
      },
      'gf_incidents': {
        'INSERT': 'alert.created',
        'UPDATE': 'alert.updated'
      },
      'gf_costs': {
        'INSERT': 'cost.created',
        'UPDATE': 'cost.updated'
      }
    }

    return eventMap[table]?.[eventType] || null
  }

  subscribe(callback: SyncCallback) {
    this.listeners.add(callback)
    return () => this.unsubscribe(callback)
  }

  unsubscribe(callback: SyncCallback) {
    this.listeners.delete(callback)
  }

  // Método para forçar sincronização manual (útil após criar/atualizar dados)
  triggerSync(eventType: SyncEventType, data: any) {
    const event = { type: eventType, data }
    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Erro ao executar callback de sincronização:', error)
      }
    })
  }

  cleanup() {
    if (typeof window === 'undefined') return
    
    import('@/lib/supabase').then(({ supabase }) => {
      this.channels.forEach((channel) => {
        (supabase as any).removeChannel(channel)
      })
    })
    this.channels.clear()
    this.listeners.clear()
    this.isInitialized = false
  }
}

export const globalSyncManager = new GlobalSyncManager()

// Inicializar quando o módulo for carregado
if (typeof window !== 'undefined') {
  globalSyncManager.init()
}

