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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const severity = searchParams.get('severity')

    // Tentar pela view segura primeiro
    let query = supabaseAdmin
      .from('v_operador_alerts_secure')
      .select('id, message, title, alert_type, type, severity, is_resolved, assigned_to, empresa_id, company_id, details, metadata, created_at, resolved_at')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (severity) {
      query = query.eq('severity', severity)
    }

    let { data, error } = await query

    // Se view segura não estiver disponível ou der erro, usar tabela base
    if (error) {
      let fallbackQuery = supabaseAdmin
        .from('gf_alerts')
        .select('id, message, title, alert_type, type, severity, is_resolved, assigned_to, empresa_id, company_id, details, metadata, created_at, resolved_at')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (severity) {
        fallbackQuery = fallbackQuery.eq('severity', severity)
      }

      const res = await fallbackQuery
      data = res.data
      error = res.error
    }

    if (error) {
      logError('Erro ao buscar alertas não resolvidos', { error }, 'AlertsUnresolvedAPI')
      return NextResponse.json(
        { error: 'Erro ao buscar alertas', message: error.message },
        { status: 500 }
      )
    }

    // Mapear dados do banco para formato esperado (alert_type -> type)
    interface AlertRecord {
      id: string
      type?: string
      alert_type?: string
      severity: string
      title: string
      message: string
      is_resolved: boolean
      created_at: string
      [key: string]: unknown
    }

    const mappedData = (data || []).map((alert: AlertRecord) => ({
      ...alert,
      type: alert.type || alert.alert_type || 'other'
    }))

    return NextResponse.json({ alerts: mappedData })
  } catch (error: unknown) {
    logError('Erro ao buscar alertas não resolvidos', { error }, 'AlertsUnresolvedAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao buscar alertas', message: errorMessage },
      { status: 500 }
    )
  }
}

