/**
 * Cache Service
 * Camada de cache para otimizar rotas pesadas
 */

import { logger } from '@/lib/logger'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class CacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private maxSize = 1000 // Limitar tamanho do cache em memória

  /**
   * Obter valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return null
    }

    // Verificar se expirou
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Armazenar valor no cache
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Limitar tamanho do cache
    if (this.cache.size >= this.maxSize) {
      // Remover entrada mais antiga
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Invalidar cache por chave
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidar cache por padrão
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Obter estatísticas do cache
   */
  getStats() {
    const now = Date.now()
    let expired = 0
    let active = 0

    this.cache.forEach(entry => {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      } else {
        active++
      }
    })

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize
    }
  }
}

// Singleton
export const cacheService = new CacheService()

/**
 * Decorator para cachear resultado de função
 */
export function cached(key: string, ttl: number = 5 * 60 * 1000) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`
      const cached = cacheService.get(cacheKey)

      if (cached !== null) {
        logger.debug(`Cache hit: ${cacheKey}`)
        return cached
      }

      logger.debug(`Cache miss: ${cacheKey}`)
      const result = await originalMethod.apply(this, args)
      cacheService.set(cacheKey, result, ttl)

      return result
    }

    return descriptor
  }
}

/**
 * Helper para cachear resultado de função assíncrona
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const cached = cacheService.get<T>(key)

  if (cached !== null) {
    return cached
  }

  const result = await fn()
  cacheService.set(key, result, ttl)

  return result
}

