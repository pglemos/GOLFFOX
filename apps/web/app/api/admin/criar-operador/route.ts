import { NextRequest } from 'next/server'
import { requireAuth, validateAuth } from '@/lib/api-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { CompanyService, type CreateCompanyData } from '@/lib/services'
import { debug, logError, logger } from '@/lib/logger'
import { formatError } from '@/lib/error-utils'
import { publishCreatedEvent } from '@/lib/events'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { supabaseServiceRole } from '@/lib/supabase-server'

export const runtime = 'nodejs'

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
    }

    const company = await CompanyService.createCompany(companyData)

    // Atualizar campos extras
    const extraFields: any = {}
    if (body?.stateRegistration) extraFields.state_registration = body.stateRegistration
    if (body?.municipalRegistration) extraFields.municipal_registration = body.municipalRegistration
    if (body?.website) extraFields.website = body.website

    if (Object.keys(extraFields).length > 0) {
      await supabaseServiceRole.from('companies').update(extraFields).eq('id', company.id)
    }

    let userId = null
    let operatorUser = null

    // 2. Criar operador
    if (operatorEmail && operatorPassword) {
      const { data: authUsers } = await supabaseServiceRole.auth.admin.listUsers()
      const existingUser = authUsers?.users?.find(u => u.email?.toLowerCase() === operatorEmail.toLowerCase())

      if (existingUser) {
        userId = existingUser.id
      } else {
        const createResult = await supabaseServiceRole.auth.admin.createUser({
          email: operatorEmail.toLowerCase().trim(),
          password: operatorPassword,
          email_confirm: true,
          user_metadata: { name: operatorName }
        })
        if (createResult.data?.user) userId = createResult.data.user.id
      }

      if (userId) {
        await supabaseServiceRole.from('users').upsert({
          id: userId,
          email: operatorEmail.toLowerCase().trim(),
          name: operatorName || operatorEmail.split('@')[0],
          phone: operatorPhone || null,
          role: 'gestor_empresa',
          company_id: company.id,
          is_active: true
        })

        operatorUser = {
          id: userId,
          email: operatorEmail,
          name: operatorName || operatorEmail.split('@')[0],
          role: 'gestor_empresa'
        }

        // Evento
        try {
          const author = await validateAuth(request)
          await publishCreatedEvent('User', userId, { email: operatorEmail, role: 'gestor_empresa', companyId: company.id }, author?.id)
        } catch (_) { }
      }
    }

    return successResponse({
      company_id: company.id,
      company,
      operador: operatorUser,
      userId
    }, { status: 201 })

  } catch (err) {
    logError('Erro ao criar empresa/operador', { error: err })
    return errorResponse(formatError(err, 'Erro ao criar empresa'), 500)
  }
}

export const POST = withRateLimit(createOperatorHandler, 'sensitive')
