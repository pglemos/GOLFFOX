import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { validateWithSchema, routeListQuerySchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

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
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(routeListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { empresa_id, company_id: companyIdParam } = validation.data
    const companyId = empresa_id || companyIdParam

    const supabaseAdmin = getSupabaseAdmin()

    let query = supabaseAdmin
      .from('rotas')
      .select('*, empresas(id, name)')
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('empresa_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      logError('Erro ao buscar rotas', { error }, 'RoutesListAPI')
      return NextResponse.json(
        { error: 'Erro ao buscar rotas', message: error.message },
        { status: 500 }
      )
    }

    // Retornar array diretamente para compatibilidade
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    logError('Erro ao listar rotas', { error }, 'RoutesListAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao listar rotas', message: errorMessage },
      { status: 500 }
    )
  }
}

