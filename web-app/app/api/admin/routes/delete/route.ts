import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

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
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse && !isDevelopment) {
      return authErrorResponse
    }
    if (authErrorResponse && isDevelopment) {
      console.warn('⚠️ Autenticação falhou em desenvolvimento, mas continuando...')
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

    console.log(`🗑️ Tentando excluir rota: ${routeId}`)

    // Verificar se existem trips vinculadas à rota
    const { count: tripsCount, error: tripsCountError } = await supabaseAdmin
      .from('trips')
      .select('id', { head: true, count: 'exact' })
      .eq('route_id', routeId)

    if (tripsCountError) {
      console.error('❌ Erro ao verificar viagens vinculadas à rota:', tripsCountError)
      return NextResponse.json(
        { error: 'Erro ao verificar viagens vinculadas', message: tripsCountError.message },
        { status: 500 }
      )
    }

    if ((tripsCount ?? 0) > 0) {
      // Se houver trips, arquivar rota (marcar como inativa) em vez de excluir
      const { error: archiveError } = await supabaseAdmin
        .from('routes')
        .update({ is_active: false })
        .eq('id', routeId)

      if (archiveError) {
        console.error('❌ Erro ao arquivar rota com trips vinculadas:', archiveError)
        return NextResponse.json(
          { error: 'Erro ao arquivar rota', message: archiveError.message, tripsCount },
          { status: 500 }
        )
      }

      console.log(`🚩 Rota arquivada por possuir ${tripsCount} viagem(ns) vinculada(s): ${routeId}`)
      return NextResponse.json({ success: true, archived: true, tripsCount }, { status: 200 })
    }

    // Primeiro, excluir explicitamente paradas da rota (route_stops)
    const { error: stopsDeleteError } = await supabaseAdmin
      .from('route_stops')
      .delete()
      .eq('route_id', routeId)

    if (stopsDeleteError) {
      console.error('❌ Erro ao excluir paradas da rota:', stopsDeleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir paradas da rota', message: stopsDeleteError.message },
        { status: 500 }
      )
    }

    // Excluir trips relacionadas (por segurança, embora não deva existir aqui)
    const { error: tripsDeleteError } = await supabaseAdmin
      .from('trips')
      .delete()
      .eq('route_id', routeId)

    if (tripsDeleteError) {
      console.error('❌ Erro ao excluir viagens da rota:', tripsDeleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir viagens da rota', message: tripsDeleteError.message },
        { status: 500 }
      )
    }

    // Excluir permanentemente a rota
    const { data, error } = await supabaseAdmin
      .from('routes')
      .delete()
      .eq('id', routeId)
      .select()

    if (error) {
      console.error('❌ Erro ao excluir rota:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
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

    console.log(`✅ Rota excluída com sucesso: ${routeId}`, data)

    return NextResponse.json({ success: true, message: 'Rota excluída com sucesso' })
  } catch (error: any) {
    console.error('Erro ao excluir rota:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir rota', message: error.message },
      { status: 500 }
    )
  }
}

