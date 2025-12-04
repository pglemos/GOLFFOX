import { getGoogleMapsConfig, geocodeAddress, optimizeRoute } from '@/lib/google-maps'

global.fetch = jest.fn()

describe('lib/google-maps', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getGoogleMapsConfig', () => {
    it('deve retornar configuração com API key', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIzaTestKey123456789'
      
      const config = getGoogleMapsConfig()
      
      expect(config.apiKey).toBe('AIzaTestKey123456789')
      expect(config.libraries).toContain('places')
      expect(config.libraries).toContain('geometry')
    })

    it('deve retornar string vazia se API key não configurada', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      const config = getGoogleMapsConfig()
      
      expect(config.apiKey).toBe('')
    })
  })

  describe('geocodeAddress', () => {
    it('deve geocodificar endereço válido', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIzaTestKey'
      
      const mockResponse = {
        status: 'OK',
        results: [{
          geometry: {
            location: {
              lat: -23.5505,
              lng: -46.6333,
            },
          },
        }],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await geocodeAddress('Avenida Paulista, São Paulo')

      expect(result).not.toBeNull()
      expect(result?.lat).toBe(-23.5505)
      expect(result?.lng).toBe(-46.6333)
    })

    it('deve retornar null se API key não configurada', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      const result = await geocodeAddress('Avenida Paulista')
      
      expect(result).toBeNull()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('deve retornar null se endereço vazio', async () => {
      const result = await geocodeAddress('')
      
      expect(result).toBeNull()
    })

    it('deve retornar null se status não for OK', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIzaTestKey'
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ status: 'ZERO_RESULTS' }),
      })

      const result = await geocodeAddress('Endereço Inexistente')
      
      expect(result).toBeNull()
    })
  })

  describe('optimizeRoute', () => {
    it('deve otimizar rota com waypoints', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIzaTestKey'
      
      const mockResponse = {
        status: 'OK',
        routes: [{
          overview_polyline: { points: '_p~iF~ps|U' },
          legs: [{
            distance: { value: 10000 }, // 10km
            duration: { value: 600 }, // 10 minutos
          }],
          waypoint_order: [0, 1],
        }],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const waypoints = [
        { lat: -23.5505, lng: -46.6333 },
        { lat: -23.5595, lng: -46.6333 },
        { lat: -23.5685, lng: -46.6333 },
      ]

      const result = await optimizeRoute(waypoints)

      expect(result).not.toBeNull()
      expect(result?.optimized).toBeDefined()
      expect(result?.polyline).toBeDefined()
      expect(result?.distance).toBeGreaterThan(0)
    })

    it('deve retornar null se menos de 2 waypoints', async () => {
      const result = await optimizeRoute([{ lat: -23.5505, lng: -46.6333 }])
      
      expect(result).toBeNull()
    })

    it('deve retornar null se API key não configurada', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      const result = await optimizeRoute([
        { lat: -23.5505, lng: -46.6333 },
        { lat: -23.5595, lng: -46.6333 },
      ])
      
      expect(result).toBeNull()
    })
  })
})

