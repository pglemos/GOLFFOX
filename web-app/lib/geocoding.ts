type LatLng = { lat: number; lng: number }

interface GeocodeOptions {
  provider?: 'google' | 'mapbox'
  apiKey?: string
}

const cache = new Map<string, LatLng>()

export async function geocodeAddress(fullAddress: string, opts: GeocodeOptions = {}): Promise<LatLng | null> {
  const key = fullAddress.trim().toLowerCase()
  if (cache.has(key)) return cache.get(key) as LatLng

  const provider = opts.provider || (process.env.NEXT_PUBLIC_GEOCODING_PRIMARY as 'google' | 'mapbox') || 'google'
  const apiKey = opts.apiKey || process.env.NEXT_PUBLIC_MAPS_API_KEY || ''

  try {
    if (provider === 'google') {
      if (!apiKey) return null
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
      const resp = await fetch(url)
      const data = await resp.json()
      const result = data?.results?.[0]?.geometry?.location
      if (result?.lat && result?.lng) {
        const latlng = { lat: result.lat, lng: result.lng }
        cache.set(key, latlng)
        return latlng
      }
    } else if (provider === 'mapbox') {
      if (!apiKey) return null
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${apiKey}`
      const resp = await fetch(url)
      const data = await resp.json()
      const coords = data?.features?.[0]?.center
      if (Array.isArray(coords) && coords.length === 2) {
        const latlng = { lat: coords[1], lng: coords[0] }
        cache.set(key, latlng)
        return latlng
      }
    }
  } catch (e) {
    // fallback simples
    return null
  }

  // Fallback secundário, se configurado
  const fallback = (process.env.NEXT_PUBLIC_GEOCODING_FALLBACK as 'google' | 'mapbox') || undefined
  if (fallback && fallback !== provider) {
    return geocodeAddress(fullAddress, { provider: fallback, apiKey })
  }
  return null
}

export function clearGeocodeCache() {
  cache.clear()
}

