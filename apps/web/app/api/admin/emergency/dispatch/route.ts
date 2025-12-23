import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(req, 'admin')
  if (authError) return authError

  try {
    const body = await req.json()
    const { routeId, driverId, vehicleId } = body

    if (!routeId || !driverId || !vehicleId) {
      return NextResponse.json(
        { success: false, error: 'Rota, motorista e veículo são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar informações da rota
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('id, name, company_id')
      .eq('id', routeId)
      .single()

    if (routeError || !route) {
      return NextResponse.json(
        { success: false, error: 'Rota não encontrada' },
        { status: 404 }
      )
    }

    const routeData = route as any

    // Verificar se já existe uma solicitação de socorro aberta para esta rota
    const { data: existingRequest, error: checkError } = await supabase
      .from('gf_assistance_requests')
      .select('id, status')
      .eq('route_id', routeId)
      .eq('status', 'open')
      .maybeSingle()

    let assistanceRequestId: string

    if (existingRequest) {
      // Atualizar solicitação existente
      const existingId = (existingRequest as any).id
      const { data: updated, error: updateError } = await (supabase
        .from('gf_assistance_requests') as any)
        .update({
          dispatched_driver_id: driverId,
          dispatched_vehicle_id: vehicleId,
          status: 'dispatched',
          dispatched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      assistanceRequestId = (updated as any).id
    } else {
      // Criar nova solicitação de socorro
      const { data: newRequest, error: createError } = await (supabase
        .from('gf_assistance_requests') as any)
        .insert({
          route_id: routeId,
          company_id: routeData.company_id,
          request_type: 'emergency',
          description: `Despacho de socorro para a rota ${routeData.name}`,
          status: 'dispatched',
          dispatched_driver_id: driverId,
          dispatched_vehicle_id: vehicleId,
          dispatched_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      assistanceRequestId = (newRequest as any).id
    }

    // Criar incidente relacionado (se não existir)
    const { data: existingIncident } = await supabase
      .from('gf_incidents')
      .select('id')
      .eq('route_id', routeId)
      .eq('status', 'open')
      .maybeSingle()

    if (!existingIncident) {
      await (supabase
        .from('gf_incidents') as any)
        .insert({
          company_id: routeData.company_id,
          route_id: routeId,
          veiculo_id: vehicleId,
          motorista_id: driverId,
          severity: 'critical',
          status: 'open',
          description: `Despacho de socorro para a rota ${routeData.name}`
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Socorro despachado com sucesso!',
      assistanceRequestId
    })
  } catch (error: any) {
    logError('Erro ao despachar socorro', { error }, 'EmergencyDispatchAPI')
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao despachar socorro',
        message: error.message
      },
      { status: 500 }
    )
  }
}

