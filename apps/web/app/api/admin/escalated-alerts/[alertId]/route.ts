import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError, debug } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

// PATCH - Atualizar alerta escalado (usado para resolver)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ alertId: string }> }
) {
  try {
    // Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    // Aguardar params (Next.js 15+)
    const params = await context.params
    const alertId = params?.alertId
    if (!alertId) {
      return NextResponse.json(
        { error: 'ID do alerta não fornecido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, resolution } = body

    // Validação
    if (!status) {
      return NextResponse.json(
        { error: 'Status é obrigatório' },
        { status: 400 }
      )
    }

    if (!['pending', 'in_progress', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Obter o usuário atual para registrar quem resolveu
    const authHeader = request.headers.get('authorization')
    let resolvedBy = null
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)
        resolvedBy = user?.id || null
      } catch (e) {
        // Se não conseguir obter o usuário, continua sem resolved_by
        debug('Não foi possível obter usuário do token', {}, 'escalated-alerts-api')
      }
    }

    import type { Database } from '@/types/supabase'
    type GfEscalatedAlertsUpdate = Database['public']['Tables']['gf_escalated_alerts']['Update']
    
    const updateData: GfEscalatedAlertsUpdate = {
      status,
      updated_at: new Date().toISOString()
    }

    // Se estiver resolvendo, adiciona resolved_at e resolution
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = resolvedBy || null
      if (resolution) {
        updateData.resolution = resolution
      }
    }

    const { data, error } = await supabaseAdmin
      .from('gf_escalated_alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single()

    if (error) {
      logError('Erro ao atualizar alerta escalado', { error, alertId }, 'escalated-alerts-api')
      return NextResponse.json(
        { error: 'Erro ao atualizar alerta escalado', details: error.message },
        { status: 500 }
      )
    }

    debug('Alerta escalado atualizado', { id: alertId, status }, 'escalated-alerts-api')

    return NextResponse.json({ alert: data }, { status: 200 })
  } catch (error: unknown) {
    logError('Exceção ao atualizar alerta escalado', { error }, 'escalated-alerts-api')
    return NextResponse.json(
      { error: 'Erro interno ao atualizar alerta escalado', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

