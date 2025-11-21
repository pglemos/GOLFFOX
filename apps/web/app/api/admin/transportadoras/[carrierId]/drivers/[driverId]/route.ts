import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

// PUT /api/admin/carriers/[carrierId]/drivers/[driverId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { transportadoraId: string; driverId: string } }
) {
  try {
    const supabase = supabaseServiceRole
    const transportadoraId = params.transportadoraId
    const { driverId } = params
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
      .update({
        name,
        email: email || null,
        phone: phone || null,
        cpf: cpf || null,
        cnh: cnh || null,
        cnh_category: cnh_category || null
      })
      .eq('id', driverId)
      .eq('transportadora_id', transportadoraId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar motorista:', error)
      return NextResponse.json(
        { success: false, error: error.message },
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

// DELETE /api/admin/carriers/[carrierId]/drivers/[driverId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { transportadoraId: string; driverId: string } }
) {
  try {
    const supabase = supabaseServiceRole
    const transportadoraId = params.transportadoraId
    const { driverId } = params

    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', driverId)
      .eq('transportadora_id', transportadoraId)

    if (error) {
      console.error('Erro ao excluir motorista:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro na API de excluir motorista:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

