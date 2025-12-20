/**
 * Trips Service
 * 
 * Serviço para gerenciar viagens no mobile
 * Substitui dados mock por chamadas reais ao Supabase
 */

import { supabase } from './supabase'
import { debug, logError } from '@/lib/logger'

export interface Trip {
  id: string
  code: string
  type: 'entrada' | 'saida'
  shift: string
  departureTime: string
  arrivalTime: string
  origin: string
  destination: string
  originCity: string
  destinationCity: string
  isNext: boolean
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  vehicleId?: string
  driverId?: string
  routeId?: string
}

export class TripsService {
  /**
   * Buscar próximas viagens do motorista
   */
  static async getNextTrips(driverId: string): Promise<Trip[]> {
    try {
      debug('Buscando próximas viagens', { driverId }, 'TripsService')

      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          code,
          type,
          shift,
          departure_time,
          arrival_time,
          origin,
          destination,
          origin_city,
          destination_city,
          status,
          veiculo_id,
          motorista_id,
          route_id,
          routes (
            name,
            origin,
            destination
          )
        `)
        .eq('motorista_id', driverId)
        .in('status', ['scheduled', 'in_progress'])
        .order('departure_time', { ascending: true })
        .limit(10)

      if (error) {
        logError('Erro ao buscar viagens', { error, driverId }, 'TripsService')
        throw error
      }

      // Mapear dados do Supabase para formato da interface
      const trips: Trip[] = (data || []).map((trip: any) => ({
        id: trip.id,
        code: trip.code || `GF-${trip.id.slice(0, 3).toUpperCase()}-${trip.id.slice(-3)}`,
        type: trip.type || 'entrada',
        shift: trip.shift || 'Turno Manhã',
        departureTime: trip.departure_time || '',
        arrivalTime: trip.arrival_time || '',
        origin: trip.origin || trip.routes?.origin || '',
        destination: trip.destination || trip.routes?.destination || '',
        originCity: trip.origin_city || '',
        destinationCity: trip.destination_city || '',
        isNext: trip.status === 'scheduled',
        status: trip.status,
        vehicleId: trip.veiculo_id,
        driverId: trip.motorista_id,
        routeId: trip.route_id,
      }))

      return trips
    } catch (error) {
      logError('Erro ao buscar próximas viagens', { error, driverId }, 'TripsService')
      return []
    }
  }

  /**
   * Buscar viagem atual do motorista
   */
  static async getCurrentTrip(driverId: string): Promise<Trip | null> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('motorista_id', driverId)
        .eq('status', 'in_progress')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhuma viagem encontrada
          return null
        }
        logError('Erro ao buscar viagem atual', { error, driverId }, 'TripsService')
        throw error
      }

      return this.mapTripFromSupabase(data)
    } catch (error) {
      logError('Erro ao buscar viagem atual', { error, driverId }, 'TripsService')
      return null
    }
  }

  /**
   * Iniciar viagem
   */
  static async startTrip(tripId: string, checklistData: any): Promise<boolean> {
    try {
      debug('Iniciando viagem', { tripId }, 'TripsService')

      const { error } = await supabase
        .from('trips')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          checklist_data: checklistData,
        })
        .eq('id', tripId)

      if (error) {
        logError('Erro ao iniciar viagem', { error, tripId }, 'TripsService')
        throw error
      }

      return true
    } catch (error) {
      logError('Erro ao iniciar viagem', { error, tripId }, 'TripsService')
      return false
    }
  }

  /**
   * Finalizar viagem
   */
  static async completeTrip(tripId: string): Promise<boolean> {
    try {
      debug('Finalizando viagem', { tripId }, 'TripsService')

      const { error } = await supabase
        .from('trips')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', tripId)

      if (error) {
        logError('Erro ao finalizar viagem', { error, tripId }, 'TripsService')
        throw error
      }

      return true
    } catch (error) {
      logError('Erro ao finalizar viagem', { error, tripId }, 'TripsService')
      return false
    }
  }

  /**
   * Mapear dados do Supabase para formato Trip
   */
  private static mapTripFromSupabase(data: any): Trip {
    return {
      id: data.id,
      code: data.code || `GF-${data.id.slice(0, 3).toUpperCase()}-${data.id.slice(-3)}`,
      type: data.type || 'entrada',
      shift: data.shift || 'Turno Manhã',
      departureTime: data.departure_time || '',
      arrivalTime: data.arrival_time || '',
      origin: data.origin || '',
      destination: data.destination || '',
      originCity: data.origin_city || '',
      destinationCity: data.destination_city || '',
      isNext: data.status === 'scheduled',
      status: data.status,
      vehicleId: data.veiculo_id,
      driverId: data.motorista_id,
      routeId: data.route_id,
    }
  }
}
