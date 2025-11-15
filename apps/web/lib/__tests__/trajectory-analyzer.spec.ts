/**
 * Testes para TrajectoryAnalyzer
 */

import {
  analyzeTrajectory,
  type PlannedRoutePoint,
  type ActualPosition,
} from '../trajectory-analyzer'

describe('TrajectoryAnalyzer', () => {
  const mockPlannedRoute: PlannedRoutePoint[] = [
    { lat: -19.916681, lng: -43.934493, order: 1 },
    { lat: -19.917681, lng: -43.935493, order: 2 },
    { lat: -19.918681, lng: -43.936493, order: 3 },
  ]

  const mockActualPositions: ActualPosition[] = [
    {
      lat: -19.916681,
      lng: -43.934493,
      timestamp: new Date('2024-01-01T10:00:00Z'),
      speed: 10,
    },
    {
      lat: -19.917681,
      lng: -43.935493,
      timestamp: new Date('2024-01-01T10:05:00Z'),
      speed: 10,
    },
    {
      lat: -19.918681,
      lng: -43.936493,
      timestamp: new Date('2024-01-01T10:10:00Z'),
      speed: 10,
    },
  ]

  describe('analyzeTrajectory', () => {
    it('deve calcular distâncias totais corretamente', () => {
      const analysis = analyzeTrajectory(mockPlannedRoute, mockActualPositions, 200)

      expect(analysis.totalDistancePlanned).toBeGreaterThan(0)
      expect(analysis.totalDistanceActual).toBeGreaterThan(0)
      expect(analysis.totalDistanceActual).toBeCloseTo(analysis.totalDistancePlanned, -2) // Aproximadamente igual
    })

    it('deve calcular tempos totais', () => {
      const analysis = analyzeTrajectory(mockPlannedRoute, mockActualPositions, 200)

      expect(analysis.totalTimeActual).toBeGreaterThan(0)
      expect(analysis.totalTimeActual).toBe(10) // 10 minutos entre primeira e última posição
    })

    it('deve calcular conformidade quando trajetos são similares', () => {
      const analysis = analyzeTrajectory(mockPlannedRoute, mockActualPositions, 200)

      expect(analysis.conformityPercentage).toBeGreaterThan(80)
      expect(analysis.extraDistance).toBeLessThan(1000) // Menos de 1km extra
    })

    it('deve detectar desvios quando veículo sai da rota', () => {
      const deviatedPositions: ActualPosition[] = [
        {
          lat: -19.916681,
          lng: -43.934493,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          speed: 10,
        },
        {
          lat: -19.920681, // Longe da rota
          lng: -43.940493,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          speed: 10,
        },
        {
          lat: -19.918681,
          lng: -43.936493,
          timestamp: new Date('2024-01-01T10:10:00Z'),
          speed: 10,
        },
      ]

      const analysis = analyzeTrajectory(mockPlannedRoute, deviatedPositions, 200)

      expect(analysis.deviations.length).toBeGreaterThan(0)
      expect(analysis.conformityPercentage).toBeLessThan(80)
    })

    it('deve detectar paradas não planejadas', () => {
      const positionsWithStop: ActualPosition[] = [
        {
          lat: -19.916681,
          lng: -43.934493,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          speed: 10,
        },
        {
          lat: -19.916681, // Parado no mesmo lugar
          lng: -43.934493,
          timestamp: new Date('2024-01-01T10:01:00Z'),
          speed: 0,
        },
        {
          lat: -19.916681,
          lng: -43.934493,
          timestamp: new Date('2024-01-01T10:03:00Z'), // 3 minutos parado
          speed: 0,
        },
        {
          lat: -19.917681,
          lng: -43.935493,
          timestamp: new Date('2024-01-01T10:04:00Z'),
          speed: 10,
        },
      ]

      const analysis = analyzeTrajectory(mockPlannedRoute, positionsWithStop, 200)

      expect(analysis.unplannedStops.length).toBeGreaterThan(0)
    })

    it('deve calcular segmentos divergentes', () => {
      const deviatedPositions: ActualPosition[] = [
        {
          lat: -19.916681,
          lng: -43.934493,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          speed: 10,
        },
        {
          lat: -19.920681, // Fora da rota
          lng: -43.940493,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          speed: 10,
        },
        {
          lat: -19.921681, // Continuando fora da rota
          lng: -43.941493,
          timestamp: new Date('2024-01-01T10:07:00Z'),
          speed: 10,
        },
        {
          lat: -19.918681, // Voltando para rota
          lng: -43.936493,
          timestamp: new Date('2024-01-01T10:10:00Z'),
          speed: 10,
        },
      ]

      const analysis = analyzeTrajectory(mockPlannedRoute, deviatedPositions, 200)

      expect(analysis.divergentSegments.length).toBeGreaterThan(0)
    })

    it('deve retornar conformidade 100% quando não há posições', () => {
      const analysis = analyzeTrajectory(mockPlannedRoute, [], 200)

      expect(analysis.conformityPercentage).toBe(100)
      expect(analysis.totalDistanceActual).toBe(0)
    })

    it('deve lidar com rota vazia', () => {
      const analysis = analyzeTrajectory([], mockActualPositions, 200)

      expect(analysis.totalDistancePlanned).toBe(0)
      expect(analysis.conformityPercentage).toBe(100)
    })
  })
})

