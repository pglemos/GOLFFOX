import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request)
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Tentar pela view segura primeiro
    let { data, error } = await supabaseAdmin
      .from('v_operador_alerts_secure')
      .select('id, severity, is_resolved')
      .eq('severity', 'critical')
      .eq('is_resolved', false)
      .limit(1)

    // Se view segura não estiver disponível ou der erro, usar tabela base
    if (error) {
      const res = await supabaseAdmin
        .from('gf_alerts')
        .select('id')
        .eq('is_resolved', false)
        .eq('severity', 'critical')
        .limit(1)
      data = res.data
      error = res.error
    }

    if (error) {
      logError('Erro ao verificar alertas críticos', { error }, 'AlertsHasCriticalAPI')
      return NextResponse.json(
        { error: 'Erro ao verificar alertas', message: error.message },
        { status: 500 }
      )
    }

    // Retornar true se houver pelo menos um alerta
    const hasCritical = Array.isArray(data) && data.length > 0

    return NextResponse.json({ hasCritical })
  } catch (error: unknown) {
    logError('Erro ao verificar alertas críticos', { error }, 'AlertsHasCriticalAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao verificar alertas', message: errorMessage },
      { status: 500 }
    )
  }
}

