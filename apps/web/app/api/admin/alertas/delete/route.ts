import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logger, logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { createCacheKey, redisCacheService } from '@/lib/cache/redis-cache.service'
import { validateWithSchema, idQuerySchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

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
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(idQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { id: alertId } = validation.data
    const supabaseAdmin = getSupabaseAdmin()

    logger.log(`🗑️ Tentando excluir alerta: ${alertId}`)

    // Atualizado para usar gf_alerts
    const { data, error } = await supabaseAdmin
      .from('gf_alerts')
      .delete()
      .eq('id', alertId)
      .select()

    if (error) {
      logError('Erro ao excluir alerta', { error, alertId }, 'AlertsDeleteAPI')
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
    await redisCacheService.del(createCacheKey('alerts_v4', 'all', 'all'))
    await invalidateEntityCache('alert', alertId)

    logger.log(`✅ Alerta excluído com sucesso: ${alertId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Alerta excluído com sucesso'
    })
  } catch (error: unknown) {
    logError('Erro ao excluir alerta', { error }, 'AlertsDeleteAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao excluir alerta', message: errorMessage },
      { status: 500 }
    )
  }
}
