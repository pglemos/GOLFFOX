import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth, validateAuth } from '@/lib/api-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const routeCostSchema = z.object({
  route_id: z.string().uuid(),
  trip_id: z.string().uuid().optional().nullable(),
  cost_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fuel_cost_brl: z.number().min(0).default(0),
  labor_cost_brl: z.number().min(0).default(0),
  maintenance_cost_brl: z.number().min(0).default(0),
  toll_cost_brl: z.number().min(0).default(0),
  fixed_cost_brl: z.number().min(0).default(0),
  passengers_transported: z.number().int().min(0).default(0),
  distance_km: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
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

    const routeId = req.nextUrl.searchParams.get('route_id')
    const tripId = req.nextUrl.searchParams.get('trip_id')
    const startDate = req.nextUrl.searchParams.get('start_date')
    const endDate = req.nextUrl.searchParams.get('end_date')

    // Buscar carrier_id do usuário
    const { data: userData } = await supabaseServiceRole
      .from('users')
      .select('carrier_id')
      .eq('id', user.id)
      .single()

    let query = supabaseServiceRole
      .from('route_costs')
      .select(`
        *,
        routes(name, carrier_id)
      `)

    // Nota: O filtro será feito após o join através da relação route_id
    // Verificar se a rota pertence à transportadora ao processar resultados

    if (routeId) query = query.eq('route_id', routeId)
    if (tripId) query = query.eq('trip_id', tripId)
    if (startDate) query = query.gte('cost_date', startDate)
    if (endDate) query = query.lte('cost_date', endDate)

    const { data, error } = await query.order('cost_date', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar custos', message: error.message },
        { status: 500 }
      )
    }

    // Filtrar apenas rotas da transportadora do usuário após buscar
    const filteredData = (data || []).filter((cost: any) => {
      if (!userData?.carrier_id) return false
      const route = cost.routes
      if (!route) return false
      return route.carrier_id === userData.carrier_id
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
    const validated = routeCostSchema.parse(body)

    // Verificar se a rota pertence à transportadora do usuário
    const { data: route } = await supabaseServiceRole
      .from('routes')
      .select('carrier_id')
      .eq('id', validated.route_id)
      .single()

    if (!route) {
      return NextResponse.json(
        { error: 'Rota não encontrada' },
        { status: 404 }
      )
    }

    const { data: userData } = await supabaseServiceRole
      .from('users')
      .select('carrier_id')
      .eq('id', user.id)
      .single()

    if (userData?.carrier_id !== route.carrier_id) {
      return NextResponse.json(
        { error: 'Acesso negado: rota não pertence à sua transportadora' },
        { status: 403 }
      )
    }

    const { data, error } = await supabaseServiceRole
      .from('route_costs')
      .insert(validated)
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

