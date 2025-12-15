import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { invalidateEntityCache } from '@/lib/next-cache'

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

    // Atualizar na tabela users onde motoristas são armazenados
    const { data: driver, error } = await supabase
      .from('users')
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
      .eq('role', 'motorista')
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar motorista:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Invalidar cache após atualização
    await invalidateEntityCache('driver', driverId)

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

    // Deletar da tabela users onde motoristas são armazenados
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', driverId)
      .eq('transportadora_id', transportadoraId)
      .eq('role', 'motorista')

    if (error) {
      console.error('Erro ao excluir motorista:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('driver', driverId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro na API de excluir motorista:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

