import { NextRequest } from 'next/server'
import { debug, warn, logError } from '@/lib/logger'
import { requireAuth } from '@/lib/api-auth'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'

// POST /api/admin/drivers - Criar motorista
export async function POST(request: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const {
      name,
      email,
      phone,
      transportadora_id,
      carrier_id, // Compatibilidade
      cpf,
      cnh,
      cnh_category,
      is_active,
      // Campos de endereço (opcionais)
      address_zip_code,
      address_street,
      address_number,
      address_neighborhood,
      address_complement,
      address_city,
      address_state
    } = body

    if (!name) {
      return validationErrorResponse('Nome é obrigatório')
    }

    const transportadoraId = transportadora_id || carrier_id // Compatibilidade
    if (!transportadoraId) {
      return validationErrorResponse('Transportadora é obrigatória')
    }

    // Gerar email para Auth baseado no CPF (para login com CPF)
    const cleanCpf = cpf?.replace(/\D/g, '') || ''

    // Se tem CPF, usar como login. Senão, usar email fornecido ou gerar um temporário
    let authEmail: string
    if (cleanCpf.length >= 11) {
      // Login com CPF: email fictício baseado no CPF
      authEmail = `${cleanCpf}@motorista.golffox.app`
    } else if (email) {
      authEmail = email
    } else {
      authEmail = `motorista.${Date.now()}@temp.golffox.com`
    }

    // Senha: últimos 6 dígitos do CPF ou '123456' se não houver CPF válido
    const password = cleanCpf.length >= 6 ? cleanCpf.slice(-6) : '123456'

    // 1. Verificar se usuário já existe no Auth
    let authUserId: string | null = null
    let existingAuthUser = false

    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const found = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === authEmail.toLowerCase())
      if (found) {
        authUserId = found.id
        existingAuthUser = true
        debug('Motorista já existe no Auth, usando ID existente', { authUserId }, 'DriversAPI')
      }
    } catch (listErr) {
      warn('Não foi possível verificar usuários existentes no Auth', { error: listErr }, 'DriversAPI')
    }

    // 2. Criar usuário no Auth se não existir
    if (!authUserId) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: authEmail,
        password: password,
        email_confirm: true,
        user_metadata: { name, role: 'motorista' }
      })

      if (authError) {
        // Se erro for "user already registered", tentar buscar o ID
        if (authError.message?.includes('already') || authError.message?.includes('registered')) {
          try {
            const { data: authUsers } = await supabase.auth.admin.listUsers()
            const found = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === authEmail.toLowerCase())
            if (found) {
              authUserId = found.id
              existingAuthUser = true
            }
          } catch (e) { /* ignore */ }
        }

        if (!authUserId) {
          logError('Erro ao criar usuário Auth para motorista', { error: authError }, 'DriversAPI')
          return errorResponse(authError, 500, 'Erro ao criar autenticação do motorista')
        }
      } else if (authData?.user) {
        authUserId = authData.user.id
      }
    }

    if (!authUserId) {
      return errorResponse(new Error('Erro ao criar usuário Auth (sem ID)'), 500)
    }

    // 3. Usar UPSERT na tabela users para evitar erro de chave duplicada
    const { data: motorista, error: driverError } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
        transportadora_id: transportadoraId,
        name,
        email: email || null, // Email real do usuário, não o fictício do Auth
        phone: phone || null,
        cpf: cpf || null,
        cnh: cnh || null,
        cnh_category: cnh_category || null,
        role: 'motorista',
        is_active: is_active ?? true,
        address_zip_code: address_zip_code || null,
        address_street: address_street || null,
        address_number: address_number || null,
        address_neighborhood: address_neighborhood || null,
        address_complement: address_complement || null,
        address_city: address_city || null,
        address_state: address_state || null
      } as any, { onConflict: 'id' })
      .select()
      .single()

    if (driverError) {
      logError('Erro ao criar motorista na tabela users', { error: driverError }, 'DriversAPI')
      // Só deleta do Auth se não era um usuário existente
      if (!existingAuthUser) {
        await supabase.auth.admin.deleteUser(authUserId)
      }

      return errorResponse(driverError, 500, 'Erro ao criar motorista')
    }

    return successResponse({ motorista })
  } catch (error: any) {
    logError('Erro na API de criar motorista', { error }, 'DriversAPI')
    return errorResponse(error, 500, 'Erro ao criar motorista')
  }
}
