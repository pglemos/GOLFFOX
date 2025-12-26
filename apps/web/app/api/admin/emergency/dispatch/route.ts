import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { validationErrorResponse } from '@/lib/api-response'
import { logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validateWithSchema, emergencyDispatchSchema } from '@/lib/validation/schemas'
import type { Database } from '@/types/supabase'

type RotasRow = Database['public']['Tables']['rotas']['Row']
type AssistanceRequestRow = Database['public']['Tables']['gf_assistance_requests']['Row']
type AssistanceRequestInsert = Database['public']['Tables']['gf_assistance_requests']['Insert']
type AssistanceRequestUpdate = Database['public']['Tables']['gf_assistance_requests']['Update']
type IncidentInsert = Database['public']['Tables']['gf_incidents']['Insert']

export const runtime = 'nodejs'

async function postHandler(req: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(req, 'admin')
  if (authError) return authError

  try {
    const body = await req.json()

    // Validar corpo
    const validation = validateWithSchema(emergencyDispatchSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { routeId, driverId, vehicleId } = validation.data

    const supabase = getSupabaseAdmin()

    // Buscar informações da rota
    const { data: route, error: routeError } = await supabase
      .from('rotas')
      .select('id, name, empresa_id')
      .eq('id', routeId)
      .single()

    if (routeError || !route) {
      return NextResponse.json(
        { success: false, error: 'Rota não encontrada' },
        { status: 404 }
      )
    }

    const routeData = route as RotasRow

    // Verificar se já existe uma solicitação de socorro aberta para esta rota
    const { data: existingRequest, error: checkError } = await supabase
      .from('gf_assistance_requests')
      .select('id, status')
      .eq('rota_id', routeId)
      .eq('status', 'open')
      .maybeSingle()

    let assistanceRequestId: string

    if (existingRequest) {
      // Atualizar solicitação existente
      const existingId = (existingRequest as AssistanceRequestRow).id
      const updateData: AssistanceRequestUpdate = {
        dispatched_driver_id: driverId,
        dispatched_vehicle_id: vehicleId,
        status: 'dispatched',
        dispatched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const { data: updated, error: updateError } = await supabase
        .from('gf_assistance_requests')
        .update(updateData)
        .eq('id', existingId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      assistanceRequestId = (updated as AssistanceRequestRow).id
    } else {
      // Criar nova solicitação de socorro
      const insertData: AssistanceRequestInsert = {
        rota_id: routeId,
        empresa_id: routeData.empresa_id,
        request_type: 'emergency',
        description: `Despacho de socorro para a rota ${routeData.name}`,
        status: 'dispatched',
        dispatched_driver_id: driverId,
        dispatched_vehicle_id: vehicleId,
        dispatched_at: new Date().toISOString()
      }
      const { data: newRequest, error: createError } = await supabase
        .from('gf_assistance_requests')
        .insert(insertData)
        .select()
        .single()

      if (createError) {
        throw createError
      }

      assistanceRequestId = (newRequest as AssistanceRequestRow).id
    }

    // Criar incidente relacionado (se não existir)
    const { data: existingIncident } = await supabase
      .from('gf_incidents')
      .select('id')
      .eq('rota_id', routeId)
      .eq('status', 'open')
      .maybeSingle()

    if (!existingIncident) {
      const incidentData: IncidentInsert = {
        empresa_id: routeData.empresa_id,
        rota_id: routeId,
        veiculo_id: vehicleId,
        motorista_id: driverId,
        severity: 'critical',
        status: 'open',
        description: `Despacho de socorro para a rota ${routeData.name}`
      }
      await supabase
        .from('gf_incidents')
        .insert(incidentData)
    }

    return NextResponse.json({
      success: true,
      message: 'Socorro despachado com sucesso!',
      assistanceRequestId
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    logError('Erro ao despachar socorro', { error: err }, 'EmergencyDispatchAPI')
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao despachar socorro',
        message: err.message
      },
      { status: 500 }
    )
  }
}

// ✅ SEGURANÇA: Rate limiting para proteção contra abuso
export const POST = withRateLimit(postHandler, 'sensitive')
