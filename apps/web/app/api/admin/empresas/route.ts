import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { formatError } from '@/lib/error-utils'
import { withRateLimit } from '@/lib/rate-limit'
import { CompanyService, type CompanyFilters, type CreateCompanyData } from '@/lib/services/server/company-service'
import { createCompanySchema } from '@/lib/validation/schemas'
// CQRS (opcional - pode usar diretamente o service ou via command)
// import { CreateCompanyCommand, cqrsBus } from '@/lib/cqrs'
// import '@/lib/cqrs/bus/register-handlers'

export const runtime = 'nodejs'

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
 * GET /api/admin/empresas
 * Listar empresas
 */
async function getCompaniesHandler(request: NextRequest) {
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const searchParams = request.nextUrl.searchParams

    // Filtros opcionais com suporte a paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || String((page - 1) * limit))

    const filters: CompanyFilters = {
      isActive: searchParams.get('is_active') === 'true' ? true : searchParams.get('is_active') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      limit,
      offset
    }

    const result = await CompanyService.listCompanies(filters)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (err) {
    const errorMessage = formatError(err, 'Erro ao listar empresas')
    return NextResponse.json(
      { error: 'Erro ao listar empresas', message: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/empresas
 * Criar nova empresa
 */
async function createCompanyHandler(request: NextRequest) {
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const body = await request.json()

    // Validar com Zod
    const validation = createCompanySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const company = await CompanyService.createCompany(validation.data)

    return NextResponse.json({ data: company }, { status: 201 })
  } catch (err) {
    const errorMessage = formatError(err, 'Erro ao criar empresa')
    const status = errorMessage.includes('obrigatório') || errorMessage.includes('já existe') ? 400 : 500
    return NextResponse.json(
      { error: 'Erro ao criar empresa', message: errorMessage },
      { status }
    )
  }
}

// Exportar com rate limiting
export const GET = withRateLimit(getCompaniesHandler, 'api');
export const POST = withRateLimit(createCompanyHandler, 'sensitive');