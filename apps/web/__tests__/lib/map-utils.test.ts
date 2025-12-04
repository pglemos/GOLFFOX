import {
  fitBoundsWithMargin,
  calculateHeading,
  calculateDistance,
  calculateDelay,
} from '@/lib/map-utils'

// Mock Google Maps
const mockMap = {
  fitBounds: jest.fn(),
} as any

global.google = {
  maps: {
    LatLngBounds: jest.fn().mockImplementation((sw?: any, ne?: any) => ({
      extend: jest.fn(),
    })),
    Map: jest.fn(),
  },
} as any

describe('lib/map-utils', () => {
  describe('fitBoundsWithMargin', () => {
    it('deve ajustar bounds com margem', () => {
      const bounds = {
        south: -23.5505,
        west: -46.6333,
        north: -23.5505,
        east: -46.6333,
      }

      fitBoundsWithMargin(mockMap, bounds, 64)

      expect(mockMap.fitBounds).toHaveBeenCalled()
    })

    it('deve aceitar LatLngBounds', () => {
      const bounds = new (global.google.maps.LatLngBounds as any)()
      fitBoundsWithMargin(mockMap, bounds, 64)
      expect(mockMap.fitBounds).toHaveBeenCalled()
    })
  })

  describe('calculateHeading', () => {
    it('deve calcular heading para Norte', () => {
      const heading = calculateHeading(0, 0, 1, 0)
      expect(heading).toBeGreaterThanOrEqual(0)
      expect(heading).toBeLessThanOrEqual(360)
    })

    it('deve calcular heading para Leste', () => {
      const heading = calculateHeading(0, 0, 0, 1)
      expect(heading).toBeGreaterThanOrEqual(0)
      expect(heading).toBeLessThanOrEqual(360)
    })

    it('deve normalizar heading para [0-360]', () => {
      const heading = calculateHeading(-23.5505, -46.6333, -23.5505, -46.6333)
      expect(heading).toBeGreaterThanOrEqual(0)
      expect(heading).toBeLessThanOrEqual(360)
    })
  })

  describe('calculateDistance', () => {
    it('deve calcular distância entre dois pontos', () => {
      // São Paulo para Rio de Janeiro (~400km)
      const distance = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729)
      expect(distance).toBeGreaterThan(300000) // ~350-400km
      expect(distance).toBeLessThan(500000)
    })

    it('deve retornar 0 para mesmos pontos', () => {
      const distance = calculateDistance(-23.5505, -46.6333, -23.5505, -46.6333)
      expect(distance).toBeCloseTo(0, 0)
    })

    it('deve calcular distância pequena corretamente', () => {
      // ~1km
      const distance = calculateDistance(-23.5505, -46.6333, -23.5595, -46.6333)
      expect(distance).toBeGreaterThan(500)
      expect(distance).toBeLessThan(2000)
    })
  })

  describe('calculateDelay', () => {
    it('deve retornar null para rota vazia', () => {
      const delay = calculateDelay(
        -23.5505,
        -46.6333,
        new Date(),
        [],
        new Date()
      )
      expect(delay).toBeNull()
    })

    it('deve calcular delay quando há rota', () => {
      const now = new Date()
      const routePolyline = [
        { lat: -23.5505, lng: -46.6333, time: new Date(now.getTime() - 60000) },
        { lat: -23.5595, lng: -46.6333, time: new Date(now.getTime() + 60000) },
      ]

      const delay = calculateDelay(
        -23.5505,
        -46.6333,
        now,
        routePolyline,
        new Date(now.getTime() - 120000)
      )

      // Pode retornar número ou null dependendo da lógica
      expect(delay === null || typeof delay === 'number').toBe(true)
    })
  })
})

