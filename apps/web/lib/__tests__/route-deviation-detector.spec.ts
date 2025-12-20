/**
 * Testes para RouteDeviationDetector
 */

import {
  detectRouteDeviation,
  detectMultipleRouteDeviations,
  type RoutePolylinePoint,
} from '../route-deviation-detector'

describe('RouteDeviationDetector', () => {
  const mockRoute: RoutePolylinePoint[] = [
    { lat: -19.916681, lng: -43.934493, order: 1 },
    { lat: -19.917681, lng: -43.935493, order: 2 },
    { lat: -19.918681, lng: -43.936493, order: 3 },
  ]

  describe('detectRouteDeviation', () => {
    it('deve retornar não-desviado quando veículo está na rota', () => {
      const result = detectRouteDeviation(
        -19.916681, // Próximo ao primeiro ponto
        -43.934493,
        10, // 10 m/s (36 km/h)
        mockRoute,
        200
      )

      expect(result.isDeviated).toBe(false)
      expect(result.distance).toBeLessThan(200)
    })

    it('deve retornar desviado quando veículo está longe da rota', () => {
      // Ponto a ~500m da rota
      const result = detectRouteDeviation(
        -19.920681, // ~500m ao sul
        -43.934493,
        10,
        mockRoute,
        200
      )

      expect(result.isDeviated).toBe(true)
      expect(result.distance).toBeGreaterThan(200)
    })

    it('deve retornar não-desviado quando veículo está parado', () => {
      const result = detectRouteDeviation(
        -19.920681, // Longe da rota
        -43.934493,
        0, // Parado
        mockRoute,
        200
      )

      expect(result.isDeviated).toBe(false)
    })

    it('deve retornar não-desviado quando velocidade < 1.4 m/s', () => {
      const result = detectRouteDeviation(
        -19.920681,
        -43.934493,
        1.0, // < 1.4 m/s
        mockRoute,
        200
      )

      expect(result.isDeviated).toBe(false)
    })

    it('deve retornar não-desviado quando rota é muito curta', () => {
      const shortRoute: RoutePolylinePoint[] = [
        { lat: -19.916681, lng: -43.934493, order: 1 },
      ]

      const result = detectRouteDeviation(
        -19.920681,
        -43.934493,
        10,
        shortRoute,
        200
      )

      expect(result.isDeviated).toBe(false)
    })

    it('deve calcular distância corretamente', () => {
      // Ponto a ~100m da rota
      const result = detectRouteDeviation(
        -19.917681, // Próximo ao segundo ponto mas não exatamente
        -43.936493,
        10,
        mockRoute,
        200
      )

      expect(result.distance).toBeGreaterThan(0)
      expect(result.distance).toBeLessThan(1000) // Menos de 1km
      expect(result.segmentIndex).toBeDefined()
    })
  })

  describe('detectMultipleRouteDeviations', () => {
    it('deve detectar desvios para múltiplos veículos', () => {
      const vehicles = [
        {
          veiculo_id: 'veiculo-1',
          lat: -19.916681,
          lng: -43.934493,
          speed: 10,
          route_id: 'route-1',
        },
        {
          veiculo_id: 'veiculo-2',
          lat: -19.920681, // Longe da rota
          lng: -43.934493,
          speed: 10,
          route_id: 'route-1',
        },
      ]

      const routesMap = new Map<string, RoutePolylinePoint[]>()
      routesMap.set('route-1', mockRoute)

      const results = detectMultipleRouteDeviations(vehicles, routesMap, 200)

      expect(results.size).toBe(2)
      expect(results.get('veiculo-1')?.isDeviated).toBe(false)
      expect(results.get('veiculo-2')?.isDeviated).toBe(true)
    })

    it('deve retornar resultados vazios se não há rotas', () => {
      const vehicles = [
        {
          veiculo_id: 'veiculo-1',
          lat: -19.916681,
          lng: -43.934493,
          speed: 10,
          route_id: 'route-1',
        },
      ]

      const routesMap = new Map<string, RoutePolylinePoint[]>()

      const results = detectMultipleRouteDeviations(vehicles, routesMap, 200)

      expect(results.size).toBe(0)
    })
  })
})

