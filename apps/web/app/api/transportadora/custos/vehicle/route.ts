import { NextRequest, NextResponse } from 'next/server'

import { requireAuth, validateAuth } from '@/lib/api-auth'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { validateWithSchema, vehicleCostSchema, vehicleCostQuerySchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

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
    const validation = validateWithSchema(vehicleCostQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { veiculo_id, vehicle_id, start_date, end_date } = validation.data
    const targetVehicleId = veiculo_id || vehicle_id

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
        veiculos(plate, model, transportadora_id)
      `)

    if (targetVehicleId) query = query.eq('veiculo_id', targetVehicleId)
    if (start_date) query = query.gte('cost_date', start_date)
    if (end_date) query = query.lte('cost_date', end_date)

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
      const veiculo = cost.veiculos
      if (!veiculo) return false
      return veiculo.transportadora_id === userData.transportadora_id
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

    // Validar corpo
    const validation = validateWithSchema(vehicleCostSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const data = validation.data

    // Verificar se o veículo pertence à transportadora do usuário
    const { data: veiculo } = await supabaseServiceRole
      .from('veiculos')
      .select('transportadora_id')
      .eq('id', data.veiculo_id)
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

    const { data: createdData, error } = await supabaseServiceRole
      .from('vehicle_costs')
      .insert({
        ...data,
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

    return NextResponse.json(createdData, { status: 201 })
  } catch (error: unknown) {
    const err = error as { message?: string }
    return NextResponse.json(
      { error: 'Erro ao processar requisição', message: err.message },
      { status: 500 }
    )
  }
}

