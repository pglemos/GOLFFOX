/**
 * Testes para Proximity Service
 */

import {
  checkProximity,
  checkProximityBatch,
  findNearestStop,
} from '@/lib/notifications/proximity-service'
import { calculateDistance, calculateETA } from '@/lib/map-utils'

jest.mock('@/lib/map-utils', () => ({
  calculateDistance: jest.fn(),
  calculateETA: jest.fn(),
}))

const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

describe('Proximity Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalEnv
  })

  describe('checkProximity', () => {
    const mockBus: any = {
      lat: -19.916681,
      lng: -43.934493,
      vehicleId: 'veiculo-1',
      routeId: 'route-1',
      timestamp: new Date(),
    }

    const mockStop: any = {
      lat: -19.917681,
      lng: -43.935493,
      stopId: 'stop-1',
      routeId: 'route-1',
      passengerIds: ['passageiro-1'],
    }

    it('deve retornar isNearby=true quando distância está dentro do threshold', async () => {
      ;(calculateDistance as jest.Mock).mockReturnValue(300) // 300m < 500m default

      const result = await checkProximity(mockBus, mockStop, 500)

      expect(result.isNearby).toBe(true)
      expect(result.distanceMeters).toBe(300)
      expect(result.thresholdMeters).toBe(500)
    })

    it('deve retornar isNearby=false quando distância está fora do threshold', async () => {
      ;(calculateDistance as jest.Mock).mockReturnValue(1000) // 1000m > 500m

      const result = await checkProximity(mockBus, mockStop, 500)

      expect(result.isNearby).toBe(false)
      expect(result.distanceMeters).toBe(1000)
      expect(result.etaMinutes).toBeNull()
    })

    it('deve calcular ETA quando está próximo e API key disponível', async () => {
      ;(calculateDistance as jest.Mock).mockReturnValue(300)
      ;(calculateETA as jest.Mock).mockResolvedValue(5) // 5 minutos

      const result = await checkProximity(mockBus, mockStop, 500)

      expect(result.isNearby).toBe(true)
      expect(result.etaMinutes).toBe(5)
      expect(calculateETA).toHaveBeenCalledWith(
        mockBus.lat,
        mockBus.lng,
        mockStop.lat,
        mockStop.lng,
        'test-api-key'
      )
    })

    it('deve retornar etaMinutes=null quando API key não disponível', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ;(calculateDistance as jest.Mock).mockReturnValue(300)

      const result = await checkProximity(mockBus, mockStop, 500)

      expect(result.isNearby).toBe(true)
      expect(result.etaMinutes).toBeNull()
      expect(calculateETA).not.toHaveBeenCalled()
    })

    it('deve arredondar distância para inteiro', async () => {
      ;(calculateDistance as jest.Mock).mockReturnValue(123.456)

      const result = await checkProximity(mockBus, mockStop, 500)

      expect(result.distanceMeters).toBe(123)
    })

    it('deve usar threshold padrão de 500m quando não fornecido', async () => {
      ;(calculateDistance as jest.Mock).mockReturnValue(300)

      const result = await checkProximity(mockBus, mockStop)

      expect(result.thresholdMeters).toBe(500)
    })
  })

  describe('checkProximityBatch', () => {
    const mockBus: any = {
      lat: -19.916681,
      lng: -43.934493,
      vehicleId: 'veiculo-1',
      routeId: 'route-1',
      timestamp: new Date(),
    }

    const mockStops: any[] = [
      {
        lat: -19.917681,
        lng: -43.935493,
        stopId: 'stop-1',
        routeId: 'route-1',
        passengerIds: [],
      },
      {
        lat: -19.918681,
        lng: -43.936493,
        stopId: 'stop-2',
        routeId: 'route-1',
        passengerIds: [],
      },
    ]

    it('deve verificar proximidade para múltiplas paradas', async () => {
      ;(calculateDistance as jest.Mock)
        .mockReturnValueOnce(300)
        .mockReturnValueOnce(1000)

      const results = await checkProximityBatch(mockBus, mockStops, 500)

      expect(results).toHaveLength(2)
      expect(results[0].stopId).toBe('stop-1')
      expect(results[0].isNearby).toBe(true)
      expect(results[1].stopId).toBe('stop-2')
      expect(results[1].isNearby).toBe(false)
    })

    it('deve retornar array vazio para array de paradas vazio', async () => {
      const results = await checkProximityBatch(mockBus, [], 500)

      expect(results).toHaveLength(0)
    })
  })

  describe('findNearestStop', () => {
    const mockBus: any = {
      lat: -19.916681,
      lng: -43.934493,
      vehicleId: 'veiculo-1',
      routeId: 'route-1',
      timestamp: new Date(),
    }

    const mockStops: any[] = [
      {
        lat: -19.917681,
        lng: -43.935493,
        stopId: 'stop-1',
        routeId: 'route-1',
        passengerIds: [],
      },
      {
        lat: -19.918681,
        lng: -43.936493,
        stopId: 'stop-2',
        routeId: 'route-1',
        passengerIds: [],
      },
    ]

    it('deve encontrar parada mais próxima', () => {
      ;(calculateDistance as jest.Mock)
        .mockReturnValueOnce(300)
        .mockReturnValueOnce(1000)

      const result = findNearestStop(mockBus, mockStops)

      expect(result).not.toBeNull()
      expect(result?.stop.stopId).toBe('stop-1')
      expect(result?.distanceMeters).toBe(300)
    })

    it('deve retornar null para array vazio', () => {
      const result = findNearestStop(mockBus, [])

      expect(result).toBeNull()
    })

    it('deve calcular distância para todas as paradas', () => {
      ;(calculateDistance as jest.Mock)
        .mockReturnValueOnce(500)
        .mockReturnValueOnce(200)

      findNearestStop(mockBus, mockStops)

      expect(calculateDistance).toHaveBeenCalledTimes(2)
    })
  })
})

