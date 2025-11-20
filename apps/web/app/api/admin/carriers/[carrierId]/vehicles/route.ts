import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

// POST /api/admin/carriers/[carrierId]/vehicles
export async function POST(
  request: NextRequest,
  { params }: { params: { carrierId: string } }
) {
  try {
    const supabase = supabaseServiceRole
    const { carrierId } = params
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
      .insert([
        {
          carrier_id: carrierId,
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
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar veículo:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, vehicle })
  } catch (error: any) {
    console.error('Erro na API de criar veículo:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
