import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { validateWithSchema, vehicleMaintenanceSchema, maintenanceQuerySchema, uuidSchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ vehicleId: string }> }
) {
  const params = await context.params
  const { vehicleId } = params

  try {
    const authErrorResponse = await requireAuth(request, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    // Validar ID
    const idValidation = uuidSchema.safeParse(vehicleId)
    if (!idValidation.success) {
      return validationErrorResponse('ID do veículo inválido')
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(maintenanceQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { status, type } = validation.data

    let query = supabaseServiceRole
      .from('vehicle_maintenances')
      .select('id, veiculo_id, maintenance_type, scheduled_date, completed_date, next_maintenance_date, odometer_km, description, cost_parts_brl, cost_labor_brl, workshop_name, mechanic_name, status, notes, created_at, updated_at')
      .eq('veiculo_id', vehicleId)

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('maintenance_type', type)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar manutenções', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ vehicleId: string }> }
) {
  const params = await context.params
  const { vehicleId } = params

  try {
    const authErrorResponse = await requireAuth(request, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    // Validar ID
    const idValidation = uuidSchema.safeParse(vehicleId)
    if (!idValidation.success) {
      return validationErrorResponse('ID do veículo inválido')
    }

    const body = await request.json()

    // Validar corpo
    const validation = validateWithSchema(vehicleMaintenanceSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const validated = validation.data

    const { data, error } = await supabaseServiceRole
      .from('vehicle_maintenances')
      .insert({
        veiculo_id: vehicleId,
        ...validated,
        scheduled_date: validated.scheduled_date || null,
        completed_date: validated.completed_date || null,
        next_maintenance_date: validated.next_maintenance_date || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao criar manutenção', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: errorMessage },
      { status: 500 }
    )
  }
}

