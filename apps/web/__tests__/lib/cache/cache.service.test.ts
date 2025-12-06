/**
 * Testes Unitários - Cache Service
 */

import { cacheService, withCache } from '@/lib/cache/cache.service'

describe('CacheService', () => {
  beforeEach(() => {
    cacheService.clear()
  })

  describe('set e get', () => {
    it('deve armazenar e recuperar valor', () => {
      cacheService.set('test-key', 'test-value', 1000)
      const value = cacheService.get('test-key')
      expect(value).toBe('test-value')
    })

    it('deve retornar null para chave inexistente', () => {
      const value = cacheService.get('non-existent')
      expect(value).toBeNull()
    })

    it('deve expirar após TTL', async () => {
      cacheService.set('test-key', 'test-value', 100) // 100ms
      await new Promise(resolve => setTimeout(resolve, 150))
      const value = cacheService.get('test-key')
      expect(value).toBeNull()
    })
  })

  describe('invalidate', () => {
    it('deve invalidar chave específica', () => {
      cacheService.set('key1', 'value1')
      cacheService.set('key2', 'value2')
      cacheService.invalidate('key1')
      expect(cacheService.get('key1')).toBeNull()
      expect(cacheService.get('key2')).toBe('value2')
    })
  })

  describe('invalidatePattern', () => {
    it('deve invalidar chaves por padrão', () => {
      cacheService.set('companies:list:1', 'data1')
      cacheService.set('companies:list:2', 'data2')
      cacheService.set('users:list:1', 'data3')
      cacheService.invalidatePattern('companies:list:.*')
      expect(cacheService.get('companies:list:1')).toBeNull()
      expect(cacheService.get('companies:list:2')).toBeNull()
      expect(cacheService.get('users:list:1')).toBe('data3')
    })
  })

  describe('withCache', () => {
    it('deve cachear resultado de função', async () => {
      let callCount = 0
      const fn = async () => {
        callCount++
        return 'result'
      }

      const result1 = await withCache('test-key', fn, 1000)
      const result2 = await withCache('test-key', fn, 1000)

      expect(result1).toBe('result')
      expect(result2).toBe('result')
      expect(callCount).toBe(1) // Função chamada apenas uma vez
    })
  })

  describe('getStats', () => {
    it('deve retornar estatísticas do cache', () => {
      cacheService.set('key1', 'value1', 1000)
      cacheService.set('key2', 'value2', 1000)
      const stats = cacheService.getStats()
      expect(stats.total).toBe(2)
      expect(stats.active).toBe(2)
    })
  })
})

