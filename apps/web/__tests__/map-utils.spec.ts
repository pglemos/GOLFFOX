import { describe, it, expect, vi } from 'vitest'

// Mock de funções utilitárias do mapa
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

describe('Map Utils', () => {
  describe('calculateDistance', () => {
    it('deve calcular distância entre dois pontos', () => {
      // São Paulo para Rio de Janeiro (aproximadamente 350km)
      const distance = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729)
      expect(distance).toBeGreaterThan(300)
      expect(distance).toBeLessThan(400)
    })

    it('deve retornar 0 para o mesmo ponto', () => {
      const distance = calculateDistance(-23.5505, -46.6333, -23.5505, -46.6333)
      expect(distance).toBeCloseTo(0, 1)
    })
  })

  describe('debounce', () => {
    it('deve atrasar execução da função', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('deve cancelar chamadas anteriores', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})

