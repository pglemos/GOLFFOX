/**
 * Serviço de Realtime para o Mapa Admin
 * Gerencia conexões Supabase Realtime com fallback para polling
 */

import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface VehiclePositionUpdate {
  vehicle_id: string
  trip_id: string
  driver_id: string
  route_id: string
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  timestamp: string
  vehicle_status: 'moving' | 'stopped_short' | 'stopped_long' | 'garage'
  passenger_count: number
}

export interface TripUpdate {
  trip_id: string
  route_id: string
  vehicle_id: string
  driver_id: string
  status: 'scheduled' | 'inProgress' | 'completed' | 'cancelled'
  started_at?: string
  completed_at?: string
}

export interface AlertUpdate {
  alert_id: string
  alert_type: 'incident' | 'assistance'
  company_id: string
  route_id?: string
  vehicle_id?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  lat?: number
  lng?: number
  description: string
  created_at: string
}

export type RealtimeUpdateType = 
  | { type: 'position'; data: VehiclePositionUpdate }
  | { type: 'trip'; data: TripUpdate }
  | { type: 'alert'; data: AlertUpdate }

export interface RealtimeServiceOptions {
  onUpdate?: (update: RealtimeUpdateType) => void
  onError?: (error: Error) => void
  onConnected?: () => void
  onDisconnected?: () => void
  enablePolling?: boolean
  pollingInterval?: number // ms
}

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isConnected = false
  private options: RealtimeServiceOptions
  private updateQueue: RealtimeUpdateType[] = []
  private debounceTimer: NodeJS.Timeout | null = null
  private readonly DEBOUNCE_MS = 300

  constructor(options: RealtimeServiceOptions = {}) {
    this.options = {
      enablePolling: true,
      pollingInterval: 5000, // 5 segundos
      ...options,
    }
  }

  /**
   * Conecta aos canais de realtime
   */
  async connect(): Promise<void> {
    try {
      // Canal para driver_positions
      await this.subscribeToDriverPositions()
      
      // Canal para trips
      await this.subscribeToTrips()
      
      // Canal para alerts
      await this.subscribeToAlerts()

      this.isConnected = true
      this.options.onConnected?.()

      // Se polling está habilitado, iniciar como fallback
      if (this.options.enablePolling) {
        this.startPolling()
      }
    } catch (error: any) {
      console.error('Erro ao conectar realtime:', error)
      this.options.onError?.(error)
      
      // Se realtime falhar, usar apenas polling
      if (this.options.enablePolling) {
        this.startPolling()
      }
    }
  }

  /**
   * Desconecta de todos os canais
   */
  async disconnect(): Promise<void> {
    // Desconectar canais
    for (const [name, channel] of this.channels) {
      await channel.unsubscribe()
      this.channels.delete(name)
    }

    // Limpar polling
    for (const [name, interval] of this.pollingIntervals) {
      clearInterval(interval)
      this.pollingIntervals.delete(name)
    }

    // Limpar debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    this.isConnected = false
    this.options.onDisconnected?.()
  }

  /**
   * Inscreve no canal de driver_positions
   */
  private async subscribeToDriverPositions(): Promise<void> {
    const channel = supabase
      .channel('map:driver_positions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_positions',
        },
        async (payload) => {
          try {
            // Buscar dados completos da view
            const { data, error } = await supabase
              .from('v_live_vehicles')
              .select('*')
              .eq('vehicle_id', (payload.new as any).vehicle_id || '')
              .single()

            if (error || !data) {
              console.warn('Erro ao buscar dados completos do veículo:', error)
              return
            }

            this.queueUpdate({
              type: 'position',
              data: {
                vehicle_id: data.vehicle_id,
                trip_id: data.trip_id,
                driver_id: data.driver_id,
                route_id: data.route_id,
                lat: data.lat,
                lng: data.lng,
                speed: data.speed,
                heading: data.heading,
                timestamp: data.last_position_time,
                vehicle_status: data.vehicle_status as any,
                passenger_count: data.passenger_count,
              },
            })
          } catch (error: any) {
            console.error('Erro ao processar atualização de posição:', error)
            this.options.onError?.(error)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Conectado ao canal driver_positions')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Canal driver_positions indisponível, usando polling')
          // Não disparamos onError aqui para evitar ruído de logs;
          // o polling já está habilitado como fallback em connect().
        }
      })

    this.channels.set('driver_positions', channel)
  }

  /**
   * Inscreve no canal de trips
   */
  private async subscribeToTrips(): Promise<void> {
    const channel = supabase
      .channel('map:trips')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
        },
        (payload) => {
          const trip = payload.new as any
          this.queueUpdate({
            type: 'trip',
            data: {
              trip_id: trip.id,
              route_id: trip.route_id,
              vehicle_id: trip.vehicle_id,
              driver_id: trip.driver_id,
              status: trip.status,
              started_at: trip.started_at,
              completed_at: trip.completed_at,
            },
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Conectado ao canal trips')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Canal trips indisponível, usando polling')
        }
      })

    this.channels.set('trips', channel)
  }

  /**
   * Inscreve no canal de alerts
   */
  private async subscribeToAlerts(): Promise<void> {
    // Assumindo que alerts vêm de gf_incidents e gf_service_requests
    // Vamos escutar ambas as tabelas

    // Canal para gf_incidents
    const channelIncidents = supabase
      .channel('map:incidents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gf_incidents',
          filter: 'status=eq.open',
        },
        (payload) => {
          const incident = payload.new as any
          this.queueUpdate({
            type: 'alert',
            data: {
              alert_id: incident.id,
              alert_type: 'incident',
              company_id: incident.company_id,
              route_id: incident.route_id,
              vehicle_id: incident.vehicle_id,
              severity: incident.severity || 'medium',
              description: incident.description,
              created_at: incident.created_at,
            },
          })
        }
      )
      .subscribe()

    this.channels.set('incidents', channelIncidents)

    // Canal para gf_service_requests (socorro)
    const channelAssistance = supabase
      .channel('map:assistance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gf_service_requests',
          filter: 'tipo=eq.socorro',
        },
        (payload) => {
          const request = payload.new as any
          const lat = request.payload?.latitude
          const lng = request.payload?.longitude

          this.queueUpdate({
            type: 'alert',
            data: {
              alert_id: request.id,
              alert_type: 'assistance',
              company_id: request.empresa_id,
              severity: request.priority === 'urgente' ? 'critical' : 
                       request.priority === 'alta' ? 'high' : 'medium',
              lat: lat ? parseFloat(lat) : undefined,
              lng: lng ? parseFloat(lng) : undefined,
              description: request.notes || 'Solicitação de socorro',
              created_at: request.created_at,
            },
          })
        }
      )
      .subscribe()

    this.channels.set('assistance', channelAssistance)
  }

  /**
   * Inicia polling como fallback
   */
  private startPolling(): void {
    // Polling para posições
    const positionInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('v_live_vehicles')
          .select('*')
          .gte('last_position_time', new Date(Date.now() - 60000).toISOString()) // Últimos 60s

        if (error) {
          console.warn('Erro no polling de posições:', error)
          return
        }

        if (data && data.length > 0) {
          data.forEach((vehicle: any) => {
            this.queueUpdate({
              type: 'position',
              data: {
                vehicle_id: vehicle.vehicle_id,
                trip_id: vehicle.trip_id,
                driver_id: vehicle.driver_id,
                route_id: vehicle.route_id,
                lat: vehicle.lat,
                lng: vehicle.lng,
                speed: vehicle.speed,
                heading: vehicle.heading,
                timestamp: vehicle.last_position_time,
                vehicle_status: vehicle.vehicle_status,
                passenger_count: vehicle.passenger_count,
              },
            })
          })
        }
      } catch (error: any) {
        console.error('Erro no polling de posições:', error)
      }
    }, this.options.pollingInterval)

    this.pollingIntervals.set('positions', positionInterval)

    // Polling para alertas
    const alertsInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('v_alerts_open')
          .select('*')
          .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Última hora

        if (error) {
          console.warn('Erro no polling de alertas:', error)
          return
        }

        if (data && data.length > 0) {
          data.forEach((alert: any) => {
            this.queueUpdate({
              type: 'alert',
              data: {
                alert_id: alert.alert_id,
                alert_type: alert.alert_type,
                company_id: alert.company_id,
                route_id: alert.route_id,
                vehicle_id: alert.vehicle_id,
                severity: alert.severity,
                lat: alert.lat,
                lng: alert.lng,
                description: alert.description,
                created_at: alert.created_at,
              },
            })
          })
        }
      } catch (error: any) {
        console.error('Erro no polling de alertas:', error)
      }
    }, this.options.pollingInterval! * 2) // Alertas menos frequente

    this.pollingIntervals.set('alerts', alertsInterval)
  }

  /**
   * Adiciona update à fila com debounce
   */
  private queueUpdate(update: RealtimeUpdateType): void {
    this.updateQueue.push(update)

    // Debounce: processar após 300ms de inatividade
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.processQueue()
    }, this.DEBOUNCE_MS)
  }

  /**
   * Processa a fila de updates
   */
  private processQueue(): void {
    const updates = [...this.updateQueue]
    this.updateQueue = []

    // Enviar updates em lote
    updates.forEach((update) => {
      this.options.onUpdate?.(update)
    })
  }

  /**
   * Verifica se está conectado
   */
  get connected(): boolean {
    return this.isConnected
  }
}

