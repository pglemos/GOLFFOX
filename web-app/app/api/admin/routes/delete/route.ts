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

    // Excluir permanentemente a rota e todos os dados relacionados
    // As foreign keys com ON DELETE CASCADE vão excluir automaticamente:
    // - route_stops (paradas da rota) - ON DELETE CASCADE
    // - trips (viagens relacionadas) - ON DELETE CASCADE
    // - gf_route_plan (planos de rota) - ON DELETE CASCADE
    // - gf_route_optimization_cache (cache de otimização) - ON DELETE CASCADE
    
    console.log(`🗑️ Tentando excluir rota: ${routeId}`)
    
    // Primeiro, excluir explicitamente paradas da rota (route_stops)
    await supabaseAdmin
      .from('route_stops')
      .delete()
      .eq('route_id', routeId)

    // Excluir trips relacionados (mesmo que seja CASCADE, fazemos explicitamente para garantir)
    await supabaseAdmin
      .from('trips')
      .delete()
      .eq('route_id', routeId)

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

    return NextResponse.json({
      success: true,
      message: 'Rota excluída com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao excluir rota:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir rota', message: error.message },
      { status: 500 }
    )
  }
}

