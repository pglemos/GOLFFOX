// Google Maps utilities

export interface GoogleMapsConfig {
  apiKey: string
  libraries?: string[]
}

export const getGoogleMapsConfig = (): GoogleMapsConfig => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  
  if (!apiKey) {
    console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não configurado')
  }

  return {
    apiKey,
    libraries: ['places', 'geometry', 'drawing', 'visualization']
  }
}

// Geocoding helper
export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey || !address) return null

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.results[0]) {
      const location = data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng
      }
    }
    
    return null
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error)
    return null
  }
}

// Directions API helper
export const optimizeRoute = async (waypoints: Array<{ lat: number; lng: number; address?: string }>): Promise<{
  optimized: Array<{ lat: number; lng: number; address?: string }>
  polyline: string
  distance: number
  duration: number
} | null> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey || waypoints.length < 2) return null

  try {
    const waypointsStr = waypoints.map(w => `${w.lat},${w.lng}`).join('|')
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${waypoints[0].lat},${waypoints[0].lng}&destination=${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}&waypoints=optimize:true|${waypoints.slice(1, -1).map(w => `${w.lat},${w.lng}`).join('|')}&key=${apiKey}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.routes[0]) {
      const route = data.routes[0]
      const leg = route.legs[0]
      
      // Reordenar waypoints conforme otimização do Google
      const optimizedWaypoints = route.waypoint_order.map((index: number) => waypoints[index + 1])
      optimizedWaypoints.unshift(waypoints[0])
      optimizedWaypoints.push(waypoints[waypoints.length - 1])
      
      return {
        optimized: optimizedWaypoints,
        polyline: route.overview_polyline.points,
        distance: leg.distance.value / 1000, // km
        duration: leg.duration.value / 60 // minutes
      }
    }
    
    return null
  } catch (error) {
    console.error('Erro ao otimizar rota:', error)
    return null
  }
}

