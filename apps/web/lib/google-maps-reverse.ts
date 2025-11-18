/**
 * Reverse Geocoding - Converte coordenadas em endereços legíveis
 */

export interface ReverseGeocodeResult {
  address: string
  components: {
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  location: {
    lat: number
    lng: number
  }
}

/**
 * Converte coordenadas (lat, lng) em endereço legível
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.warn('Google Maps API key não configurada para reverse geocoding')
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=pt-BR`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.results[0]) {
      const result = data.results[0]
      const address = result.formatted_address
      
      // Extrair componentes do endereço
      const components: ReverseGeocodeResult['components'] = {}
      
      result.address_components.forEach((component: any) => {
        const types = component.types
        
        if (types.includes('street_number')) {
          components.number = component.long_name
        } else if (types.includes('route')) {
          components.street = component.long_name
        } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
          components.neighborhood = component.long_name
        } else if (types.includes('administrative_area_level_2') || types.includes('locality')) {
          components.city = component.long_name
        } else if (types.includes('administrative_area_level_1')) {
          components.state = component.short_name
        } else if (types.includes('postal_code')) {
          components.zipCode = component.long_name
        } else if (types.includes('country')) {
          components.country = component.short_name
        }
      })
      
      return {
        address,
        components,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Erro ao fazer reverse geocoding:', error)
    return null
  }
}

/**
 * Converte múltiplas coordenadas em endereços (batch)
 * Limite: 10 coordenadas por requisição (limite da API)
 */
export async function reverseGeocodeBatch(
  coordinates: Array<{ lat: number; lng: number }>
): Promise<Array<ReverseGeocodeResult | null>> {
  // Limitar a 10 coordenadas por vez (limite da API)
  const batchSize = 10
  const results: Array<ReverseGeocodeResult | null> = []
  
  for (let i = 0; i < coordinates.length; i += batchSize) {
    const batch = coordinates.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(coord => reverseGeocode(coord.lat, coord.lng))
    )
    results.push(...batchResults)
    
    // Rate limiting: aguardar 100ms entre batches
    if (i + batchSize < coordinates.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

