import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let query = supabaseAdmin
      .from('gf_assistance_requests')
      .select(`
        *,
        trips(id, route_id),
        routes(id, name),
        veiculos!gf_assistance_requests_dispatched_vehicle_id_fkey(id, plate, model),
        motoristas:users!gf_assistance_requests_dispatched_driver_id_fkey(id, email)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      logError('Erro ao buscar solicitações de socorro', { error, status }, 'AssistanceRequestsListAPI')
      return NextResponse.json(
        { error: 'Erro ao buscar solicitações de socorro', message: error.message },
        { status: 500 }
      )
    }

    // Retornar array diretamente para compatibilidade
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    logError('Erro ao listar solicitações de socorro', { error }, 'AssistanceRequestsListAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao listar solicitações de socorro', message: errorMessage },
      { status: 500 }
    )
  }
}

