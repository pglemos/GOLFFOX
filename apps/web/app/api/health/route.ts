import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit } from '@/lib/rate-limit'
import { monitoring } from '@/lib/monitoring'

/**
 * Health Check Endpoint
 * Verifica status da aplicação e conexão com Supabase
 */
async function healthHandler() {
  const startTime = Date.now()
  
  try {
    const healthCheck = await monitoring.performHealthCheck()
    const duration = Date.now() - startTime

    // Registrar métrica
    monitoring.recordMetric('health_check.duration', duration, 'ms')
    monitoring.recordMetric('health_check.status', healthCheck.status === 'healthy' ? 1 : 0)

    const httpStatus = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 500

    return NextResponse.json({
      status: healthCheck.status,
      ok: healthCheck.status === 'healthy',
      checks: healthCheck.checks,
      timestamp: healthCheck.timestamp.toISOString(),
      duration: `${duration}ms`
    }, { status: httpStatus })
  } catch (error: any) {
    const duration = Date.now() - startTime
    monitoring.recordMetric('health_check.error', 1)
    monitoring.recordMetric('health_check.duration', duration, 'ms')

    return NextResponse.json(
      { 
        status: 'error',
        ok: false, 
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`
      },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(healthHandler, 'public')

