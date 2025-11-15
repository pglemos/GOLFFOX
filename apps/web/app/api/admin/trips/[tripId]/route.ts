import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey)
}

// Validação de UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid)
}

function sanitizeId(id: string | undefined | null): string | null {
  if (!id || typeof id !== 'string') return null
  return id.trim() || null
}

/**
 * PUT /api/admin/trips/[tripId]
 * Atualizar viagem
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId: tripIdParam } = await params
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const tripId = sanitizeId(tripIdParam)
    if (!tripId) {
      return NextResponse.json(
        { error: 'trip_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!isValidUUID(tripId)) {
      return NextResponse.json(
        { error: 'trip_id deve ser um UUID válido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Verificar se viagem existe
    const { data: existingTrip, error: fetchError } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (fetchError || !existingTrip) {
      return NextResponse.json(
        { error: 'Viagem não encontrada' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}
    
    // Aceitar tanto snake_case quanto camelCase
    if (body.route_id !== undefined || body.routeId !== undefined) {
      updateData.route_id = body.route_id || body.routeId
    }
    if (body.vehicle_id !== undefined || body.vehicleId !== undefined) {
      updateData.vehicle_id = body.vehicle_id || body.vehicleId || null
    }
    if (body.driver_id !== undefined || body.driverId !== undefined) {
      updateData.driver_id = body.driver_id || body.driverId || null
    }
    if (body.status !== undefined) updateData.status = body.status
    if (body.scheduled_date !== undefined || body.scheduledDate !== undefined) {
      updateData.scheduled_date = body.scheduled_date || body.scheduledDate
    }
    if (body.scheduled_start_time !== undefined || body.scheduledStartTime !== undefined) {
      updateData.scheduled_start_time = body.scheduled_start_time || body.scheduledStartTime || null
    }
    if (body.start_time !== undefined || body.startTime !== undefined) {
      updateData.start_time = body.start_time || body.startTime || null
    }
    if (body.end_time !== undefined || body.endTime !== undefined) {
      updateData.end_time = body.end_time || body.endTime || null
    }
    if (body.actual_start_time !== undefined || body.actualStartTime !== undefined) {
      updateData.actual_start_time = body.actual_start_time || body.actualStartTime || null
    }
    if (body.actual_end_time !== undefined || body.actualEndTime !== undefined) {
      updateData.actual_end_time = body.actual_end_time || body.actualEndTime || null
    }
    if (body.distance_km !== undefined || body.distanceKm !== undefined) {
      updateData.distance_km = body.distance_km || body.distanceKm || null
    }
    if (body.notes !== undefined) updateData.notes = body.notes || null

    // Atualizar viagem
    const { data: updatedTrip, error: updateError } = await supabaseAdmin
      .from('trips')
      .update(updateData)
      .eq('id', tripId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar viagem:', updateError)
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar viagem',
          message: updateError.message || 'Erro desconhecido',
          details: process.env.NODE_ENV === 'development' ? updateError : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trip: updatedTrip
    })
  } catch (error: any) {
    console.error('Erro ao atualizar viagem:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar viagem',
        message: error.message || 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/trips/[tripId]
 * Excluir viagem
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId: tripIdParam } = await params
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const tripId = sanitizeId(tripIdParam)
    if (!tripId) {
      return NextResponse.json(
        { error: 'trip_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!isValidUUID(tripId)) {
      return NextResponse.json(
        { error: 'trip_id deve ser um UUID válido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verificar se viagem existe
    const { data: existingTrip, error: fetchError } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (fetchError || !existingTrip) {
      return NextResponse.json(
        { error: 'Viagem não encontrada' },
        { status: 404 }
      )
    }

    // Excluir viagem (hard delete - trips podem ser excluídos sem problemas)
    const { error: deleteError } = await supabaseAdmin
      .from('trips')
      .delete()
      .eq('id', tripId)

    if (deleteError) {
      console.error('Erro ao excluir viagem:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir viagem', message: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted: true,
      message: 'Viagem excluída com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao excluir viagem:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir viagem', message: error.message },
      { status: 500 }
    )
  }
}

