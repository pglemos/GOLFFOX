import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper para criar cliente admin
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

// POST /api/admin/transportadoras/[transportadoraId]/vehicles
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transportadoraId?: string; carrierId?: string }> }
) {
  try {
    const { transportadoraId: tId, carrierId: cId } = await params
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

    const supabase = getSupabaseAdmin()

    const { data: vehicle, error } = await supabase
      .from('vehicles')
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
