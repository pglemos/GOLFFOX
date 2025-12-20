import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logger, logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'

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
  try {
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    const carrierId = req.nextUrl.searchParams.get('id')
    if (!carrierId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verificar se a transportadora existe
    const { data: transportadora, error: carrierError } = await supabase
      .from('carriers')
      .select('id, name')
      .eq('id', carrierId)
      .single()

    if (carrierError || !transportadora) {
      return NextResponse.json(
        { success: false, error: 'Transportadora não encontrada', message: carrierError?.message },
        { status: 404 }
      )
    }

    // 1. Remover referências de users (setar transportadora_id como NULL)
    const { error: usersError } = await supabase
      .from('users')
      .update({ transportadora_id: null } as any)
      .eq('transportadora_id', carrierId)

    if (usersError) {
      logError('Erro ao atualizar users', { error: usersError, carrierId }, 'TransportadorasDeleteAPI')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao remover referências de usuários', 
          message: usersError.message,
          details: 'Não foi possível atualizar os usuários relacionados à transportadora'
        },
        { status: 500 }
      )
    }

    // 2. Remover referências de vehicles (setar transportadora_id como NULL)
    const { error: vehiclesError } = await supabase
      .from('vehicles')
      .update({ transportadora_id: null } as any)
      .eq('transportadora_id', carrierId)

    if (vehiclesError) {
      logError('Erro ao atualizar vehicles', { error: vehiclesError, carrierId }, 'TransportadorasDeleteAPI')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao remover referências de veículos', 
          message: vehiclesError.message,
          details: 'Não foi possível atualizar os veículos relacionados à transportadora'
        },
        { status: 500 }
      )
    }

    // 3. Excluir rotas relacionadas (routes.transportadora_id é NOT NULL, então precisamos excluir)
    const { error: routesError } = await supabase
      .from('routes')
      .delete()
      .eq('transportadora_id', carrierId)

    if (routesError) {
      logError('Erro ao excluir routes', { error: routesError, carrierId }, 'TransportadorasDeleteAPI')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao excluir rotas relacionadas', 
          message: routesError.message,
          details: 'Não foi possível excluir as rotas relacionadas à transportadora'
        },
        { status: 500 }
      )
    }

    // 4. Verificar se há outras tabelas com referências (ex: costs, se existir)
    try {
      // @ts-ignore - Supabase type inference issue
      const { data: costsData, error: costsCheckError } = await (supabase
        .from('costs' as any)
        .select('id')
        .eq('transportadora_id', carrierId)
        .limit(1) as any)

      // Se a tabela existir e houver registros, remover referências
      if (!costsCheckError && costsData && costsData.length > 0) {
        // @ts-ignore - Supabase type inference issue
        const { error: costsError } = await (supabase
          .from('costs' as any)
          .update({ transportadora_id: null } as any)
          .eq('transportadora_id', carrierId) as any)

        if (costsError) {
          logger.warn('Aviso ao atualizar costs (pode não existir):', costsError)
          // Não falhar se a tabela não existir ou não tiver a coluna
        }
      }
    } catch (costsError: any) {
      // Ignorar erros relacionados à tabela costs (pode não existir)
      logger.warn('Tabela costs não encontrada ou sem coluna transportadora_id, continuando...')
    }

    // 5. Agora podemos excluir a transportadora
    const { error: deleteError } = await supabase
      .from('carriers')
      .delete()
      .eq('id', carrierId)

    if (deleteError) {
      logError('Erro ao excluir transportadora', { error: deleteError, carrierId }, 'TransportadorasDeleteAPI')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao excluir transportadora', 
          message: deleteError.message,
          details: 'As referências foram removidas, mas houve erro ao excluir a transportadora'
        },
        { status: 500 }
      )
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('transportadora', carrierId)

    return NextResponse.json({
      success: true,
      message: 'Transportadora excluída com sucesso'
    })
  } catch (error: any) {
    logError('Erro ao processar exclusão de transportadora', { error, carrierId: req.nextUrl.searchParams.get('id') }, 'TransportadorasDeleteAPI')
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

