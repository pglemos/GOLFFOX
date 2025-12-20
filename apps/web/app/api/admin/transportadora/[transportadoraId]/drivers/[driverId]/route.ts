// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/drivers/[driverId]
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { supabaseServiceRole } from '@/lib/supabase-server'

// PUT /api/admin/transportadora/[transportadoraId]/drivers/[driverId]
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string; driverId: string }> }
) {
  // Verificar autenticação admin
  const authError = await requireAuth(req, 'admin')
  if (authError) return authError

  const params = await context.params

  try {
    const supabase = getSupabaseAdmin()
    const { transportadoraId, driverId } = params
    
    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }
    
    const body = await req.json()
    const { name, email, phone, cpf, cnh, cnh_category } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Atualizar na tabela users onde motoristas são armazenados
    const { data: motorista, error } = await supabase
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
      logError('Erro ao atualizar motorista', { error, driverId, transportadoraId }, 'TransportadoraDriverUpdateAPI')
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Invalidar cache após atualização
    await invalidateEntityCache('motorista', driverId)

    return NextResponse.json({ success: true, motorista })
  } catch (error: any) {
    logError('Erro na API de atualizar motorista', { error, driverId: params.driverId }, 'TransportadoraDriverUpdateAPI')
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/transportadora/[transportadoraId]/drivers/[driverId]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string; driverId: string }> }
) {
  const params = await context.params

  try {
    const supabase = supabaseServiceRole
    const { transportadoraId, driverId } = params
    
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
      logError('Erro ao excluir motorista', { error, driverId, transportadoraId }, 'TransportadoraDriverDeleteAPI')
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('motorista', driverId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logError('Erro na API de excluir motorista', { error, driverId: params.driverId }, 'TransportadoraDriverDeleteAPI')
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
