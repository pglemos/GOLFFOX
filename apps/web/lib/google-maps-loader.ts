declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: any) => {
          fitBounds: (bounds: any) => void
        }
        Marker: new (options: any) => any
        Polyline: new (options: any) => any
        LatLngBounds: new () => {
          extend: (point: { lat: number; lng: number }) => void
          getNorthEast: () => { lat: () => number; lng: () => number }
          getSouthWest: () => { lat: () => number; lng: () => number }
        }
        geometry?: {
          encoding?: {
            decodePath: (encoded: string) => Array<{ lat: number; lng: number }>
          }
        }
      }
    }
    initGoogleMaps: () => void
  }
}

let loadPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if (window.google && window.google.maps) {
    return Promise.resolve()
  }

  if (loadPromise) {
    return loadPromise
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key não configurada'))
  }

  loadPromise = new Promise((resolve, reject) => {
    window.initGoogleMaps = () => {
      resolve()
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    script.onerror = () => {
      reject(new Error('Falha ao carregar Google Maps'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

export function loadGoogleMapsAPI(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if (window.google && window.google.maps) {
    return Promise.resolve()
  }

  // Se já existe uma promise de carregamento em andamento, aguardar ela
  if (loadPromise) {
    return loadPromise
  }

  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key não fornecida'))
  }

  loadPromise = new Promise((resolve, reject) => {
    window.initGoogleMaps = () => {
      resolve()
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    script.onerror = () => {
      reject(new Error('Falha ao carregar Google Maps'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
