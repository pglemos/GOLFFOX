import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

// PUT /api/admin/transportadoras/[transportadoraId]/vehicles/[vehicleId]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string; vehicleId: string }> }
) {
  const params = await context.params

  try {
    const supabase = supabaseServiceRole
    const transportadoraId = params.transportadoraId || params.carrierId
    const { vehicleId } = params
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
      vehicle_type,
      renavam,
      chassis
    } = body

    if (!plate) {
      return NextResponse.json(
        { success: false, error: 'Placa é obrigatória' },
        { status: 400 }
      )
    }

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({
        plate,
        prefix: prefix || null,
        manufacturer: manufacturer || null,
        model: model || null,
        year: year || null,
        capacity: capacity || null,
        is_active: is_active ?? true,
        vehicle_type: vehicle_type || 'bus',
        renavam: renavam || null,
        chassis: chassis || null
      })
      .eq('id', vehicleId)
      .eq('transportadora_id', transportadoraId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar veículo:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, vehicle })
  } catch (error: any) {
    console.error('Erro na API de atualizar veículo:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/transportadoras/[transportadoraId]/vehicles/[vehicleId]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string; vehicleId: string }> }
) {
  const params = await context.params

  try {
    const supabase = supabaseServiceRole
    const transportadoraId = params.transportadoraId || params.carrierId
    const { vehicleId } = params
    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('transportadora_id', transportadoraId)

    if (error) {
      console.error('Erro ao excluir veículo:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro na API de excluir veículo:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

