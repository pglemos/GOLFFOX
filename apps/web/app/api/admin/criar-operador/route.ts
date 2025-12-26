import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { formatError } from '@/lib/error-utils'
import { logError, logger } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { CompanyService, type CreateCompanyData } from '@/lib/services/server/company-service'
import { UserService } from '@/lib/services/server/user-service'
import { supabaseServiceRole } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { validateWithSchema, createOperatorSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

type EmpresasUpdate = Database['public']['Tables']['empresas']['Update']

async function createOperatorHandler(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()

    // Mapear campos para o schema esperado (snake_case)
    const mappedBody = {
      ...body,
      company_name: body.companyName || body.company_name,
      company_phone: body.companyPhone || body.company_phone,
      company_email: body.companyEmail || body.company_email,
      operator_email: body.operatorEmail || body.responsibleEmail || body.operator_email,
      operator_password: body.operatorPassword || body.responsiblePassword || body.operator_password,
      operator_name: body.operatorName || body.responsibleName || body.operator_name,
      operator_phone: body.operatorPhone || body.responsiblePhone || body.operator_phone,
      address_zip_code: body.addressZipCode || body.address_zip_code || body.zip_code,
      address_street: body.addressStreet || body.address_street || body.street,
      address_number: body.addressNumber || body.address_number || body.number,
      address_neighborhood: body.addressNeighborhood || body.address_neighborhood || body.neighborhood,
      address_complement: body.addressComplement || body.address_complement || body.complement,
      address_city: body.addressCity || body.address_city || body.city,
      address_state: body.addressState || body.address_state || body.state,
    }

    const validation = validateWithSchema(createOperatorSchema, mappedBody)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const data = validation.data

    // 1. Criar empresa
    const companyData: CreateCompanyData = {
      name: data.company_name.trim(),
      cnpj: data.cnpj?.trim() || undefined,
      address: data.address || undefined,
      phone: data.company_phone?.trim() || undefined,
      email: data.company_email?.trim() || undefined,
      address_zip_code: data.address_zip_code,
      address_street: data.address_street,
      address_number: data.address_number,
      address_neighborhood: data.address_neighborhood,
      address_complement: data.address_complement,
      address_city: data.address_city,
      address_state: data.address_state,
    }

    const company = await CompanyService.createCompany(companyData)

    // Atualizar campos extras
    const extraFields: Partial<EmpresasUpdate> = {}
    if (data.state_registration) extraFields.state_registration = data.state_registration
    if (data.municipal_registration) extraFields.municipal_registration = data.municipal_registration
    if (data.website) extraFields.website = data.website

    if (Object.keys(extraFields).length > 0) {
      await supabaseServiceRole.from('empresas').update(extraFields).eq('id', company.id)
    }

    let operatorUser = null
    let userId = null

    // 2. Criar operador usando UserService
    if (data.operator_email) {
      try {
        const newUser = await UserService.createUser({
          name: data.operator_name || data.operator_email.split('@')[0],
          email: data.operator_email,
          password: data.operator_password || undefined,
          role: 'gestor_empresa',
          company_id: company.id,
          phone: data.operator_phone
        })
        userId = newUser.id
        operatorUser = newUser
      } catch (err: unknown) {
        logError('Erro ao criar usuário operador', { error: err })
      }
    }

    return successResponse({
      company_id: company.id,
      company,
      operador: operatorUser,
      userId
    }, 201)

  } catch (err) {
    logError('Erro ao criar empresa/operador', { error: err })
    return errorResponse(formatError(err, 'Erro ao criar empresa'), 500)
  }
}

export const POST = withRateLimit(createOperatorHandler, 'sensitive')
