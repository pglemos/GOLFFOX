import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { routeId, driverId, vehicleId } = body

    if (!routeId || !driverId || !vehicleId) {
      return NextResponse.json(
        { success: false, error: 'Rota, motorista e veículo são obrigatórios' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

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
      const { data: updated, error: updateError } = await supabase
        .from('gf_assistance_requests')
        .update({
          dispatched_driver_id: driverId,
          dispatched_vehicle_id: vehicleId,
          status: 'dispatched',
          dispatched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRequest.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      assistanceRequestId = updated.id
    } else {
      // Criar nova solicitação de socorro
      const { data: newRequest, error: createError } = await supabase
        .from('gf_assistance_requests')
        .insert({
          route_id: routeId,
          company_id: route.company_id,
          request_type: 'emergency',
          description: `Despacho de socorro para a rota ${route.name}`,
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

      assistanceRequestId = newRequest.id
    }

    // Criar incidente relacionado (se não existir)
    const { data: existingIncident } = await supabase
      .from('gf_incidents')
      .select('id')
      .eq('route_id', routeId)
      .eq('status', 'open')
      .maybeSingle()

    if (!existingIncident) {
      await supabase
        .from('gf_incidents')
        .insert({
          company_id: route.company_id,
          route_id: routeId,
          vehicle_id: vehicleId,
          driver_id: driverId,
          severity: 'critical',
          status: 'open',
          description: `Despacho de socorro para a rota ${route.name}`
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Socorro despachado com sucesso!',
      assistanceRequestId
    })
  } catch (error: any) {
    console.error('Erro ao despachar socorro:', error)
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

