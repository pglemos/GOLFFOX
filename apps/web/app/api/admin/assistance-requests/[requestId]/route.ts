import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

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
  context: { params: Promise<{ requestId: string }> }
) {
  const params = await context.params

  const { requestId: requestIdParam  } = params
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const requestId = requestIdParam?.trim()
    if (!requestId || !UUID_REGEX.test(requestId)) {
      return NextResponse.json(
        { error: 'request_id deve ser um UUID válido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Verificar se ocorrência existe (selecionar apenas id para verificação)
    const { data: existingRequest, error: fetchError } = await supabaseAdmin
      .from('gf_service_requests')
      .select('id')
      .eq('id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Ocorrência não encontrada' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.status !== undefined) updateData.status = body.status
    if (body.request_type !== undefined) updateData.request_type = body.request_type
    if (body.address !== undefined) updateData.address = body.address?.trim() || null
    if (body.route_id !== undefined) updateData.route_id = body.route_id || null
    if (body.dispatched_driver_id !== undefined) updateData.dispatched_driver_id = body.dispatched_driver_id || null
    if (body.dispatched_vehicle_id !== undefined) updateData.dispatched_vehicle_id = body.dispatched_vehicle_id || null

    // Atualizar ocorrência
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('gf_service_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar ocorrência:', updateError)
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar ocorrência',
          message: updateError.message || 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest
    })
  } catch (err) {
    console.error('Erro ao atualizar ocorrência:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar ocorrência',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}

