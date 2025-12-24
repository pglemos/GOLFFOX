import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api-response'
import { logger, logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function DELETE(req: NextRequest) {
  let carrierId: string | null = null
  try {
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    carrierId = req.nextUrl.searchParams.get('id')
    if (!carrierId) {
      return validationErrorResponse('ID da transportadora não fornecido')
    }

    const supabase = getSupabaseAdmin()

    // Verificar se a transportadora existe
    const { data: transportadora, error: carrierError } = await (supabase
      .from('transportadoras' as any)
      .select('id, name')
      .eq('id', carrierId)
      .single())

    if (carrierError || !transportadora) {
      return notFoundResponse('Transportadora não encontrada')
    }

    // 1. Remover referências de users (setar transportadora_id como NULL)
    const { error: usersError } = await supabase
      .from('users')
      .update({ transportadora_id: null } as any)
      .eq('transportadora_id', carrierId)

    if (usersError) {
      logError('Erro ao atualizar users', { error: usersError, carrierId }, 'TransportadorasDeleteAPI')
      return errorResponse(usersError, 500, 'Erro ao remover referências de usuários')
    }

    // 2. Remover referências de veiculos (setar transportadora_id como NULL)
    const { error: vehiclesError } = await supabase
      .from('veiculos')
      .update({ transportadora_id: null } as any)
      .eq('transportadora_id', carrierId)

    if (vehiclesError) {
      logError('Erro ao atualizar veiculos', { error: vehiclesError, carrierId }, 'TransportadorasDeleteAPI')
      return errorResponse(vehiclesError, 500, 'Erro ao remover referências de veículos')
    }

    // 3. Excluir rotas relacionadas
    const { error: routesError } = await supabase
      .from('rotas')
      .delete()
      .eq('transportadora_id', carrierId)

    if (routesError) {
      logError('Erro ao excluir routes', { error: routesError, carrierId }, 'TransportadorasDeleteAPI')
      return errorResponse(routesError, 500, 'Erro ao excluir rotas relacionadas')
    }

    // 4. Verificar se há outras tabelas com referências
    try {
      const { data: costsData, error: costsCheckError } = await (supabase
        .from('costs' as any)
        .select('id')
        .eq('transportadora_id', carrierId)
        .limit(1) as any)

      if (!costsCheckError && costsData && costsData.length > 0) {
        await supabase
          .from('costs' as any)
          .update({ transportadora_id: null } as any)
          .eq('transportadora_id', carrierId)
      }
    } catch (costsError: any) {
      logger.warn('Tabela costs não encontrada ou sem coluna transportadora_id, continuando...')
    }

    // 5. Agora podemos excluir a transportadora
    const { error: deleteError } = await (supabase
      .from('transportadoras' as any)
      .delete()
      .eq('id', carrierId))

    if (deleteError) {
      logError('Erro ao excluir transportadora', { error: deleteError, carrierId }, 'TransportadorasDeleteAPI')
      return errorResponse(deleteError, 500, 'Erro ao excluir transportadora')
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('gestor_transportadora', carrierId)

    return successResponse({ message: 'Transportadora excluída com sucesso' })
  } catch (error: any) {
    logError('Erro ao processar exclusão de transportadora', { error, carrierId }, 'TransportadorasDeleteAPI')
    return errorResponse(error, 500, 'Erro ao processar requisição')
  }
}

