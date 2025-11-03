// Gerenciador centralizado para carregamento da API do Google Maps
// Evita carregamentos múltiplos e conflitos

declare global {
  interface Window {
    google: any
    googleMapsLoading?: Promise<void>
  }
}

let isLoading = false
let loadPromise: Promise<void> | null = null

export function loadGoogleMapsAPI(apiKey: string): Promise<void> {
  // Se já está carregado, retorna imediatamente
  if (window.google && window.google.maps) {
    return Promise.resolve()
  }

  // Se já está carregando, retorna a promise existente
  if (isLoading && loadPromise) {
    return loadPromise
  }

  // Verificar se já existe um script
  const existingScript = document.querySelector('#google-maps-script') as HTMLScriptElement
  if (existingScript) {
    // Se existe mas ainda não carregou, aguardar
    if (!window.google || !window.google.maps) {
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (window.google && window.google.maps) {
            resolve()
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
      })
    }
    return Promise.resolve()
  }

  // Criar nova promise de carregamento
  isLoading = true
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      isLoading = false
      resolve()
    }
    
    script.onerror = () => {
      isLoading = false
      loadPromise = null
      reject(new Error('Falha ao carregar Google Maps API'))
    }
    
    document.head.appendChild(script)
  })

  return loadPromise
}

export function isGoogleMapsLoaded(): boolean {
  return !!(window.google && window.google.maps)
}