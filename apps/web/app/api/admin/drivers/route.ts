import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

// POST /api/admin/drivers - Criar motorista
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServiceRole
    const body = await request.json()

    const {
      name,
      email,
      phone,
      transportadora_id,
      carrier_id, // Compatibilidade
      cpf,
      cnh,
      cnh_category,
      cnh_expiry,
      is_active
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const transportadoraId = transportadora_id || carrier_id // Compatibilidade
    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'Transportadora é obrigatória' },
        { status: 400 }
      )
    }

    // Criar motorista
    // @ts-ignore - Supabase type inference issue
    const { data: driver, error: driverError } = await ((supabase
      .from('drivers')
      .insert([
        {
          name,
          email: email || null,
          phone: phone || null,
          transportadora_id: transportadoraId,
          cpf: cpf || null,
          cnh: cnh || null,
          cnh_category: cnh_category || null,
          cnh_expiry: cnh_expiry || null,
          is_active: is_active ?? true,
          role: 'driver'
        }
      ] as any) as any)
      .select()
      .single()) as any

    if (driverError) {
      console.error('Erro ao criar motorista:', driverError)
      return NextResponse.json(
        { success: false, error: driverError.message },
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

