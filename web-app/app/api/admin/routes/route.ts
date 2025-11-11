import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey)
}

// OPTIONS handler para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * POST /api/admin/routes
 * Criar nova rota (endpoint mínimo para testes)
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Aceitar tanto snake_case quanto camelCase
    const name = body?.name || body?.route_name || 'Rota Teste'
    const companyId = body?.company_id || body?.companyId
    const origin = body?.origin || body?.origin_address || 'Origem'
    const destination = body?.destination || body?.destination_address || 'Destino'

    // Se não tem companyId, buscar primeira empresa ativa
    let finalCompanyId = companyId
    if (!finalCompanyId) {
      const { data: companies } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('is_active', true)
        .limit(1)
      
      if (companies && companies.length > 0) {
        finalCompanyId = companies[0].id
      } else {
        return NextResponse.json(
          { error: 'Nenhuma empresa ativa encontrada. Crie uma empresa primeiro ou forneça company_id' },
          { status: 400 }
        )
      }
    }

    // Criar rota - tentar inserir com destination, se falhar, tentar sem
    const routeData: Record<string, any> = {
      name: name,
      company_id: finalCompanyId,
      is_active: true
    }
    
    // Adicionar origin e destination apenas se a coluna existir (tentar com ambos primeiro)
    // Se a coluna destination não existir, o Supabase retornará erro, então tentaremos sem ela
    try {
      routeData.origin = origin
      routeData.destination = destination
    } catch (e) {
      // Ignorar erro ao adicionar campos
    }

    // Campos opcionais
    if (body.carrier_id || body.carrierId) {
      routeData.carrier_id = body.carrier_id || body.carrierId
    }
    if (body.distance !== undefined) {
      routeData.distance = body.distance
    }
    if (body.estimated_duration !== undefined || body.estimatedDuration !== undefined) {
      routeData.estimated_duration = body.estimated_duration || body.estimatedDuration
    }

    let { data: newRoute, error: createError } = await supabaseAdmin
      .from('routes')
      .insert(routeData)
      .select()
      .single()

    // Se erro por coluna destination não existir, tentar sem destination
    if (createError && (createError.message?.includes('destination') || createError.code === 'PGRST204')) {
      console.warn('⚠️ Coluna destination não existe, tentando criar rota sem destination')
      const routeDataWithoutDestination: Record<string, any> = {
        name: name,
        company_id: finalCompanyId,
        is_active: true
      }
      
      // Tentar adicionar origin se a coluna existir
      if (origin) {
        routeDataWithoutDestination.origin = origin
      }
      
      const result = await supabaseAdmin
        .from('routes')
        .insert(routeDataWithoutDestination)
        .select()
        .single()
      
      newRoute = result.data
      createError = result.error
    }

    if (createError) {
      console.error('Erro ao criar rota:', createError)
      return NextResponse.json(
        { 
          error: 'Erro ao criar rota',
          message: createError.message || 'Erro desconhecido ao criar rota',
          details: process.env.NODE_ENV === 'development' ? createError : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      route: newRoute,
      id: newRoute.id
    }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar rota:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao criar rota',
        message: error.message || 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/routes
 * Listar rotas
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    
    const companyId = searchParams.get('company_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin.from('routes').select('*', { count: 'exact' })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar rotas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar rotas', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Erro ao listar rotas:', error)
    return NextResponse.json(
      { error: 'Erro ao listar rotas', message: error.message },
      { status: 500 }
    )
  }
}

