import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const maintenanceSchema = z.object({
  maintenance_type: z.enum(['preventiva', 'corretiva', 'revisao', 'troca_oleo', 'pneus', 'freios', 'suspensao', 'eletrica', 'outra']),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  completed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  next_maintenance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  odometer_km: z.number().int().positive().optional().nullable(),
  description: z.string().min(1),
  cost_parts_brl: z.number().min(0).default(0),
  cost_labor_brl: z.number().min(0).default(0),
  workshop_name: z.string().optional().nullable(),
  mechanic_name: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().optional().nullable(),
})

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

  try {
    const authErrorResponse = await requireAuth(request, 'transportadora')
    if (authErrorResponse) return authErrorResponse

    // Selecionar apenas colunas necessárias para listagem (otimização de performance)
    const maintenanceColumns = 'id,veiculo_id,maintenance_type,scheduled_date,completed_date,next_maintenance_date,odometer_km,description,cost_parts_brl,cost_labor_brl,workshop_name,mechanic_name,status,notes,created_at,updated_at'
    const { data, error } = await supabaseServiceRole
      .from('vehicle_maintenances')
      .select(maintenanceColumns)
      .eq('veiculo_id', params.vehicleId)
      .order('created_at', { ascending: false })

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

  try {
    const authErrorResponse = await requireAuth(request, 'transportadora')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()
    const validated = maintenanceSchema.parse(body)

    const { data, error } = await supabaseServiceRole
      .from('vehicle_maintenances')
      .insert({
        veiculo_id: params.vehicleId,
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
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.errors },
        { status: 400 }
      )
    }
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: errorMessage },
      { status: 500 }
    )
  }
}

