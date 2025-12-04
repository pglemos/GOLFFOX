import { detectRouteDeviation } from '@/lib/route-deviation-detector'

describe('lib/route-deviation-detector', () => {
  const mockRoute = [
    { lat: -23.5505, lng: -46.6333, order: 0 },
    { lat: -23.5595, lng: -46.6333, order: 1 },
    { lat: -23.5685, lng: -46.6333, order: 2 },
  ]

  it('deve detectar veículo na rota', () => {
    const result = detectRouteDeviation(
      -23.5550, // Próximo à rota
      -46.6333,
      10, // 10 m/s
      mockRoute,
      200 // 200m threshold
    )

    expect(result.isDeviated).toBe(false)
    expect(result.distance).toBeLessThan(200)
  })

  it('deve detectar desvio significativo', () => {
    const result = detectRouteDeviation(
      -23.6000, // Longe da rota
      -46.7000,
      10,
      mockRoute,
      200
    )

    expect(result.isDeviated).toBe(true)
    expect(result.distance).toBeGreaterThan(200)
  })

  it('deve retornar não desviado se veículo parado', () => {
    const result = detectRouteDeviation(
      -23.6000, // Longe, mas parado
      -46.7000,
      0, // Parado
      mockRoute,
      200
    )

    expect(result.isDeviated).toBe(false)
  })

  it('deve retornar não desviado se rota vazia', () => {
    const result = detectRouteDeviation(
      -23.5505,
      -46.6333,
      10,
      [],
      200
    )

    expect(result.isDeviated).toBe(false)
    expect(result.distance).toBe(0)
  })

  it('deve usar threshold customizado', () => {
    const result = detectRouteDeviation(
      -23.5600,
      -46.6400,
      10,
      mockRoute,
      100 // Threshold menor
    )

    expect(result.distanceThreshold).toBe(100)
  })
})

