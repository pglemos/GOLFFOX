/**
 * Health Check API
 * 
 * Endpoint para verificar saúde do sistema
 * Usado por load balancers e ferramentas de monitoramento
 */

import { NextRequest, NextResponse } from 'next/server'
import { monitoring, type HealthCheck } from '@/lib/monitoring'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Aplicar rate limiting para health check
  const rateLimitResponse = await applyRateLimit(request, 'public')
  if (rateLimitResponse) return rateLimitResponse
  try {
    // Executar health check
    const healthCheck = await monitoring.performHealthCheck()

    // Verificar conexão com Supabase (real)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && serviceKey) {
        const supabase = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })

        const startTime = Date.now()
        // Fazer query simples para verificar conexão
        const { error } = await supabase.from('users').select('id').limit(1)
        const latency = Date.now() - startTime

        if (error) {
          healthCheck.checks.supabase = {
            status: 'error',
            message: error.message,
            latency
          }
          healthCheck.status = healthCheck.status === 'healthy' ? 'degraded' : 'unhealthy'
        } else {
          healthCheck.checks.supabase = {
            status: 'ok',
            message: 'Conexão com Supabase OK',
            latency
          }
        }
      }
    } catch (error) {
      healthCheck.checks.supabase = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }
      healthCheck.status = healthCheck.status === 'healthy' ? 'degraded' : 'unhealthy'
    }

    // Verificar Redis (se configurado)
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

      if (redisUrl && redisToken) {
        const { Redis } = await import('@upstash/redis')
        const redis = new Redis({
          url: redisUrl,
          token: redisToken,
        })

        const startTime = Date.now()
        await redis.ping()
        const latency = Date.now() - startTime

        healthCheck.checks.redis = {
          status: 'ok',
          message: 'Conexão com Redis OK',
          latency
        }
      } else {
        healthCheck.checks.redis = {
          status: 'ok',
          message: 'Redis não configurado (opcional)'
        }
      }
    } catch (error) {
      healthCheck.checks.redis = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao conectar Redis'
      }
      // Redis não é crítico, não degradar status geral
    }

    // Determinar status HTTP baseado no health check
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthCheck, { status: statusCode })
  } catch (error) {
    logError('Erro ao executar health check', { error }, 'HealthCheckAPI')
    return NextResponse.json(
      {
        status: 'unhealthy',
        checks: {},
        timestamp: new Date(),
        error: 'Erro interno ao executar health check'
      },
      { status: 503 }
    )
  }
}
