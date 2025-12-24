import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } from '@/lib/api-response'
import { logger, logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'

// GET /api/admin/transportadoras/[transportadoraId]/motoristas
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  try {
    const { transportadoraId } = await context.params

    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    if (!transportadoraId) {
      return validationErrorResponse('ID da transportadora não fornecido')
    }

    const supabase = getSupabaseAdmin()

    // Buscar motoristas na tabela users
    const { data: motoristas, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'motorista')
      .eq('transportadora_id', transportadoraId)
      .order('name', { ascending: true })

    if (error) {
      logError('Erro ao buscar motoristas', { error, transportadoraId }, 'TransportadoraDriversAPI')
      return errorResponse(error, 500, 'Erro ao buscar motoristas')
    }

    return successResponse(motoristas || [])
  } catch (err) {
    logError('Erro na API de motoristas', { error: err }, 'TransportadoraDriversAPI')
    return errorResponse(err, 500, 'Erro interno do servidor')
  }
}

// POST /api/admin/transportadoras/[transportadoraId]/motoristas
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  try {
    const { transportadoraId } = await context.params

    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    if (!transportadoraId) {
      return validationErrorResponse('ID da transportadora não fornecido')
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      cpf,
      cnh,
      cnh_category,
      password,
      address_zip_code,
      address_street,
      address_number,
      address_neighborhood,
      address_complement,
      address_city,
      address_state
    } = body

    if (!name) return validationErrorResponse('Nome é obrigatório')
    if (!cpf) return validationErrorResponse('CPF é obrigatório')

    if (!address_zip_code || !address_street || !address_number || !address_neighborhood || !address_city || !address_state) {
      return validationErrorResponse('Endereço completo é obrigatório (CEP, rua, número, bairro, cidade e estado)')
    }

    // Determinar senha: usar fornecida ou gerar dos últimos 6 dígitos do CPF
    const cleanCpf = cpf?.replace(/\D/g, '') || ''
    let finalPassword = password
    if (!password || password.length < 6) {
      if (cleanCpf.length < 6) {
        return validationErrorResponse('CPF inválido para gerar senha')
      }
      finalPassword = cleanCpf.slice(-6)
    }

    const supabase = getSupabaseAdmin()

    // Gerar email para Auth baseado no CPF (para login com CPF)
    let authEmail: string
    if (cleanCpf.length >= 11) {
      authEmail = `${cleanCpf}@motorista.golffox.app`
    } else if (email) {
      authEmail = email
    } else {
      authEmail = `motorista.${Date.now()}@temp.golffox.com`
    }

    // 1. Verificar se usuário já existe no Auth
    let authUserId: string | null = null
    let existingAuthUser = false

    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      type AdminUser = { id: string; email?: string }
      const found = authUsers?.users?.find((u: AdminUser) => u.email?.toLowerCase() === authEmail.toLowerCase())
      if (found) {
        authUserId = found.id
        existingAuthUser = true
        logger.log('Motorista já existe no Auth, usando ID existente:', authUserId)
      }
    } catch (listErr) {
      logger.warn('Não foi possível verificar usuários existentes no Auth:', listErr)
    }

    // 2. Criar usuário no Auth se não existir
    if (!authUserId) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: authEmail,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { name, role: 'motorista' }
      })

      if (authError) {
        if (authError.message?.includes('already') || authError.message?.includes('registered')) {
          try {
            const { data: authUsers } = await supabase.auth.admin.listUsers()
            type AdminUser = { id: string; email?: string }
      const found = authUsers?.users?.find((u: AdminUser) => u.email?.toLowerCase() === authEmail.toLowerCase())
            if (found) {
              authUserId = found.id
              existingAuthUser = true
            }
          } catch (e) { /* ignore */ }
        }

        if (!authUserId) {
          logError('Erro ao criar usuário Auth para motorista', { error: authError, transportadoraId }, 'TransportadoraDriversAPI')
          return errorResponse(authError, 500, 'Erro ao criar autenticação do motorista')
        }
      } else if (authData?.user) {
        authUserId = authData.user.id
      }
    }

    if (!authUserId) {
      return errorResponse('Erro ao criar usuário Auth (sem ID)', 500)
    }

    // 3. Usar UPSERT na tabela users para evitar erro de chave duplicada
    const { data: motorista, error } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
        transportadora_id: transportadoraId,
        name,
        email: email || null,
        phone: phone || null,
        cpf,
        cnh: cnh || null,
        cnh_category: cnh_category || null,
        role: 'motorista',
        is_active: true,
        address_zip_code,
        address_street,
        address_number,
        address_neighborhood,
        address_complement: address_complement || null,
        address_city,
        address_state
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      logError('Erro ao criar motorista na tabela users', { error, transportadoraId }, 'TransportadoraDriversAPI')
      if (!existingAuthUser) {
        await supabase.auth.admin.deleteUser(authUserId)
      }
      return errorResponse(error, 500, 'Erro ao criar motorista no banco de dados')
    }

    return successResponse(motorista)
  } catch (err) {
    logError('Erro na API de criar motorista', { error: err }, 'TransportadoraDriversAPI')
    return errorResponse(err, 500, 'Erro ao processar requisição')
  }
}
