/**
 * Serviço de Realtime para o Mapa Admin
 * Gerencia conexões Supabase Realtime com fallback para polling
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

import { debug, warn, error } from './logger'
import { supabase } from './supabase'

export interface VeiculoPositionUpdate {
  veiculo_id: string
  trip_id: string
  motorista_id: string
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
  veiculo_id: string
  motorista_id: string
  status: 'scheduled' | 'inProgress' | 'completed' | 'cancelled'
  started_at?: string
  completed_at?: string
}

export interface AlertUpdate {
  alert_id: string
  alert_type: 'incident' | 'assistance'
  company_id: string
  route_id?: string
  veiculo_id?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  lat?: number
  lng?: number
  description: string
  created_at: string
}

export type RealtimeUpdateType =
  | { type: 'position'; data: VeiculoPositionUpdate }
  | { type: 'trip'; data: TripUpdate }
  | { type: 'alert'; data: AlertUpdate }

export interface RealtimeServiceOptions {
  onUpdate?: (update: RealtimeUpdateType) => void
  onVehicleUpdate?: (update: VeiculoPositionUpdate) => void
  onAlertUpdate?: (update: AlertUpdate) => void
  onError?: (error: Error) => void
  onConnected?: () => void
  onDisconnected?: () => void
  enablePolling?: boolean
  pollingInterval?: number // ms
}

/**
 * Tipos internos para dados do realtime
 */
interface TripData {
  id: string
  veiculo_id: string
  route_id: string
  motorista_id: string
  status: 'scheduled' | 'inProgress' | 'completed' | 'cancelled'
  started_at?: string
  completed_at?: string
}

interface PositionData {
  trip_id: string
  latitude: number
  longitude: number
  speed: number | null
  heading: number | null
  timestamp: string
  motorista_id?: string
}

interface IncidentData {
  id: string
  company_id: string
  route_id?: string
  veiculo_id?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  description: string
  created_at: string
  status: string
}

interface ServiceRequestData {
  id: string
  empresa_id: string
  route_id?: string
  tipo: string
  status: string
  priority?: string
  notes?: string
  payload?: {
    latitude?: string
    longitude?: string
  }
  created_at: string
}

interface PositionWithTrip extends PositionData {
  trips: TripData
}

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isConnected = false
  private options: RealtimeServiceOptions
  private updateQueue: RealtimeUpdateType[] = []
  private debounceTimer: NodeJS.Timeout | null = null
  private readonly DEBOUNCE_MS = 300
  private tripCache: Map<string, TripData> = new Map()

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
      // Canal para motorista_positions
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
    } catch (err: any) {
      error('Erro ao conectar realtime', { error: err }, 'RealtimeService')
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)))

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
   * Inscreve no canal de motorista_positions
   */
  private async subscribeToDriverPositions(): Promise<void> {
    const channel = (supabase.channel('map:motorista_positions') as unknown as RealtimeChannel)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'motorista_positions',
        },
        async (payload: RealtimePostgresChangesPayload<PositionData>) => {
          try {
            // Buscar dados completos diretamente das tabelas (view v_live_vehicles não existe)
            const position = payload.new as PositionData

            // motorista_positions tem trip_id, não veiculo_id diretamente
            // Buscar trip no cache ou no banco
            let tripData = this.tripCache.get(position.trip_id)

            if (!tripData) {
              const { data, error: tripError } = await (supabase
                .from('viagens')
                .select('id, veiculo_id, route_id, motorista_id, status')
                .eq('id', position.trip_id)
                .single() as any)

              if (tripError || !data) {
                warn('Erro ao buscar trip para posição', { error: tripError }, 'RealtimeService')
                return
              }

              tripData = data as any
              if (tripData?.id) {
                this.tripCache.set(tripData.id, tripData)
              }
            }

            if (!tripData || !position.latitude || !position.longitude) {
              return
            }

            if (!tripData) return

            this.queueUpdate({
              type: 'position',
              data: {
                veiculo_id: tripData.veiculo_id,
                trip_id: position.trip_id,
                motorista_id: tripData.motorista_id || (position as any).motorista_id || '',
                route_id: tripData.route_id || '',
                lat: position.latitude,
                lng: position.longitude,
                speed: position.speed || null,
                heading: position.heading || null,
                timestamp: position.timestamp || new Date().toISOString(),
                vehicle_status: (position.speed && position.speed > 0.83) ? 'moving' : 'stopped_short',
                passenger_count: 0,
              },
            })
          } catch (err: any) {
            error('Erro ao processar atualização de posição', { error: err }, 'RealtimeService')
            this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          debug('Conectado ao canal motorista_positions', undefined, 'RealtimeService')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          warn('Canal motorista_positions indisponível, usando polling', undefined, 'RealtimeService')
          // Não disparamos onError aqui para evitar ruído de logs;
          // o polling já está habilitado como fallback em connect().
        }
      }) as unknown as RealtimeChannel

    this.channels.set('motorista_positions', channel)
  }

  /**
   * Inscreve no canal de trips
   */
  private async subscribeToTrips(): Promise<void> {
    const channel = (supabase.channel('map:trips') as unknown as RealtimeChannel)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
        },
        (payload: RealtimePostgresChangesPayload<TripData>) => {
          const trip = payload.new as TripData

          // Atualizar cache
          this.tripCache.set(trip.id, trip)

          this.queueUpdate({
            type: 'trip',
            data: {
              trip_id: trip.id,
              route_id: trip.route_id,
              veiculo_id: trip.veiculo_id,
              motorista_id: trip.motorista_id,
              status: trip.status,
              started_at: trip.started_at,
              completed_at: trip.completed_at,
            },
          })
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          debug('Conectado ao canal trips', undefined, 'RealtimeService')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          warn('Canal trips indisponível, usando polling', undefined, 'RealtimeService')
        }
      }) as unknown as RealtimeChannel

    this.channels.set('trips', channel)
  }

  /**
   * Inscreve no canal de alerts
   */
  private async subscribeToAlerts(): Promise<void> {
    // Assumindo que alerts vêm de gf_incidents e gf_service_requests
    // Vamos escutar ambas as tabelas

    // Canal para gf_incidents
    const channelIncidents = (supabase.channel('map:incidents') as unknown as RealtimeChannel)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gf_incidents',
          filter: 'status=eq.open',
        },
        (payload: RealtimePostgresChangesPayload<IncidentData>) => {
          const incident = payload.new as IncidentData
          this.queueUpdate({
            type: 'alert',
            data: {
              alert_id: incident.id,
              alert_type: 'incident',
              company_id: incident.company_id,
              route_id: incident.route_id,
              veiculo_id: incident.veiculo_id,
              severity: incident.severity || 'medium',
              lat: undefined, // gf_incidents não tem lat
              lng: undefined, // gf_incidents não tem lng
              description: incident.description,
              created_at: incident.created_at,
            },
          })
        }
      )
      .subscribe() as unknown as RealtimeChannel

    this.channels.set('incidents', channelIncidents)

    // Canal para gf_service_requests (socorro)
    const channelAssistance = (supabase.channel('map:assistance') as unknown as RealtimeChannel)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gf_service_requests',
          filter: 'tipo=eq.socorro',
        },
        (payload: RealtimePostgresChangesPayload<ServiceRequestData>) => {
          const request = payload.new as ServiceRequestData
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
      .subscribe() as unknown as RealtimeChannel

    this.channels.set('assistance', channelAssistance)
  }

  /**
   * Inicia polling como fallback
   */
  private startPolling(): void {
    // Polling para posições (usando tabela motorista_positions diretamente)
    const positionInterval = setInterval(async () => {
      try {
        // Buscar últimas posições diretamente da tabela motorista_positions
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data: positionsData, error } = await (supabase
          .from('motorista_positions')
          .select(`
            trip_id,
            latitude,
            longitude,
            speed,
            heading,
            timestamp,
            trips!inner(veiculo_id, route_id, motorista_id, status)
          `)
          .gte('timestamp', fiveMinutesAgo)
          .eq('trips.status', 'inProgress')
          .order('timestamp', { ascending: false })
          .limit(100) as any)

        if (error) {
          // Se der erro, apenas logar (não quebrar o polling)
          warn('Erro no polling de posições (view v_live_vehicles não existe, usando motorista_positions)', { error }, 'RealtimeService')
          return
        }

        if (positionsData && positionsData.length > 0) {
          positionsData.forEach((pos: PositionWithTrip) => {
            const trip = pos.trips
            if (trip && pos.latitude && pos.longitude) {
              this.queueUpdate({
                type: 'position',
                data: {
                  veiculo_id: (trip as any).veiculo_id || (trip as any).vehicle_id,
                  trip_id: pos.trip_id,
                  motorista_id: (trip as any).motorista_id,
                  route_id: (trip as any).route_id,
                  lat: pos.latitude,
                  lng: pos.longitude,
                  speed: pos.speed || null,
                  heading: pos.heading || null,
                  timestamp: pos.timestamp,
                  vehicle_status: pos.speed && pos.speed > 0.83 ? 'moving' : 'stopped_short',
                  passenger_count: 0,
                },
              })
            }
          })
        }
      } catch (err: any) {
        error('Erro no polling de posições', { error: err }, 'RealtimeService')
      }
    }, this.options.pollingInterval)

    this.pollingIntervals.set('positions', positionInterval)

    // Polling para alertas - DESABILITADO TEMPORARIAMENTE devido a problemas de schema cache
    // Os alertas serão carregados apenas via subscriptions do realtime
    const alertsInterval = setInterval(async () => {
      // Polling desabilitado - usar apenas subscriptions
      // try {
      //   const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
      //   
      //   // Buscar incidentes abertos
      //   const { data: incidentsData, error: incidentsError } = await supabase
      //     .from('gf_incidents')
      //     .select('id, company_id, route_id, veiculo_id, severity, description, created_at, status')
      //     .eq('status', 'open')
      //     .gte('created_at', oneHourAgo)

      //   // Buscar solicitações de socorro abertas
      //   const { data: assistanceData, error: assistanceError } = await supabase
      //     .from('gf_service_requests')
      //     .select('id, empresa_id, route_id, tipo, status, payload, created_at')
      //     .eq('tipo', 'socorro')
      //     .eq('status', 'open')
      //     .gte('created_at', oneHourAgo)

      //   if (incidentsError && assistanceError) {
      //     return
      //   }

      //   // Processar alertas...
      // } catch (error: any) {
      //   // Silenciar erros
      // }
    }, (this.options.pollingInterval || 5000) * 2) // Alertas menos frequente

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

      if (update.type === 'position' && this.options.onVehicleUpdate) {
        this.options.onVehicleUpdate(update.data)
      } else if (update.type === 'alert' && this.options.onAlertUpdate) {
        this.options.onAlertUpdate(update.data)
      }
    })
  }

  /**
   * Verifica se está conectado
   */
  get connected(): boolean {
    return this.isConnected
  }
}

