import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireCompanyAccess } from '@/lib/api-auth'
import { z } from 'zod'

const costSchema = z.object({
  company_id: z.string().uuid(),
  carrier_id: z.string().uuid().optional().nullable(),
  route_id: z.string().uuid().optional().nullable(),
  vehicle_id: z.string().uuid().optional().nullable(),
  driver_id: z.string().uuid().optional().nullable(),
  cost_category_id: z.string().uuid(),
  cost_center_id: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(0),
  qty: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  currency: z.string().default('BRL'),
  notes: z.string().optional().nullable(),
  source: z.enum(['manual', 'import', 'invoice', 'calc']).default('manual')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = costSchema.parse(body)

    // ✅ Validar autenticação e acesso à empresa
    const { user, error: authError } = await requireCompanyAccess(request, validated.company_id)
    if (authError) {
      return authError
    }

    // Verificar se categoria existe e está ativa
    const { data: category, error: categoryError } = await supabaseServiceRole
      .from('gf_cost_categories')
      .select('id, is_active')
      .eq('id', validated.cost_category_id)
      .single()

    if (categoryError || !category || !category.is_active) {
      return NextResponse.json(
        { error: 'Categoria de custo inválida ou inativa' },
        { status: 400 }
      )
    }

    // Inserir custo
    const { data, error } = await supabaseServiceRole
      .from('gf_costs')
      .insert({
        ...validated,
        created_by: request.headers.get('x-user-id') || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar custo:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao criar custo:', error)
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    // ✅ Validar autenticação e acesso à empresa
    const { user, error: authError } = await requireCompanyAccess(request, companyId)
    if (authError) {
      return authError
    }
    const routeId = searchParams.get('route_id')
    const vehicleId = searchParams.get('vehicle_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const categoryId = searchParams.get('category_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseServiceRole
      .from('v_costs_secure')
      .select('*')
      .eq('company_id', companyId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (routeId) {
      query = query.eq('route_id', routeId)
    }
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    if (categoryId) {
      query = query.eq('cost_category_id', categoryId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar custos:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Erro ao buscar custos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

