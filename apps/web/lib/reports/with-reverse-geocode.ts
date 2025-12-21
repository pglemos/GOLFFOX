/**
 * Helper para adicionar reverse geocoding em relatórios
 */

import { reverseGeocode } from '@/lib/google-maps-reverse'
import { warn } from '@/lib/logger'

export interface PositionWithAddress {
  lat: number
  lng: number
  address?: string | null
  addressComponents?: {
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  } | null
}

/**
 * Adiciona endereços legíveis a um array de posições
 */
export async function addAddressesToPositions<T extends { lat: number; lng: number }>(
  positions: T[]
): Promise<Array<T & PositionWithAddress>> {
  const results = await Promise.all(
    positions.map(async (position) => {
      if (!position.lat || !position.lng) {
        return {
          ...position,
          address: null,
          addressComponents: null
        }
      }

      try {
        const geocodeResult = await reverseGeocode(position.lat, position.lng)
        return {
          ...position,
          address: geocodeResult?.address || null,
          addressComponents: geocodeResult?.components || null
        }
      } catch (error) {
        warn('Erro ao fazer reverse geocoding', { error }, 'ReportsReverseGeocode')
        return {
          ...position,
          address: null,
          addressComponents: null
        }
      }
    })
  )

  return results
}

/**
 * Adiciona endereço a uma única posição
 */
export async function addAddressToPosition<T extends { lat: number; lng: number }>(
  position: T
): Promise<T & PositionWithAddress> {
  const [result] = await addAddressesToPositions([position])
  return result
}

