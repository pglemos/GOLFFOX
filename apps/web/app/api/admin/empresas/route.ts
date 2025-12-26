import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { CreateCompanyCommand, cqrsBus } from '@/lib/cqrs'
import '@/lib/cqrs/bus/register-handlers' // Registrar handlers
import { logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { CompanyService, type CompanyFilters } from '@/lib/services/server/company-service'
import { createCompanySchema, validateWithSchema, companyListQuerySchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

// Flag para habilitar CQRS (transição gradual)
const USE_CQRS = process.env.ENABLE_CQRS === 'true'

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
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(companyListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { page = 1, limit = 20, search, isActive } = validation.data
    const offset = (page - 1) * limit

    const filters: CompanyFilters = {
      isActive,
      search,
      limit,
      offset
    }

    const result = await CompanyService.listCompanies(filters)

    return successResponse(result.data, 200, {
      count: result.count,
      limit,
      offset
    })
  } catch (err) {
    logError('Erro ao listar empresas', { error: err }, 'CompaniesAPI')
    return errorResponse(err, 500, 'Erro ao listar empresas')
  }
}

/**
 * POST /api/admin/empresas
 * Criar nova empresa
 * 
 * ✅ CQRS: Usa CreateCompanyCommand quando ENABLE_CQRS=true
 */
async function createCompanyHandler(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()

    // Validar com Zod centralizado
    const validation = validateWithSchema(createCompanySchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    let company

    if (USE_CQRS) {
      // ✅ Usar CQRS Command
      const command = new CreateCompanyCommand(validation.data)
      company = await cqrsBus.executeCommand(command)
    } else {
      // Fallback: usar CompanyService diretamente
      company = await CompanyService.createCompany(validation.data)
    }

    return successResponse(company, 201)
  } catch (err) {
    logError('Erro ao criar empresa', { error: err }, 'CompaniesAPI')
    return errorResponse(err, 500, 'Erro ao criar empresa')
  }
}

// Exportar com rate limiting
export const GET = withRateLimit(getCompaniesHandler, 'api');
export const POST = withRateLimit(createCompanyHandler, 'admin');