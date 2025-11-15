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
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')
    
    let query = supabaseAdmin
      .from('gf_incidents')
      .select(`
        *,
        companies(name),
        routes(name),
        vehicles(plate),
        drivers:users!gf_incidents_driver_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar alertas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar alertas', message: error.message },
        { status: 500 }
      )
    }

    // Retornar array diretamente para compatibilidade
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Erro ao listar alertas:', error)
    return NextResponse.json(
      { error: 'Erro ao listar alertas', message: error.message },
      { status: 500 }
    )
  }
}

