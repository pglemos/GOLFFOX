/**
 * API Route para receber métricas de Web Vitals
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

// GET handler para evitar 405 quando acessado incorretamente
async function getHandler(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'Web Vitals API',
      description: 'Este endpoint aceita apenas requisições POST para enviar métricas de Web Vitals',
      usage: 'POST /api/analytics/web-vitals com body: { url, userAgent, timestamp, metrics }'
    },
    { status: 200 }
  )
}

// OPTIONS handler para CORS (se necessário)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, userAgent, timestamp, metrics } = body

    // Inicializar Supabase apenas se variáveis estiverem configuradas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceRoleKey && metrics && metrics.length > 0) {
      try {
        const supabase = createClient(supabaseUrl, serviceRoleKey)
        const { error } = await supabase.from('gf_web_vitals').insert({
          url,
          user_agent: userAgent,
          timestamp: new Date(timestamp).toISOString(),
          metrics: metrics,
          created_at: new Date().toISOString(),
        })

        if (error) {
          logError('Erro ao salvar Web Vitals', { error, url }, 'WebVitalsAPI')
        }

        // Verificar métricas com rating 'poor' e gerar alertas
        const poorMetrics = metrics?.filter((m: { rating?: string; name?: string }) => m.rating === 'poor') || []
        if (poorMetrics.length > 0) {
          await (supabase.from('gf_operational_alerts') as any).insert({
            type: 'performance',
            severity: 'warning',
            title: 'Métricas de Performance Degradadas',
            message: `Web Vitals com rating 'poor': ${poorMetrics.map((m: { name?: string }) => m.name).join(', ')}`,
            details: {
              url,
              metrics: poorMetrics,
            },
            created_at: new Date().toISOString(),
          })
        }
      } catch (supabaseError) {
        logError('Erro Supabase ao processar Web Vitals', { error: supabaseError, url }, 'WebVitalsAPI')
      }
    }
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logError('Erro ao processar Web Vitals', { error }, 'WebVitalsAPI')
    // Não falhar para o cliente de analytics; responder sucesso mesmo em erros internos
    return NextResponse.json({ success: false })
  }
}

export const GET = withRateLimit(getHandler, 'public')
export const POST = withRateLimit(postHandler, 'api')
