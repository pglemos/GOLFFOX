import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logger, logError } from '@/lib/logger'
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
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json(
        { error: 'ID do alerta é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    logger.log(`🗑️ Tentando excluir alerta: ${alertId}`)
    
    const { data, error } = await supabaseAdmin
      .from('gf_incidents')
      .delete()
      .eq('id', alertId)
      .select()

    if (error) {
      logError('Erro ao excluir alerta', { error, alertId, errorDetails: JSON.stringify(error, null, 2) }, 'AlertsDeleteAPI')
      return NextResponse.json(
        { 
          error: 'Erro ao excluir alerta', 
          message: error.message,
          details: error.details || error.hint || 'Sem detalhes adicionais',
          code: error.code
        },
        { status: 500 }
      )
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('alert', alertId)

    logger.log(`✅ Alerta excluído com sucesso: ${alertId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Alerta excluído com sucesso'
    })
  } catch (error: any) {
    logError('Erro ao excluir alerta', { error, alertId: request.nextUrl.searchParams.get('id') }, 'AlertsDeleteAPI')
    return NextResponse.json(
      { error: 'Erro ao excluir alerta', message: error.message },
      { status: 500 }
    )
  }
}

