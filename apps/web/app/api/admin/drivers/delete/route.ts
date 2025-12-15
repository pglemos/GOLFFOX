import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logger } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function DELETE(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('id')

    if (!driverId) {
      return NextResponse.json(
        { error: 'ID do motorista é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Excluir permanentemente o motorista (usuário com role 'driver')
    // A tabela users tem referência a auth.users com ON DELETE CASCADE,
    // então excluir da tabela users também excluirá do Auth automaticamente
    // As foreign keys com ON DELETE CASCADE vão excluir automaticamente:
    // - gf_driver_documents (documentos do motorista)
    // - gf_driver_events (eventos do motorista)
    // - trips.driver_id tem ON DELETE SET NULL, então setamos manualmente

    logger.log(`🗑️ Tentando excluir motorista: ${driverId}`)

    // Primeiro, setar driver_id para NULL em trips (mesmo que seja SET NULL, fazemos explicitamente)
    await supabaseAdmin
      .from('trips')
      .update({ driver_id: null })
      .eq('driver_id', driverId)

    // Agora excluir o motorista
    const { data, error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', driverId)
      .eq('role', 'motorista')
      .select()

    if (error) {
      console.error('❌ Erro ao excluir motorista:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        {
          error: 'Erro ao excluir motorista',
          message: error.message,
          details: error.details || error.hint || 'Sem detalhes adicionais',
          code: error.code
        },
        { status: 500 }
      )
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('driver', driverId)

    logger.log(`✅ Motorista excluído com sucesso: ${driverId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Motorista excluído com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao excluir motorista:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir motorista', message: error.message },
      { status: 500 }
    )
  }
}

