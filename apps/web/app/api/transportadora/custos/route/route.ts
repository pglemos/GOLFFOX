import { NextRequest, NextResponse } from 'next/server'

import { requireAuth, validateAuth } from '@/lib/api-auth'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { validateWithSchema, routeCostSchema, routeCostQuerySchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'
import type { Database } from '@/types/supabase'

type RotasRow = Database['public']['Tables']['rotas']['Row']

export const runtime = 'nodejs'

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
    const authErrorResponse = await requireAuth(req, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    const user = await validateAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(routeCostQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { rota_id, route_id, viagem_id, trip_id, start_date, end_date } = validation.data
    const targetRouteId = rota_id || route_id
    const targetTripId = viagem_id || trip_id

    // Buscar transportadora_id do usuário
    const { data: userData } = await supabaseServiceRole
      .from('users')
      .select('transportadora_id')
      .eq('id', user.id)
      .single()

    let query = supabaseServiceRole
      .from('rota_custos')
      .select(`
        *,
        rotas(name, transportadora_id)
      `)

    if (targetRouteId) query = query.eq('rota_id', targetRouteId)
    if (targetTripId) query = query.eq('viagem_id', targetTripId)
    if (start_date) query = query.gte('cost_date', start_date)
    if (end_date) query = query.lte('cost_date', end_date)

    const { data, error } = await query.order('cost_date', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar custos', message: error.message },
        { status: 500 }
      )
    }

    // Filtrar apenas rotas da transportadora do usuário após buscar
    const filteredData = (data || []).filter((cost: any) => {
      if (!userData?.transportadora_id) return false
      const route = cost.rotas
      if (!route) return false
      return route.transportadora_id === userData.transportadora_id
    })

    return NextResponse.json(filteredData)
  } catch (error: unknown) {
    const err = error as { message?: string }
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: err.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(req, 'gestor_transportadora')
    if (authErrorResponse) return authErrorResponse

    const user = await validateAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()

    // Suporte a cammelCase fallback antes do Zod
    const normalizedBody = {
      ...body,
      rota_id: body.rota_id || body.route_id,
      viagem_id: body.viagem_id || body.trip_id
    }

    // Validar corpo
    const validation = validateWithSchema(routeCostSchema, normalizedBody)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const data = validation.data

    // Verificar se a rota pertence à transportadora do usuário
    const { data: route } = await supabaseServiceRole
      .from('rotas')
      .select('transportadora_id')
      .eq('id', data.rota_id)
      .single()

    if (!route) {
      return NextResponse.json(
        { error: 'Rota não encontrada' },
        { status: 404 }
      )
    }

    const { data: userData } = await supabaseServiceRole
      .from('users')
      .select('transportadora_id')
      .eq('id', user.id)
      .single()

    if (userData?.transportadora_id !== route.transportadora_id) {
      return NextResponse.json(
        { error: 'Acesso negado: rota não pertence à sua transportadora' },
        { status: 403 }
      )
    }

    const { data: createdData, error } = await supabaseServiceRole
      .from('rota_custos')
      .insert(data)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao criar custo', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(createdData, { status: 201 })
  } catch (error: unknown) {
    const err = error as { message?: string }
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: err.message },
      { status: 500 }
    )
  }
}

