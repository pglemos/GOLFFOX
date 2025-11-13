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

export async function GET(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse && !isDevelopment) {
      return authErrorResponse
    }
    if (authErrorResponse && isDevelopment) {
      console.warn('⚠️ Autenticação falhou em desenvolvimento, mas continuando...')
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
        vehicles!gf_assistance_requests_dispatched_vehicle_id_fkey(id, plate, model),
        drivers:users!gf_assistance_requests_dispatched_driver_id_fkey(id, email)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar solicitações de socorro:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar solicitações de socorro', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      requests: data || []
    })
  } catch (error: any) {
    console.error('Erro ao listar solicitações de socorro:', error)
    return NextResponse.json(
      { error: 'Erro ao listar solicitações de socorro', message: error.message },
      { status: 500 }
    )
  }
}

