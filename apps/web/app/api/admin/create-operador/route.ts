import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, validateAuth } from '@/lib/api-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { CompanyService, type CreateCompanyData } from '@/lib/services'
import { createClient } from '@supabase/supabase-js'
import { debug, logError, logger } from '@/lib/logger'
import { formatError } from '@/lib/error-utils'
import { publishCreatedEvent, publishDomainEvent } from '@/lib/events'
import { normalizeRole } from '@/lib/role-mapper'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// OPTIONS handler para CORS
async function optionsHandler(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * POST /api/admin/create-operador
 * Criar empresa e opcionalmente criar operador associado
 * 
 * Este endpoint é um alias/wrapper para criar empresa com operador
 * Segue o mesmo padrão de create-empresa-user mas com formato esperado pelo modal
 */
async function createOperatorHandler(request: NextRequest) {
  try {
    // ✅ Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const body = await request.json()
    const supabaseAdmin = getSupabaseAdmin()

    // Mapear dados do modal para formato esperado
    const companyName = body?.companyName || body?.company_name
    const cnpj = body?.cnpj || null
    const stateRegistration = body?.stateRegistration || body?.state_registration || null
    const municipalRegistration = body?.municipalRegistration || body?.municipal_registration || null
    const address = body?.address || null
    const city = body?.city || body?.address_city || null
    const state = body?.state || body?.address_state || null
    const zipCode = body?.zipCode || body?.zip_code || body?.address_zip_code || null
    const companyPhone = body?.companyPhone || body?.company_phone || null
    const companyEmail = body?.companyEmail || body?.company_email || null
    const companyWebsite = body?.companyWebsite || body?.company_website || null

    // Dados do operador (opcional)
    const operatorEmail = body?.operatorEmail || body?.responsibleEmail || body?.operator_email || null
    const operatorPassword = body?.operatorPassword || body?.responsiblePassword || body?.operator_password || null
    const operatorName = body?.operatorName || body?.responsibleName || body?.operator_name || null
    const operatorPhone = body?.operatorPhone || body?.responsiblePhone || body?.operator_phone || null

    // Campos de endereço separados
    const address_zip_code = body?.address_zip_code || zipCode || null
    const address_street = body?.address_street || null
    const address_number = body?.address_number || null
    const address_neighborhood = body?.address_neighborhood || null
    const address_complement = body?.address_complement || null
    const address_city = body?.address_city || city || null
    const address_state = body?.address_state || state || null

    // Validar dados obrigatórios
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório', message: 'Nome da empresa é obrigatório' },
        { status: 400 }
      )
    }

    // Validar email se fornecido
    if (operatorEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(operatorEmail)) {
        return NextResponse.json(
          { error: 'Email inválido', message: 'Email do operador inválido' },
          { status: 400 }
        )
      }
    }

    // Validar senha se fornecida
    if (operatorPassword && operatorPassword.length < 6) {
      return NextResponse.json(
        { error: 'Senha inválida', message: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Construir endereço completo se campos separados estiverem disponíveis
    let fullAddress = address
    if (!fullAddress && address_street) {
      const addressParts = [
        address_street,
        address_number ? `Nº ${address_number}` : '',
        address_complement || '',
        address_neighborhood || '',
        address_city || '',
        address_state || '',
        address_zip_code ? `CEP: ${address_zip_code}` : ''
      ].filter(Boolean)
      fullAddress = addressParts.join(', ')
    }

    // 1. Criar empresa usando CompanyService
    const companyData: CreateCompanyData = {
      name: companyName.trim(),
      cnpj: cnpj?.trim() || undefined,
      address: fullAddress || undefined,
      phone: companyPhone?.trim() || undefined,
      email: companyEmail?.trim() || undefined,
    }

    debug('Criando empresa', { companyName, hasOperatorEmail: !!operatorEmail }, 'CreateOperatorAPI')

    const company = await CompanyService.createCompany(companyData)

    // 2. Atualizar campos adicionais da empresa se fornecidos
    if (stateRegistration || municipalRegistration || companyWebsite ||
      address_zip_code || address_street || address_number || address_neighborhood ||
      address_complement || address_city || address_state) {

      const updateData: any = {}
      if (stateRegistration) updateData.state_registration = stateRegistration.trim()
      if (municipalRegistration) updateData.municipal_registration = municipalRegistration.trim()
      if (companyWebsite) updateData.website = companyWebsite.trim()
      if (address_zip_code) updateData.address_zip_code = address_zip_code.trim()
      if (address_street) updateData.address_street = address_street.trim()
      if (address_number) updateData.address_number = address_number.trim()
      if (address_neighborhood) updateData.address_neighborhood = address_neighborhood.trim()
      if (address_complement) updateData.address_complement = address_complement.trim()
      if (address_city) updateData.address_city = address_city.trim()
      if (address_state) updateData.address_state = address_state.trim()

      // Atualizar empresa com campos adicionais
      await supabaseAdmin
        .from('companies')
        .update(updateData)
        .eq('id', company.id)
    }

    let operatorUser = null
    let userId = null

    // 3. Criar operador se email e senha foram fornecidos
    if (operatorEmail && operatorPassword) {
      debug('Criando operador', { email: operatorEmail, companyId: company.id }, 'CreateOperatorAPI')

      // Verificar se usuário já existe
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === operatorEmail.toLowerCase()
      )

      if (existingUser) {
        // Usuário já existe - atualizar para associar à empresa
        debug('Usuário já existe, associando à empresa', { userId: existingUser.id }, 'CreateOperatorAPI')

        await supabaseAdmin
          .from('users')
          .upsert({
            id: existingUser.id,
            email: operatorEmail.toLowerCase().trim(),
            name: operatorName?.trim() || operatorEmail.split('@')[0],
            phone: operatorPhone?.trim() || null,
            role: 'gestor_empresa', // Role normalizado: gestor_empresa (antigo operador/empresa)
            company_id: company.id,
            is_active: true
          }, {
            onConflict: 'id'
          })

        operatorUser = {
          id: existingUser.id,
          email: operatorEmail,
          name: operatorName || operatorEmail.split('@')[0],
          role: 'gestor_empresa',
          company_id: company.id
        }
        userId = existingUser.id
      } else {
        // Criar novo usuário
        const createUserResult = await supabaseAdmin.auth.admin.createUser({
          email: operatorEmail.toLowerCase().trim(),
          password: operatorPassword,
          email_confirm: true,
          user_metadata: {
            name: operatorName?.trim() || operatorEmail.split('@')[0],
            role: 'gestor_empresa',
          }
        })

        if (createUserResult.error) {
          logError('Erro ao criar usuário operador', { error: createUserResult.error }, 'CreateOperatorAPI')
          // Continuar mesmo se falhar - empresa já foi criada
        } else if (createUserResult.data?.user) {
          const newUserId = createUserResult.data.user.id

          // Criar registro em users
          await supabaseAdmin
            .from('users')
            .upsert({
              id: newUserId,
              email: operatorEmail.toLowerCase().trim(),
              name: operatorName?.trim() || operatorEmail.split('@')[0],
              phone: operatorPhone?.trim() || null,
              role: 'gestor_empresa', // Role normalizado: gestor_empresa (antigo operador/empresa)
              company_id: company.id,
              is_active: true
            }, {
              onConflict: 'id'
            })

          operatorUser = {
            id: newUserId,
            email: operatorEmail,
            name: operatorName || operatorEmail.split('@')[0],
            role: 'gestor_empresa',
            company_id: company.id
          }
          userId = newUserId

          debug('Operador criado com sucesso', { userId: newUserId }, 'CreateOperatorAPI')

          // Publicar evento de criação de usuário
          try {
            const currentUser = await validateAuth(request)
            await publishCreatedEvent(
              'User',
              newUserId,
              {
                email: operatorEmail,
                role: 'gestor_empresa',
                companyId: company.id,
              },
              currentUser?.id
            )
          } catch (eventError) {
            logger.warn('Erro ao publicar evento de criação de usuário', { error: eventError, userId: newUserId })
          }
        }
      }
    }

    // 4. Retornar resposta no formato esperado pelo modal
    return NextResponse.json({
      success: true,
      companyId: company.id,
      company_id: company.id, // Compatibilidade
      company: {
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        address: company.address,
        phone: company.phone,
        email: company.email,
      },
      operador: operatorUser,
      operatorId: userId,
      userId: userId, // Compatibilidade
      email: operatorEmail || null,
    }, { status: 201 })

  } catch (err) {
    const errorMessage = formatError(err, 'Erro ao criar empresa')
    const status = errorMessage.includes('obrigatório') ||
      errorMessage.includes('já existe') ||
      errorMessage.includes('inválido') ? 400 : 500

    logError('Erro ao criar empresa/operador', { error: err }, 'CreateOperatorAPI')

    return NextResponse.json(
      {
        error: 'Erro ao criar empresa',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.stack : String(err)) : undefined
      },
      { status }
    )
  }
}

// Exportar com rate limiting
export const POST = withRateLimit(createOperatorHandler, 'sensitive')

