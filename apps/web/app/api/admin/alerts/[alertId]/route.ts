import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { invalidateEntityCache } from '@/lib/next-cache'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ alertId: string }> }
) {
  const params = await context.params

  const { alertId: alertIdParam  } = params
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const alertId = alertIdParam?.trim()
    if (!alertId || !UUID_REGEX.test(alertId)) {
      return NextResponse.json(
        { error: 'alert_id deve ser um UUID válido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Verificar se alerta existe
    const { data: existingAlert, error: fetchError } = await supabaseAdmin
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single()

    if (fetchError || !existingAlert) {
      return NextResponse.json(
        { error: 'Alerta não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.severity !== undefined) updateData.severity = body.severity
    if (body.status !== undefined) updateData.status = body.status
    if (body.route_id !== undefined) updateData.route_id = body.route_id || null
    if (body.vehicle_id !== undefined) updateData.vehicle_id = body.vehicle_id || null

    // Atualizar alerta
    const { data: updatedAlert, error: updateError } = await supabaseAdmin
      .from('alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar alerta:', updateError)
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar alerta',
          message: updateError.message || 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    // Invalidar cache após atualização
    await invalidateEntityCache('alert', alertId)

    return NextResponse.json({
      success: true,
      alert: updatedAlert
    })
  } catch (err) {
    console.error('Erro ao atualizar alerta:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar alerta',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}

