import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

// GET /api/admin/transportadoras/[transportadoraId]/drivers
export async function GET(
  request: NextRequest,
  { params }: { params: { transportadoraId?: string; carrierId?: string } }
) {
  try {
    const supabase = supabaseServiceRole
    const transportadoraId = params.transportadoraId || params.carrierId
    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('transportadora_id', transportadoraId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar motoristas:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, drivers })
  } catch (error: any) {
    console.error('Erro na API de motoristas:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// POST /api/admin/transportadoras/[transportadoraId]/drivers
export async function POST(
  request: NextRequest,
  { params }: { params: { transportadoraId?: string; carrierId?: string } }
) {
  try {
    const supabase = supabaseServiceRole
    const transportadoraId = params.transportadoraId || params.carrierId
    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }
    const body = await request.json()

    const { name, email, phone, cpf, cnh, cnh_category } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const { data: driver, error } = await supabase
      .from('drivers')
      .insert([
        {
          transportadora_id: transportadoraId,
          name,
          email: email || null,
          phone: phone || null,
          cpf: cpf || null,
          cnh: cnh || null,
          cnh_category: cnh_category || null,
          role: 'driver'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar motorista:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, driver })
  } catch (error: any) {
    console.error('Erro na API de criar motorista:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
