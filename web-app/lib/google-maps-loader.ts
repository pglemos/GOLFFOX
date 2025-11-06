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

const LOAD_TIMEOUT = 30000 // 30 segundos

export function loadGoogleMapsAPI(apiKey: string): Promise<void> {
  // Validar API key
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return Promise.reject(new Error('API Key do Google Maps inválida ou não fornecida'))
  }

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
    // Se existe mas ainda não carregou, aguardar com timeout
    if (!window.google || !window.google.maps) {
      return new Promise((resolve, reject) => {
        const startTime = Date.now()
        const checkLoaded = () => {
          if (window.google && window.google.maps) {
            resolve()
          } else if (Date.now() - startTime > LOAD_TIMEOUT) {
            reject(new Error('Timeout ao carregar Google Maps API'))
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
      })
    }
    return Promise.resolve()
  }

  // Criar nova promise de carregamento com timeout
  isLoading = true
  loadPromise = new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      isLoading = false
      loadPromise = null
      reject(new Error(`Timeout ao carregar Google Maps API após ${LOAD_TIMEOUT}ms`))
    }, LOAD_TIMEOUT)

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,visualization&v=weekly`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      clearTimeout(timeoutId)
      // Verificar se realmente carregou
      if (window.google && window.google.maps) {
        isLoading = false
        resolve()
      } else {
        isLoading = false
        loadPromise = null
        reject(new Error('Google Maps API carregou mas não está disponível'))
      }
    }
    
    script.onerror = (error) => {
      clearTimeout(timeoutId)
      isLoading = false
      loadPromise = null
      
      // Verificar se é erro de autenticação
      const errorMessage = error instanceof ErrorEvent 
        ? error.message 
        : 'Falha ao carregar Google Maps API'
      
      if (errorMessage.includes('403') || errorMessage.includes('authentication')) {
        reject(new Error('Erro de autenticação: API Key inválida ou restrições não permitem este uso'))
      } else if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        reject(new Error('Quota do Google Maps excedida. Tente novamente mais tarde.'))
      } else {
        reject(new Error(`Falha ao carregar Google Maps API: ${errorMessage}`))
      }
    }
    
    document.head.appendChild(script)
  })

  return loadPromise
}

export function isGoogleMapsLoaded(): boolean {
  return !!(window.google && window.google.maps)
}