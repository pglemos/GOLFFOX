import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { GetCompanyQuery, cqrsBus } from '@/lib/cqrs'
import '@/lib/cqrs/bus/register-handlers' // Registrar handlers
import { logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { CompanyService } from '@/lib/services/server/company-service'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validateWithSchema, updateCompanySchema, uuidSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

// Flag para habilitar CQRS (transição gradual)
const USE_CQRS = process.env.ENABLE_CQRS === 'true'

/**
 * GET /api/admin/empresas/[companyId]
 * Obter empresa por ID
 * 
 * ✅ CQRS: Usa GetCompanyQuery quando ENABLE_CQRS=true
 */
async function getCompanyHandler(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const params = await context.params
  const { companyId } = params

  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    // Validar ID
    const idValidation = uuidSchema.safeParse(companyId)
    if (!idValidation.success) {
      return validationErrorResponse('ID da empresa inválido')
    }

    if (USE_CQRS) {
      // ✅ Usar CQRS Query
      const query = new GetCompanyQuery(companyId)
      const result = await cqrsBus.executeQuery(query) as {
        success: boolean
        company?: any
        error?: string
      }

      if (!result.success) {
        return errorResponse(result.error || 'Empresa não encontrada', 404, 'Empresa não encontrada')
      }

      return successResponse(result.company, 200)
    }

    // Fallback: usar CompanyService diretamente
    const company = await CompanyService.getCompanyById(companyId)

    if (!company) {
      return errorResponse('Empresa não encontrada', 404)
    }

    return successResponse(company, 200)
  } catch (err: unknown) {
    logError('Erro ao buscar empresa', { error: err, companyId }, 'CompaniesGetAPI')
    return errorResponse(err, 500, 'Erro ao buscar empresa')
  }
}

/**
 * PUT /api/admin/empresas/[companyId]
 * Atualizar empresa
 */
async function updateCompanyHandler(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const params = await context.params
  const { companyId } = params

  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    // Validar ID
    const idValidation = uuidSchema.safeParse(companyId)
    if (!idValidation.success) {
      return validationErrorResponse('ID da empresa inválido')
    }

    const body = await request.json()

    // Mapear campos camelCase para snake_case antes da validação
    const mappedBody = {
      ...body,
      address_city: body.address_city || body.addressCity || body.city,
      address_state: body.address_state || body.addressState || body.state,
      address_zip_code: body.address_zip_code || body.addressZipCode || body.zip_code,
      address_street: body.address_street || body.addressStreet || body.street,
      address_number: body.address_number || body.addressNumber || body.number,
      address_neighborhood: body.address_neighborhood || body.addressNeighborhood || body.neighborhood,
      address_complement: body.address_complement || body.addressComplement || body.complement,
    }

    // Validar corpo
    const validation = validateWithSchema(updateCompanySchema, mappedBody)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const validatedData = validation.data

    // Delegar para o serviço
    const updatedCompany = await CompanyService.updateCompany(companyId, validatedData)

    return successResponse(updatedCompany, 200, { message: 'Empresa atualizada com sucesso' })
  } catch (err: unknown) {
    logError('Erro ao atualizar empresa', { error: err, companyId }, 'CompaniesUpdateAPI')
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    const status = message.includes('obrigatório') || message.includes('inválido') || message.includes('já existe') ? 400 : 500

    return errorResponse(message, status, 'Erro ao atualizar empresa')
  }
}

/**
 * DELETE /api/admin/empresas/[companyId]
 * Excluir empresa (soft delete se tiver dependências)
 */
async function deleteCompanyHandler(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const params = await context.params
  const { companyId } = params

  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    // Validar ID
    const idValidation = uuidSchema.safeParse(companyId)
    if (!idValidation.success) {
      return validationErrorResponse('ID da empresa inválido')
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verificar se empresa existe
    const { data: existingCompany, error: fetchError } = await supabaseAdmin
      .from('empresas')
      .select('id')
      .eq('id', companyId)
      .single()

    if (fetchError || !existingCompany) {
      return errorResponse('Empresa não encontrada', 404)
    }

    // Verificar dependências
    const { count: usersCount } = await supabaseAdmin
      .from('users')
      .select('id', { head: true, count: 'exact' })
      .eq('company_id', companyId)

    const { count: vehiclesCount } = await supabaseAdmin
      .from('veiculos')
      .select('id', { head: true, count: 'exact' })
      .eq('company_id', companyId)

    const { count: routesCount } = await supabaseAdmin
      .from('rotas')
      .select('id', { head: true, count: 'exact' })
      .eq('company_id', companyId)

    const totalDependencies = (usersCount || 0) + (vehiclesCount || 0) + (routesCount || 0)

    if (totalDependencies > 0) {
      // Soft delete se tiver dependências
      await CompanyService.updateCompany(companyId, { is_active: false })

      return successResponse(null, 200, {
        archived: true,
        message: 'Empresa arquivada (soft delete) devido a dependências',
        dependencies: {
          users: usersCount || 0,
          veiculos: vehiclesCount || 0,
          routes: routesCount || 0
        }
      })
    } else {
      // Hard delete se não tiver dependências
      await CompanyService.deleteCompany(companyId, true)

      return successResponse(null, 200, {
        deleted: true,
        message: 'Empresa excluída com sucesso'
      })
    }
  } catch (error: unknown) {
    logError('Erro ao excluir empresa', { error, companyId }, 'CompaniesDeleteAPI')
    return errorResponse(error, 500, 'Erro ao excluir empresa')
  }
}

// Exportar com rate limiting
export const GET = async (req: NextRequest, ctx: { params: Promise<{ companyId: string }> }) =>
  withRateLimit(() => getCompanyHandler(req, ctx), 'api')(req)

export const PUT = async (req: NextRequest, ctx: { params: Promise<{ companyId: string }> }) =>
  withRateLimit(() => updateCompanyHandler(req, ctx), 'admin')(req)

export const DELETE = async (req: NextRequest, ctx: { params: Promise<{ companyId: string }> }) =>
  withRateLimit(() => deleteCompanyHandler(req, ctx), 'sensitive')(req)
