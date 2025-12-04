import { analyzeTrajectory } from '@/lib/trajectory-analyzer'

describe('lib/trajectory-analyzer', () => {
  const mockPlannedRoute = [
    {
      lat: -23.5505,
      lng: -46.6333,
      order: 0,
      estimated_time: new Date('2024-01-15T10:00:00'),
    },
    {
      lat: -23.5595,
      lng: -46.6333,
      order: 1,
      estimated_time: new Date('2024-01-15T10:30:00'),
    },
  ]

  const mockActualPositions = [
    {
      lat: -23.5505,
      lng: -46.6333,
      timestamp: new Date('2024-01-15T10:00:00'),
      speed: 10,
    },
    {
      lat: -23.5595,
      lng: -46.6333,
      timestamp: new Date('2024-01-15T10:35:00'), // 5 minutos de atraso
      speed: 10,
    },
  ]

  it('deve analisar trajetória conforme planejada', () => {
    const analysis = analyzeTrajectory(mockPlannedRoute, mockActualPositions)

    expect(analysis).toBeDefined()
    expect(analysis.totalDistancePlanned).toBeGreaterThan(0)
    expect(analysis.totalDistanceActual).toBeGreaterThan(0)
    expect(analysis.conformityPercentage).toBeGreaterThanOrEqual(0)
    expect(analysis.conformityPercentage).toBeLessThanOrEqual(100)
  })

  it('deve calcular atraso de tempo', () => {
    const analysis = analyzeTrajectory(mockPlannedRoute, mockActualPositions)

    expect(analysis.timeDelay).toBeGreaterThanOrEqual(0)
  })

  it('deve detectar desvios', () => {
    const deviatedPositions = [
      {
        lat: -23.6000, // Longe da rota
        lng: -46.7000,
        timestamp: new Date('2024-01-15T10:00:00'),
        speed: 10,
      },
    ]

    const analysis = analyzeTrajectory(mockPlannedRoute, deviatedPositions)

    expect(analysis.deviations.length).toBeGreaterThan(0)
  })

  it('deve lidar com rota vazia', () => {
    const analysis = analyzeTrajectory([], mockActualPositions)

    expect(analysis.totalDistancePlanned).toBe(0)
  })

  it('deve lidar com posições vazias', () => {
    const analysis = analyzeTrajectory(mockPlannedRoute, [])

    expect(analysis.totalDistanceActual).toBe(0)
  })
})

