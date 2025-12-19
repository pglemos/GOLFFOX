import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { redisCacheService, createCacheKey } from '@/lib/cache/redis-cache.service'

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
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')
    
    // ✅ Cache Redis para alertas (TTL: 5 minutos)
    const cacheKey = createCacheKey('alerts', severity || 'all', status || 'all')
    
    const cachedAlerts = await redisCacheService.get<unknown[]>(cacheKey)
    if (cachedAlerts) {
      return NextResponse.json(cachedAlerts)
    }
    
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
      logError('Erro ao buscar alertas', { error, severity, status }, 'AlertsListAPI')
      return NextResponse.json(
        { error: 'Erro ao buscar alertas', message: error.message },
        { status: 500 }
      )
    }

    const alerts = data || []
    
    // ✅ Armazenar no cache (TTL: 5 minutos - 300 segundos)
    await redisCacheService.set(cacheKey, alerts, 300)

    // Retornar array diretamente para compatibilidade
    return NextResponse.json(alerts)
  } catch (error: unknown) {
    logError('Erro ao listar alertas', { error }, 'AlertsListAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao listar alertas', message: errorMessage },
      { status: 500 }
    )
  }
}

