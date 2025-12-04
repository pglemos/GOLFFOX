import { optimizeRoute, calculateHash } from '@/lib/route-optimization'

// Mock fetch
global.fetch = jest.fn()

describe('lib/route-optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('optimizeRoute', () => {
    it('deve otimizar rota com sucesso', async () => {
      const mockResponse = {
        optimized_route: [
          { id: '1', lat: -23.5505, lng: -46.6333 },
          { id: '2', lat: -23.5595, lng: -46.6333 },
        ],
        total_distance: 1000,
        total_duration: 600,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const request = {
        companyId: 'company-1',
        origin: { lat: -23.5505, lng: -46.6333 },
        destination: { lat: -23.5595, lng: -46.6333 },
        waypoints: [
          { id: '1', lat: -23.5505, lng: -46.6333 },
        ],
      }

      const result = await optimizeRoute(request)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/optimize-route',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('deve lançar erro quando API falha', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Erro ao otimizar' }),
      })

      const request = {
        companyId: 'company-1',
        origin: { lat: -23.5505, lng: -46.6333 },
        destination: { lat: -23.5595, lng: -46.6333 },
        waypoints: [],
      }

      await expect(optimizeRoute(request)).rejects.toThrow('Erro ao otimizar')
    })
  })

  describe('calculateHash', () => {
    it('deve calcular hash consistente', () => {
      const request = {
        companyId: 'company-1',
        origin: { lat: -23.5505, lng: -46.6333 },
        destination: { lat: -23.5595, lng: -46.6333 },
        waypoints: [
          { id: '1', lat: -23.5505, lng: -46.6333 },
          { id: '2', lat: -23.5595, lng: -46.6333 },
        ],
      }

      const hash1 = calculateHash(request)
      const hash2 = calculateHash(request)

      expect(hash1).toBe(hash2)
      expect(typeof hash1).toBe('string')
      expect(hash1.length).toBeGreaterThan(0)
    })

    it('deve ordenar waypoints antes de calcular hash', () => {
      const request1 = {
        companyId: 'company-1',
        origin: { lat: -23.5505, lng: -46.6333 },
        destination: { lat: -23.5595, lng: -46.6333 },
        waypoints: [
          { id: '2', lat: -23.5595, lng: -46.6333 },
          { id: '1', lat: -23.5505, lng: -46.6333 },
        ],
      }

      const request2 = {
        companyId: 'company-1',
        origin: { lat: -23.5505, lng: -46.6333 },
        destination: { lat: -23.5595, lng: -46.6333 },
        waypoints: [
          { id: '1', lat: -23.5505, lng: -46.6333 },
          { id: '2', lat: -23.5595, lng: -46.6333 },
        ],
      }

      const hash1 = calculateHash(request1)
      const hash2 = calculateHash(request2)

      expect(hash1).toBe(hash2)
    })
  })
})

