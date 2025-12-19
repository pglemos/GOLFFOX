/**
 * Location Service
 * 
 * Serviço para rastreamento GPS no mobile
 * Envia localização do veículo em tempo real
 */

import * as Location from 'expo-location'
import { supabase } from './supabase'
import { debug, logError } from '@/lib/logger'

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  heading?: number
  timestamp: Date
}

export class LocationService {
  private static watchSubscription: Location.LocationSubscription | null = null
  private static isTracking = false
  private static currentTripId: string | null = null

  /**
   * Solicitar permissões de localização
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        logError('Permissão de localização negada', {}, 'LocationService')
        return false
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync()
      if (backgroundStatus !== 'granted') {
        logError('Permissão de localização em background negada', {}, 'LocationService')
        // Continuar mesmo sem background permission
      }

      return true
    } catch (error) {
      logError('Erro ao solicitar permissões de localização', { error }, 'LocationService')
      return false
    }
  }

  /**
   * Iniciar rastreamento de localização
   */
  static async startTracking(
    tripId: string,
    vehicleId: string,
    options: {
      accuracy?: Location.Accuracy
      timeInterval?: number
      distanceInterval?: number
    } = {}
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) {
        return false
      }

      this.currentTripId = tripId
      this.isTracking = true

      const {
        accuracy = Location.Accuracy.Balanced,
        timeInterval = 30000, // 30 segundos
        distanceInterval = 50, // 50 metros
      } = options

      debug('Iniciando rastreamento', { tripId, vehicleId }, 'LocationService')

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval,
          distanceInterval,
        },
        async (location) => {
          await this.sendLocationUpdate(location, tripId, vehicleId)
        }
      )

      return true
    } catch (error) {
      logError('Erro ao iniciar rastreamento', { error, tripId }, 'LocationService')
      this.isTracking = false
      return false
    }
  }

  /**
   * Parar rastreamento de localização
   */
  static async stopTracking(): Promise<void> {
    try {
      if (this.watchSubscription) {
        this.watchSubscription.remove()
        this.watchSubscription = null
      }

      this.isTracking = false
      this.currentTripId = null

      debug('Rastreamento parado', {}, 'LocationService')
    } catch (error) {
      logError('Erro ao parar rastreamento', { error }, 'LocationService')
    }
  }

  /**
   * Enviar atualização de localização para o servidor
   */
  private static async sendLocationUpdate(
    location: Location.LocationObject,
    tripId: string,
    vehicleId: string
  ): Promise<void> {
    try {
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
        timestamp: new Date(location.timestamp),
      }

      // Enviar para Supabase
      const { error } = await supabase.from('driver_positions').insert({
        trip_id: tripId,
        vehicle_id: vehicleId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        speed: locationData.speed,
        heading: locationData.heading,
        recorded_at: locationData.timestamp.toISOString(),
      })

      if (error) {
        logError('Erro ao enviar localização', { error, tripId }, 'LocationService')
      } else {
        debug('Localização enviada', { tripId, latitude: locationData.latitude, longitude: locationData.longitude }, 'LocationService')
      }
    } catch (error) {
      logError('Erro ao processar atualização de localização', { error }, 'LocationService')
    }
  }

  /**
   * Obter localização atual (one-shot)
   */
  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) {
        return null
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
        timestamp: new Date(location.timestamp),
      }
    } catch (error) {
      logError('Erro ao obter localização atual', { error }, 'LocationService')
      return null
    }
  }

  /**
   * Verificar se está rastreando
   */
  static isCurrentlyTracking(): boolean {
    return this.isTracking
  }
}
