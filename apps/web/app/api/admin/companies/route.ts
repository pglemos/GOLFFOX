import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { withRateLimit } from '@/lib/rate-limit'

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
 * GET /api/admin/companies
 * Listar empresas
 */
async function getCompaniesHandler(request: NextRequest) {
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    
    // Filtros opcionais
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin.from('companies').select('*', { count: 'exact' })

    // Aplicar filtros
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,cnpj.ilike.%${search}%`)
    }

    // Paginação
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar empresas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar empresas', message: error.message },
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
    console.error('Erro ao listar empresas:', error)
    return NextResponse.json(
      { error: 'Erro ao listar empresas', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/companies
 * Criar nova empresa
 */
async function createCompanyHandler(request: NextRequest) {
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Validação de campos obrigatórios
    const { name, cnpj, address, phone, email } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      )
    }

    // Validar CNPJ único se fornecido
    if (cnpj) {
      const { data: existingCompany } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('cnpj', cnpj)
        .single()

      if (existingCompany) {
        return NextResponse.json(
          { error: 'Uma empresa com este CNPJ já existe' },
          { status: 400 }
        )
      }
    }

    // Criar empresa
    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert([
        {
          name: name.trim(),
          cnpj: cnpj?.trim() || null,
          address: address?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar empresa:', error)
      return NextResponse.json(
        { error: 'Erro ao criar empresa', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao criar empresa', message: error.message },
      { status: 500 }
    )
  }
}

// Exportar com rate limiting
export const GET = withRateLimit(getCompaniesHandler, 'api');
export const POST = withRateLimit(createCompanyHandler, 'sensitive');