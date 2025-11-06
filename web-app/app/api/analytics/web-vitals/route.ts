/**
 * API Route para receber métricas de Web Vitals
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, userAgent, timestamp, metrics } = body

    // Salvar métricas no banco (opcional)
    if (metrics && metrics.length > 0) {
      const { error } = await supabase.from('gf_web_vitals').insert({
        url,
        user_agent: userAgent,
        timestamp: new Date(timestamp).toISOString(),
        metrics: metrics,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Erro ao salvar Web Vitals:', error)
      }
    }

    // Verificar métricas com rating 'poor' e gerar alertas
    const poorMetrics = metrics?.filter((m: any) => m.rating === 'poor') || []
    
    if (poorMetrics.length > 0) {
      // Registrar alerta de performance
      await supabase.from('gf_operational_alerts').insert({
        type: 'performance',
        severity: 'warning',
        title: 'Métricas de Performance Degradadas',
        message: `Web Vitals com rating 'poor': ${poorMetrics.map((m: any) => m.name).join(', ')}`,
        details: {
          url,
          metrics: poorMetrics,
        },
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao processar Web Vitals:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar métricas' },
      { status: 500 }
    )
  }
}

