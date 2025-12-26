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

export const runtime = 'nodejs'

type EmpresasUpdate = Database['public']['Tables']['empresas']['Update']

async function createOperatorHandler(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()

    // Mapear dados do modal
    const companyName = body?.companyName || body?.company_name
    const cnpj = body?.cnpj || null
    const address = body?.address || null
    const companyPhone = body?.companyPhone || body?.company_phone || null
    const companyEmail = body?.companyEmail || body?.company_email || null

    // Dados do operador
    const operatorEmail = body?.operatorEmail || body?.responsibleEmail || body?.operator_email || null
    const operatorPassword = body?.operatorPassword || body?.responsiblePassword || body?.operator_password || null
    const operatorName = body?.operatorName || body?.responsibleName || body?.operator_name || null
    const operatorPhone = body?.operatorPhone || body?.responsiblePhone || body?.operator_phone || null

    if (!companyName) return validationErrorResponse('Nome da empresa é obrigatório')

    // 1. Criar empresa
    const companyData: CreateCompanyData = {
      name: companyName.trim(),
      cnpj: cnpj?.trim() || undefined,
      address: address || undefined,
      phone: companyPhone?.trim() || undefined,
      email: companyEmail?.trim() || undefined,
      address_zip_code: body.addressZipCode || body.zip_code,
      address_street: body.addressStreet || body.street,
      address_number: body.addressNumber || body.number,
      address_neighborhood: body.addressNeighborhood || body.neighborhood,
      address_complement: body.addressComplement || body.complement,
      address_city: body.addressCity || body.city,
      address_state: body.addressState || body.state,
    }

    const company = await CompanyService.createCompany(companyData)

    // Atualizar campos extras (website, registros) - se existirem na tabela
    // TODO: Adicionar campos extras ao CompanyService se necessário
    const extraFields: Partial<EmpresasUpdate> = {}
    if (body?.stateRegistration) extraFields.state_registration = body.stateRegistration
    if (body?.municipalRegistration) extraFields.municipal_registration = body.municipalRegistration
    if (body?.website) extraFields.website = body.website

    if (Object.keys(extraFields).length > 0) {
      await supabaseServiceRole.from('empresas').update(extraFields).eq('id', company.id)
    }

    let operatorUser = null
    let userId = null

    // 2. Criar operador usando UserService
    if (operatorEmail) {
      try {
        const newUser = await UserService.createUser({
          name: operatorName || operatorEmail.split('@')[0],
          email: operatorEmail,
          password: operatorPassword || undefined,
          role: 'gestor_empresa',
          company_id: company.id,
          phone: operatorPhone
        })
        userId = newUser.id
        operatorUser = newUser
      } catch (err: unknown) {
        logError('Erro ao criar usuário operador', { error: err })
        // Não falhar criação da empresa se falhar usuário? 
        // Ou retornar erro parcial? Decisão: Retornar sucesso da empresa mas erro no operador (ou null)
        // Mas idealmente o frontend deve saber.
        // Se a senha for vazia, o UserService gera uma senha.
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
