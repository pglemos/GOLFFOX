import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

// PUT /api/admin/drivers/[driverId] - Editar motorista
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  try {
    const supabase = supabaseServiceRole
    const { driverId } = await context.params
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

    // Atualizar motorista
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .update({
        name,
        email: email || null,
        phone: phone || null,
        transportadora_id: transportadoraId || null,
        cpf: cpf || null,
        cnh: cnh || null,
        cnh_category: cnh_category || null,
        cnh_expiry: cnh_expiry || null,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', driverId)
      .select()
      .single()

    if (driverError) {
      console.error('Erro ao atualizar motorista:', driverError)
      return NextResponse.json(
        { success: false, error: driverError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, driver })
  } catch (error: any) {
    console.error('Erro na API de atualizar motorista:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// GET /api/admin/drivers/[driverId] - Obter motorista específico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ driverId: string }> }
) {
  try {
    const supabase = supabaseServiceRole
    const { driverId } = await context.params

    const { data: driver, error } = await supabase
      .from('drivers')
      .select('*, carriers!inner(name)')
      .eq('id', driverId)
      .single()

    if (error) {
      console.error('Erro ao buscar motorista:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, driver })
  } catch (error: any) {
    console.error('Erro na API de buscar motorista:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

