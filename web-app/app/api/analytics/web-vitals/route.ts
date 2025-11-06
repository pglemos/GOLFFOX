/**
 * API Route para receber métricas de Web Vitals
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
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
          console.error('Erro ao salvar Web Vitals:', error)
        }

        // Verificar métricas com rating 'poor' e gerar alertas
        const poorMetrics = metrics?.filter((m: any) => m.rating === 'poor') || []
        if (poorMetrics.length > 0) {
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
      } catch (supabaseError) {
        console.error('Erro Supabase (Web Vitals):', supabaseError)
      }
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao processar Web Vitals:', error)
    // Não falhar para o cliente de analytics; responder sucesso mesmo em erros internos
    return NextResponse.json({ success: false })
  }
}

