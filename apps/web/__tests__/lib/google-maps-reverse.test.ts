/**
 * Testes para Google Maps Reverse Geocoding
 */

import { reverseGeocode, reverseGeocodeBatch } from '@/lib/google-maps-reverse'

const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const originalFetch = global.fetch

describe('Google Maps Reverse Geocoding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn() as jest.Mock
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalEnv
    global.fetch = originalFetch
  })

  describe('reverseGeocode', () => {
    it('deve retornar null se API key não está configurada', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = await reverseGeocode(-19.916681, -43.934493)

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('deve fazer reverse geocoding com sucesso', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Rua Teste, 123, Belo Horizonte, MG, 30123-456, Brasil',
            geometry: {
              location: {
                lat: -19.916681,
                lng: -43.934493,
              },
            },
            address_components: [
              { long_name: '123', short_name: '123', types: ['street_number'] },
              { long_name: 'Rua Teste', short_name: 'Rua Teste', types: ['route'] },
              { long_name: 'Centro', short_name: 'Centro', types: ['sublocality'] },
              { long_name: 'Belo Horizonte', short_name: 'BH', types: ['locality'] },
              { long_name: 'Minas Gerais', short_name: 'MG', types: ['administrative_area_level_1'] },
              { long_name: '30123-456', short_name: '30123-456', types: ['postal_code'] },
              { long_name: 'Brasil', short_name: 'BR', types: ['country'] },
            ],
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      })

      const result = await reverseGeocode(-19.916681, -43.934493)

      expect(result).not.toBeNull()
      expect(result?.address).toBe('Rua Teste, 123, Belo Horizonte, MG, 30123-456, Brasil')
      expect(result?.components.street).toBe('Rua Teste')
      expect(result?.components.number).toBe('123')
      expect(result?.components.neighborhood).toBe('Centro')
      expect(result?.components.city).toBe('Belo Horizonte')
      expect(result?.components.state).toBe('MG')
      expect(result?.components.zipCode).toBe('30123-456')
      expect(result?.components.country).toBe('BR')
      expect(result?.location.lat).toBe(-19.916681)
      expect(result?.location.lng).toBe(-43.934493)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maps.googleapis.com/maps/api/geocode/json')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('latlng=-19.916681,-43.934493')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('language=pt-BR')
      )
    })

    it('deve retornar null se status não é OK', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'ZERO_RESULTS',
        results: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      })

      const result = await reverseGeocode(-19.916681, -43.934493)

      expect(result).toBeNull()
    })

    it('deve retornar null se não há resultados', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'OK',
        results: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      })

      const result = await reverseGeocode(-19.916681, -43.934493)

      expect(result).toBeNull()
    })

    it('deve lidar com erros de rede', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await reverseGeocode(-19.916681, -43.934493)

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('deve extrair componentes de endereço corretamente', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Test Address',
            geometry: {
              location: {
                lat: -19.916681,
                lng: -43.934493,
              },
            },
            address_components: [
              { long_name: '123', types: ['street_number'] },
              { long_name: 'Rua Teste', types: ['route'] },
              { long_name: 'Centro', types: ['sublocality_level_1'] },
              { long_name: 'Belo Horizonte', types: ['administrative_area_level_2'] },
              { long_name: 'MG', short_name: 'MG', types: ['administrative_area_level_1'] },
              { long_name: '30123-456', types: ['postal_code'] },
              { long_name: 'Brasil', short_name: 'BR', types: ['country'] },
            ],
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      })

      const result = await reverseGeocode(-19.916681, -43.934493)

      expect(result?.components.number).toBe('123')
      expect(result?.components.street).toBe('Rua Teste')
      expect(result?.components.neighborhood).toBe('Centro')
      expect(result?.components.city).toBe('Belo Horizonte')
      expect(result?.components.state).toBe('MG')
      expect(result?.components.zipCode).toBe('30123-456')
      expect(result?.components.country).toBe('BR')
    })
  })

  describe('reverseGeocodeBatch', () => {
    it('deve processar múltiplas coordenadas em batches', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Address 1',
            geometry: { location: { lat: -19.916681, lng: -43.934493 } },
            address_components: [],
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      })

      jest.useFakeTimers()

      const coordinates = Array.from({ length: 25 }, (_, i) => ({
        lat: -19.916681 + i * 0.001,
        lng: -43.934493 + i * 0.001,
      }))

      const promise = reverseGeocodeBatch(coordinates)

      // Avançar timers para simular delays entre batches
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(100)
        await Promise.resolve()
      }

      jest.useRealTimers()

      const results = await promise

      expect(results).toHaveLength(25)
      // Deve fazer múltiplas chamadas (25 coordenadas / 10 por batch = 3 batches)
      expect(global.fetch).toHaveBeenCalledTimes(25) // Uma chamada por coordenada
    })

    it('deve processar menos de 10 coordenadas sem batching', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Address',
            geometry: { location: { lat: -19.916681, lng: -43.934493 } },
            address_components: [],
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      })

      const coordinates = [
        { lat: -19.916681, lng: -43.934493 },
        { lat: -19.917681, lng: -43.935493 },
      ]

      const results = await reverseGeocodeBatch(coordinates)

      expect(results).toHaveLength(2)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('deve lidar com coordenadas que retornam null', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            status: 'OK',
            results: [
              {
                formatted_address: 'Address 1',
                geometry: { location: { lat: -19.916681, lng: -43.934493 } },
                address_components: [],
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            status: 'ZERO_RESULTS',
            results: [],
          }),
        })

      const coordinates = [
        { lat: -19.916681, lng: -43.934493 },
        { lat: -19.917681, lng: -43.935493 },
      ]

      const results = await reverseGeocodeBatch(coordinates)

      expect(results).toHaveLength(2)
      expect(results[0]).not.toBeNull()
      expect(results[1]).toBeNull()
    })
  })
})

