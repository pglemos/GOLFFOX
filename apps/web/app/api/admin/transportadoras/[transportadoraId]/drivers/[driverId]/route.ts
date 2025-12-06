import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

// PUT /api/admin/transportadoras/[transportadoraId]/drivers/[driverId]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string; driverId: string }> }
) {
  const params = await context.params

  try {
    const supabase = supabaseServiceRole
    const transportadoraId = params.transportadoraId || params.carrierId
    const { driverId } = params
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

    // @ts-expect-error Supabase type inference issue
    const { data: driver, error } = await ((supabase
      .from('drivers')
      .update({
        name,
        email: email || null,
        phone: phone || null,
        cpf: cpf || null,
        cnh: cnh || null,
        cnh_category: cnh_category || null
      } as any) as any)
      .eq('id', driverId)
      .eq('transportadora_id', transportadoraId)
      .select()
      .single()) as any

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

// DELETE /api/admin/transportadoras/[transportadoraId]/drivers/[driverId]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string; driverId: string }> }
) {
  const params = await context.params

  try {
    const supabase = supabaseServiceRole
    const transportadoraId = params.transportadoraId || params.carrierId
    const { driverId } = params
    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    // @ts-expect-error Supabase type inference issue
    const { error } = await (supabase
      .from('drivers')
      .delete()
      .eq('id', driverId)
      .eq('transportadora_id', transportadoraId) as any)

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

