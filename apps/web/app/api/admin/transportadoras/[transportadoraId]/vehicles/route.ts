import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

// GET /api/admin/transportadoras/[transportadoraId]/veiculos
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string }> }
) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError

  const params = await context.params

  try {
    const { transportadoraId: tId, carrierId: cId } = params
    const transportadoraId = tId || cId

    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar veículos da transportadora
    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('transportadora_id', transportadoraId)
      .order('created_at', { ascending: false })

    if (error) {
      logError('Erro ao buscar veículos', { error, transportadoraId }, 'TransportadoraVehiclesAPI')
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, veiculos: veiculos || [] })
  } catch (err) {
    logError('Erro na API de veículos', { error: err, transportadoraId: (await context.params).transportadoraId || (await context.params).carrierId }, 'TransportadoraVehiclesAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// POST /api/admin/transportadoras/[transportadoraId]/veiculos
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string }> }
) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError

  const params = await context.params

  try {
    const { transportadoraId: tId, carrierId: cId  } = params
    const transportadoraId = tId || cId

    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }
    const body = await request.json()

    const {
      plate,
      prefix,
      manufacturer,
      model,
      year,
      capacity,
      is_active,
      veiculo_type,
      renavam,
      chassis
    } = body

    if (!plate) {
      return NextResponse.json(
        { success: false, error: 'Placa é obrigatória' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: veiculo, error } = await supabase
      .from('veiculos')
      .insert([
        {
          transportadora_id: transportadoraId,
          plate,
          prefix: prefix || null,
          manufacturer: manufacturer || null,
          model: model || null,
          year: year || null,
          capacity: capacity || null,
          is_active: is_active ?? true,
          veiculo_type: veiculo_type || 'bus',
          renavam: renavam || null,
          chassis: chassis || null
        }
      ])
      .select()
      .single()

    if (error) {
      logError('Erro ao criar veículo', { error, transportadoraId }, 'TransportadoraVehiclesAPI')
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, veiculo })
  } catch (error: any) {
    logError('Erro na API de criar veículo', { error, transportadoraId: (await context.params).transportadoraId || (await context.params).carrierId }, 'TransportadoraVehiclesAPI')
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
