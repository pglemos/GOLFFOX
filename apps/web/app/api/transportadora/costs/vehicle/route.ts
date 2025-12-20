import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth, validateAuth } from '@/lib/api-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const vehicleCostSchema = z.object({
  vehicle_id: z.string().uuid(),
  cost_category: z.enum(['combustivel', 'manutencao', 'seguro', 'ipva', 'depreciacao', 'pneus', 'lavagem', 'pedagio', 'multas', 'outros']),
  cost_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount_brl: z.number().positive(),
  quantity: z.number().positive().optional().nullable(),
  unit_measure: z.string().optional().nullable(),
  odometer_km: z.number().int().positive().optional().nullable(),
  description: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
})

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(req: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(req, 'transportadora')
    if (authErrorResponse) return authErrorResponse

    const user = await validateAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const vehicleId = req.nextUrl.searchParams.get('vehicle_id')
    const startDate = req.nextUrl.searchParams.get('start_date')
    const endDate = req.nextUrl.searchParams.get('end_date')

    // Buscar transportadora_id do usuário
    const { data: userData } = await supabaseServiceRole
      .from('users')
      .select('transportadora_id')
      .eq('id', user.id)
      .single()

    let query = supabaseServiceRole
      .from('vehicle_costs')
      .select(`
        *,
        vehicles(plate, model, transportadora_id)
      `)

    // Filtrar apenas veículos da transportadora do usuário
    // Nota: O filtro será feito após o join através da relação vehicle_id
    // Verificar se o veículo pertence à transportadora ao processar resultados

    if (vehicleId) query = query.eq('vehicle_id', vehicleId)
    if (startDate) query = query.gte('cost_date', startDate)
    if (endDate) query = query.lte('cost_date', endDate)

    const { data, error } = await query.order('cost_date', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar custos', message: error.message },
        { status: 500 }
      )
    }

    // Filtrar apenas veículos da transportadora do usuário após buscar
    const filteredData = (data || []).filter((cost: any) => {
      if (!userData?.transportadora_id) return false
      const veiculo = cost.vehicles
      if (!veiculo) return false
      return veiculo.transportadora_id === userData.transportadora_id
    })

    return NextResponse.json(filteredData)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(req, 'transportadora')
    if (authErrorResponse) return authErrorResponse

    const user = await validateAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const validated = vehicleCostSchema.parse(body)

    // Verificar se o veículo pertence à transportadora do usuário
    const { data: veiculo } = await supabaseServiceRole
      .from('vehicles')
      .select('transportadora_id')
      .eq('id', validated.vehicle_id)
      .single()

    if (!veiculo) {
      return NextResponse.json(
        { error: 'Veículo não encontrado' },
        { status: 404 }
      )
    }

    const { data: userData } = await supabaseServiceRole
      .from('users')
      .select('transportadora_id')
      .eq('id', user.id)
      .single()

    if (userData?.transportadora_id !== veiculo.transportadora_id) {
      return NextResponse.json(
        { error: 'Acesso negado: veículo não pertence à sua transportadora' },
        { status: 403 }
      )
    }

    const { data, error } = await supabaseServiceRole
      .from('vehicle_costs')
      .insert({
        ...validated,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao criar custo', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

