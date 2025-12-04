import {
  isValidLatitude,
  isValidLongitude,
  isValidCoordinate,
  isValidPolyline,
  normalizeCoordinate,
  filterValidCoordinates,
  calculateDistance,
  isWithinErrorMargin,
} from '@/lib/coordinate-validator'

describe('lib/coordinate-validator', () => {
  describe('isValidLatitude', () => {
    it('deve validar latitude válida', () => {
      expect(isValidLatitude(-23.5505)).toBe(true)
      expect(isValidLatitude(0)).toBe(true)
      expect(isValidLatitude(90)).toBe(true)
      expect(isValidLatitude(-90)).toBe(true)
    })

    it('deve rejeitar latitude inválida', () => {
      expect(isValidLatitude(91)).toBe(false)
      expect(isValidLatitude(-91)).toBe(false)
      expect(isValidLatitude(NaN)).toBe(false)
      expect(isValidLatitude(Infinity)).toBe(false)
    })
  })

  describe('isValidLongitude', () => {
    it('deve validar longitude válida', () => {
      expect(isValidLongitude(-46.6333)).toBe(true)
      expect(isValidLongitude(0)).toBe(true)
      expect(isValidLongitude(180)).toBe(true)
      expect(isValidLongitude(-180)).toBe(true)
    })

    it('deve rejeitar longitude inválida', () => {
      expect(isValidLongitude(181)).toBe(false)
      expect(isValidLongitude(-181)).toBe(false)
      expect(isValidLongitude(NaN)).toBe(false)
    })
  })

  describe('isValidCoordinate', () => {
    it('deve validar coordenada válida', () => {
      expect(isValidCoordinate(-23.5505, -46.6333)).toBe(true)
    })

    it('deve rejeitar coordenada inválida', () => {
      expect(isValidCoordinate(91, -46.6333)).toBe(false)
      expect(isValidCoordinate(-23.5505, 181)).toBe(false)
    })
  })

  describe('isValidPolyline', () => {
    it('deve validar polyline válida', () => {
      const polyline = [
        { lat: -23.5505, lng: -46.6333 },
        { lat: -23.5595, lng: -46.6333 },
      ]
      expect(isValidPolyline(polyline)).toBe(true)
    })

    it('deve rejeitar polyline vazia', () => {
      expect(isValidPolyline([])).toBe(false)
    })

    it('deve rejeitar polyline com coordenadas inválidas', () => {
      const polyline = [
        { lat: 91, lng: -46.6333 },
        { lat: -23.5595, lng: 181 },
      ]
      expect(isValidPolyline(polyline)).toBe(false)
    })

    it('deve rejeitar array inválido', () => {
      expect(isValidPolyline(null as any)).toBe(false)
      expect(isValidPolyline(undefined as any)).toBe(false)
    })
  })

  describe('normalizeCoordinate', () => {
    it('deve normalizar coordenada válida', () => {
      const result = normalizeCoordinate(-23.5505123, -46.6333456)
      expect(result).not.toBeNull()
      expect(result?.lat).toBeCloseTo(-23.550512, 5)
      expect(result?.lng).toBeCloseTo(-46.633346, 5)
    })

    it('deve retornar null para coordenada inválida', () => {
      expect(normalizeCoordinate(91, -46.6333)).toBeNull()
      expect(normalizeCoordinate(-23.5505, 181)).toBeNull()
    })
  })

  describe('filterValidCoordinates', () => {
    it('deve filtrar coordenadas válidas', () => {
      const points = [
        { lat: -23.5505, lng: -46.6333 },
        { lat: 91, lng: -46.6333 }, // Inválida
        { lat: -23.5595, lng: -46.6333 },
      ]

      const filtered = filterValidCoordinates(points)
      expect(filtered).toHaveLength(2)
    })

    it('deve retornar array vazio para entrada inválida', () => {
      expect(filterValidCoordinates(null as any)).toEqual([])
      expect(filterValidCoordinates(undefined as any)).toEqual([])
    })
  })

  describe('calculateDistance', () => {
    it('deve calcular distância entre coordenadas válidas', () => {
      const distance = calculateDistance(-23.5505, -46.6333, -23.5595, -46.6333)
      expect(distance).toBeGreaterThan(0)
      expect(distance).toBeLessThan(2000) // ~1km
    })

    it('deve retornar Infinity para coordenadas inválidas', () => {
      expect(calculateDistance(91, -46.6333, -23.5595, -46.6333)).toBe(Infinity)
      expect(calculateDistance(-23.5505, 181, -23.5595, -46.6333)).toBe(Infinity)
    })
  })

  describe('isWithinErrorMargin', () => {
    it('deve verificar se está dentro da margem', () => {
      // Mesmo ponto
      expect(isWithinErrorMargin(-23.5505, -46.6333, -23.5505, -46.6333, 10)).toBe(true)
    })

    it('deve verificar se está fora da margem', () => {
      // Pontos muito distantes
      expect(isWithinErrorMargin(-23.5505, -46.6333, -22.9068, -43.1729, 10)).toBe(false)
    })
  })
})

