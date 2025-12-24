import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logger, logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse && !isDevelopment) {
      return authErrorResponse
    }
    if (authErrorResponse && isDevelopment) {
      logger.warn('⚠️ Autenticação falhou em desenvolvimento, mas continuando...')
    }

    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get('id')

    if (!routeId) {
      return NextResponse.json(
        { error: 'ID da rota é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    logger.log(`🗑️ Tentando excluir rota permanentemente: ${routeId}`)

    // Primeiro, buscar todos os trips relacionados para excluir dependências
    const { data: trips, error: tripsFetchError } = await supabaseAdmin
      .from('viagens')
      .select('id')
      .eq('rota_id', routeId)

    if (tripsFetchError) {
      logError('Erro ao buscar trips da rota', { error: tripsFetchError, routeId }, 'RoutesDeleteAPI')
      return NextResponse.json(
        { error: 'Erro ao buscar viagens da rota', message: tripsFetchError.message },
        { status: 500 }
      )
    }

    const tripIds = trips?.map(t => t.id) || []

    if (tripIds.length > 0) {
      logger.log(`⚠️ Encontrados ${tripIds.length} trip(s) vinculado(s) à rota. Excluindo dependências...`)

      // ORDEM CRÍTICA DE EXCLUSÃO (para evitar triggers que atualizam trip_summary):
      // 1. trip_summary PRIMEIRO (antes de qualquer trigger ser disparado)
      logger.log('   1. Excluindo trip_summary (primeiro para evitar constraint violation)...')
      const { error: tripSummaryError } = await supabaseAdmin
        .from('viagem_resumo')
        .delete()
        .in('viagem_id', tripIds)

      if (tripSummaryError) {
        // Se a tabela não existir, continuar (código 42P01 = tabela não existe)
        if (tripSummaryError.code === '42P01') {
          logger.log('   ⚠️ Tabela trip_summary não existe (OK)')
        } else {
          logError('Erro ao excluir trip_summary', { error: tripSummaryError, routeId }, 'RoutesDeleteAPI')
          return NextResponse.json(
            { error: 'Erro ao excluir resumos de viagens', message: tripSummaryError.message },
            { status: 500 }
          )
        }
      } else {
        logger.log('   ✅ Trip_summary excluído')
      }

      // 2. Excluir motorista_positions
      // NOTA: O trigger trg_driver_positions_recalc_summary tentará chamar calculate_trip_summary()
      // que faz INSERT/UPDATE em trip_summary. Como trip_summary já foi excluído acima,
      // o trigger pode falhar, mas não deve bloquear a exclusão se tratarmos o erro corretamente
      logger.log('   2. Excluindo motorista_positions...')
      const { error: positionsError } = await supabaseAdmin
        .from('motorista_positions')
        .delete()
        .in('viagem_id', tripIds)

      // Ignorar erros relacionados a trip_summary (trigger tentará atualizar mas já foi excluído)
      if (positionsError) {
        if (positionsError.code === '42P01' || positionsError.code === '42703') {
          // Tabela não existe ou coluna não existe - OK
          logger.log('   ⚠️ Tabela/coluna não existe (OK)')
        } else if (positionsError.message?.includes('trip_summary') || positionsError.code === '23503') {
          // Erro de constraint relacionado a trip_summary - esperado, continuar
          logger.log('   ⚠️ Trigger tentou atualizar trip_summary (já excluído) - continuando...')
        } else {
          // Outro erro - logar mas continuar
          logger.log(`   ⚠️ Aviso ao excluir motorista_positions: ${positionsError.message}`)
        }
      } else {
        logger.log('   ✅ Driver_positions excluído')
      }

      // 3. Outras dependências de trips
      logger.log('   3. Excluindo outras dependências de trips...')
      const dependentTables = [
        'trip_events',
        'trip_passageiros',
        'checklists',
        'passenger_reports',
        'chat_messages'
      ]

      for (const table of dependentTables) {
        const { error: depError } = await supabaseAdmin
          .from(table)
          .delete()
          .in('viagem_id', tripIds)

        if (depError) {
          // Se a tabela não existir ou não tiver a coluna, continuar
          if (depError.code !== '42P01' && depError.code !== '42703') {
            logError(`Erro ao excluir ${table}`, { error: depError, table, routeId }, 'RoutesDeleteAPI')
            return NextResponse.json(
              { error: `Erro ao excluir ${table}`, message: depError.message },
              { status: 500 }
            )
          }
        }
      }
      logger.log('   ✅ Outras dependências excluídas')

      // 4. Agora excluir os trips (todas as dependências já foram excluídas)
      logger.log('   4. Excluindo trips...')
      const { error: tripsDeleteError } = await supabaseAdmin
        .from('viagens')
        .delete()
        .eq('rota_id', routeId)

      if (tripsDeleteError) {
        logError('Erro ao excluir viagens da rota', { error: tripsDeleteError, routeId }, 'RoutesDeleteAPI')
        return NextResponse.json(
          { error: 'Erro ao excluir viagens da rota', message: tripsDeleteError.message },
          { status: 500 }
        )
      }

      logger.log(`✅ ${tripIds.length} trip(s) e suas dependências excluídos com sucesso`)
    }

    // Segundo, excluir explicitamente paradas da rota (route_stops)
    const { error: stopsDeleteError } = await supabaseAdmin
      .from('gf_rota_plano')
      .delete()
      .eq('rota_id', routeId)

    if (stopsDeleteError) {
      logError('Erro ao excluir paradas da rota', { error: stopsDeleteError, routeId }, 'RoutesDeleteAPI')
      return NextResponse.json(
        { error: 'Erro ao excluir paradas da rota', message: stopsDeleteError.message },
        { status: 500 }
      )
    }

    // Terceiro, excluir permanentemente a rota
    const { data, error } = await supabaseAdmin
      .from('rotas')
      .delete()
      .eq('id', routeId)
      .select()

    if (error) {
      logError('Erro ao excluir rota', { error, routeId, errorDetails: JSON.stringify(error, null, 2) }, 'RoutesDeleteAPI')
      return NextResponse.json(
        {
          error: 'Erro ao excluir rota',
          message: error.message,
          details: error.details || error.hint || 'Sem detalhes adicionais',
          code: error.code
        },
        { status: 500 }
      )
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('route', routeId)

    logger.log(`✅ Rota excluída com sucesso: ${routeId}`, data)

    return NextResponse.json({ success: true, message: 'Rota excluída com sucesso' })
  } catch (error: any) {
    logError('Erro ao excluir rota', { error, routeId: request.nextUrl.searchParams.get('id') }, 'RoutesDeleteAPI')
    return NextResponse.json(
      { error: 'Erro ao excluir rota', message: error.message },
      { status: 500 }
    )
  }
}

