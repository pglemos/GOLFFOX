/**
 * Redis Cache Service
 * 
 * Serviço de cache distribuído usando Upstash Redis
 * Reutiliza a mesma conexão Redis usada para rate limiting
 */

import { Redis } from '@upstash/redis'
import { debug, warn, logError } from '@/lib/logger'

// Reutilizar conexão Redis do rate-limit.ts
function getRedisClient(): Redis | null {
  const upstashEnabled = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && 
    process.env.UPSTASH_REDIS_REST_TOKEN
  )

  if (!upstashEnabled) {
    return null
  }

  try {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  } catch (error) {
    warn('Falha ao criar cliente Redis', { error }, 'RedisCache')
    return null
  }
}

class RedisCacheService {
  private redis: Redis | null
  private enabled: boolean

  constructor() {
    this.redis = getRedisClient()
    this.enabled = this.redis !== null
    
    if (this.enabled) {
      debug('Redis Cache Service inicializado', {}, 'RedisCache')
    } else {
      warn('Redis Cache Service desabilitado - variáveis de ambiente não configuradas', {}, 'RedisCache')
    }
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) {
      return null
    }

    try {
      const value = await this.redis.get<T>(key)
      
      if (value !== null) {
        debug('Cache hit', { key }, 'RedisCache')
      } else {
        debug('Cache miss', { key }, 'RedisCache')
      }
      
      return value
    } catch (error) {
      logError('Erro ao obter do cache Redis', { error, key }, 'RedisCache')
      return null
    }
  }

  /**
   * Armazenar valor no cache
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false
    }

    try {
      await this.redis.setex(key, ttlSeconds, value)
      debug('Cache set', { key, ttl: ttlSeconds }, 'RedisCache')
      return true
    } catch (error) {
      logError('Erro ao armazenar no cache Redis', { error, key }, 'RedisCache')
      return false
    }
  }

  /**
   * Invalidar cache por chave
   */
  async invalidate(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false
    }

    try {
      await this.redis.del(key)
      debug('Cache invalidado', { key }, 'RedisCache')
      return true
    } catch (error) {
      logError('Erro ao invalidar cache Redis', { error, key }, 'RedisCache')
      return false
    }
  }

  /**
   * Invalidar cache por padrão (tags)
   * 
   * Usa padrão de chaves: tag:value:key
   * Exemplo: company:123:kpis
   */
  async invalidateByTag(tag: string, value?: string): Promise<number> {
    if (!this.enabled || !this.redis) {
      return 0
    }

    try {
      const pattern = value 
        ? `${tag}:${value}:*`
        : `${tag}:*`
      
      // Redis não suporta KEYS em produção (pode ser lento)
      // Usar SCAN para buscar chaves
      const keys: string[] = []
      let cursor: number = 0
      
      do {
        const result: [string | number, string[]] = await this.redis.scan(cursor, { match: pattern, count: 100 })
        const nextCursor = typeof result[0] === 'string' ? parseInt(result[0], 10) : result[0]
        cursor = typeof nextCursor === 'number' ? nextCursor : 0
        keys.push(...(result[1] as string[]))
      } while (cursor !== 0)

      if (keys.length > 0) {
        await this.redis.del(...keys)
        debug('Cache invalidado por tag', { tag, value, count: keys.length }, 'RedisCache')
      }

      return keys.length
    } catch (error) {
      logError('Erro ao invalidar cache por tag', { error, tag, value }, 'RedisCache')
      return 0
    }
  }

  /**
   * Obter ou calcular valor (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Tentar obter do cache
    const cached = await this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }

    // Calcular valor
    const value = await fn()
    
    // Armazenar no cache
    await this.set(key, value, ttlSeconds)
    
    return value
  }

  /**
   * Verificar se cache está habilitado
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Obter estatísticas do cache (se disponível)
   */
  async getStats(): Promise<{ enabled: boolean; keys?: number }> {
    if (!this.enabled || !this.redis) {
      return { enabled: false }
    }

    try {
      // Nota: INFO pode não estar disponível em Upstash
      // Retornar apenas status básico
      return {
        enabled: true,
      }
    } catch (error) {
      warn('Erro ao obter estatísticas do Redis', { error }, 'RedisCache')
      return { enabled: true }
    }
  }
}

// Singleton
export const redisCacheService = new RedisCacheService()

/**
 * Helper para criar chave de cache padronizada
 */
export function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`
}

/**
 * Helper para cache de queries
 */
export async function withRedisCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  return redisCacheService.getOrSet(key, fn, ttlSeconds)
}
