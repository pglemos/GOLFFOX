/**
 * User Service
 * Lógica de negócio para gestão de usuários
 */

import { createClient } from '@supabase/supabase-js'

import { logger } from '@/lib/logger'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface UpdateUserData {
  name?: string
  email?: string
  role?: string
  is_active?: boolean
  company_id?: string | null
  transportadora_id?: string | null
  phone?: string
  cpf?: string
  cnh?: string | null
  cnh_category?: string | null
  password?: string
  address_zip_code?: string
  address_street?: string
  address_number?: string
  address_neighborhood?: string
  address_complement?: string
  address_city?: string
  address_state?: string
}

export interface CreateUserData {
  email: string
  name: string
  password?: string
  role?: string
  company_id?: string | null
  transportadora_id?: string | null
  phone?: string | null
  cpf?: string | null
  cnh?: string | null
  cnh_category?: string | null
  address_zip_code?: string
  address_street?: string
  address_number?: string
  address_neighborhood?: string
  address_complement?: string
  address_city?: string
  address_state?: string
}

export interface User {
  id: string
  email: string
  name?: string | null
  role: string
  is_active: boolean
  company_id?: string | null
  phone?: string | null
  cpf?: string | null
  created_at: string
  updated_at: string
}

export interface ListDriversParams {
  limit?: number
  page?: number
  search?: string
  status?: string // 'active', 'inactive', 'all'
  carrierId?: string
}

export class UserService {
  /**
   * Validar UUID
   */
  static validateUserId(userId: string): boolean {
    return UUID_REGEX.test(userId)
  }

  /**
   * Buscar usuário por ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      if (!this.validateUserId(userId)) {
        throw new Error('user_id deve ser um UUID válido')
      }

      const supabaseAdmin = getSupabaseAdmin()
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, is_active, company_id, phone, cpf, created_at, updated_at')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Não encontrado
        }
        logger.error('Erro ao buscar usuário', { error, userId })
        throw new Error(`Erro ao buscar usuário: ${error.message}`)
      }

      return data
    } catch (error) {
      logger.error('Erro ao buscar usuário por ID', { error, userId })
      throw error
    }
  }

  /**
   * Listar usuários com filtros
   */
  static async listUsers(filters: { role?: string; status?: string; companyId?: string } = {}): Promise<User[]> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { role, status, companyId } = filters

      // Selecionar todas as colunas para evitar erros de colunas inexistentes
      let query = supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (role && role !== 'all') {
        query = query.eq('role', role)
      }

      if (status && status !== 'all') {
        query = query.eq('is_active', status === 'active')
      }

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Erro ao buscar usuários: ${error.message}`)
      }

      return data || []
    } catch (error) {
      logger.error('Erro ao listar usuários', { error })
      throw error
    }
  }

  /**
   * Listar motoristas com paginação e filtros
   */
  static async listDrivers(params: ListDriversParams = {}) {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { limit = 10, page = 1, search, status, carrierId } = params
      const offset = (page - 1) * limit

      let query = supabaseAdmin
        .from('users')
        .select(`
          *,
          transportadora:transportadora_id (
            name
          )
        `, { count: 'exact' })
        .eq('role', 'motorista')

      if (carrierId && carrierId !== 'all') {
        query = query.eq('transportadora_id', carrierId)
      }

      if (status && status !== 'all') {
        query = query.eq('is_active', status === 'active')
      }

      if (search) {
        // Busca simples
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`)
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Erro ao listar motoristas: ${error.message}`)
      }

      const drivers = (data || []).map((driver: any) => ({
        ...driver,
        transportadora_name: driver.transportadora?.name
      }))

      return { drivers, total: count || 0 }
    } catch (error) {
      logger.error('Erro ao listar motoristas', { error })
      throw error
    }
  }

  /**
   * Cria um novo usuário (Auth + DB)
   */
  static async createUser(data: CreateUserData): Promise<User> {
    const supabaseAdmin = getSupabaseAdmin()
    const { email, password, name, company_id, transportadora_id, role, cpf } = data

    try {
      // 1. Validar e sanitizar
      const sanitizedEmail = email.toLowerCase().trim()
      const targetRole = role || 'gestor_empresa'
      const sanitizedCpf = cpf?.replace(/\D/g, '') || null

      // Verificar se empresa existe (se fornecida)
      if (company_id) {
        const { data: company, error: companyError } = await supabaseAdmin
          .from('companies')
          .select('id, name')
          .eq('id', company_id)
          .single()

        if (companyError || !company) {
          throw new Error('Empresa não encontrada')
        }
      }

      // Verificar existência (DB)
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', sanitizedEmail)
        .maybeSingle()

      if (existingUser) {
        throw new Error('Este email já está cadastrado na tabela de usuários')
      }

      // Verificar CPF único se fornecido
      if (sanitizedCpf) {
        const { data: existingCpf } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('cpf', sanitizedCpf)
          .maybeSingle()

        if (existingCpf) {
          throw new Error('Este CPF já está cadastrado')
        }
      }

      // 2. Determinar credenciais para Auth
      let authEmail: string
      if (sanitizedCpf && sanitizedCpf.length >= 11) {
        const rolePrefix = targetRole === 'passageiro' ? 'passageiro' : 'funcionario'
        authEmail = `${sanitizedCpf}@${rolePrefix}.golffox.app`
      } else {
        authEmail = sanitizedEmail
      }

      let finalPassword = password
      if (!finalPassword) {
        if (sanitizedCpf && sanitizedCpf.length >= 6) {
          finalPassword = sanitizedCpf.slice(-6)
        } else {
          finalPassword = `GolfFox${Math.random().toString(36).substring(2, 10)}!`
        }
      }

      // 3. Criar ou Recuperar Auth User
      let userId: string | null = null

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === authEmail.toLowerCase())

      if (existingAuthUser) {
        userId = existingAuthUser.id
      } else {
        let createResult = await supabaseAdmin.auth.admin.createUser({
          email: authEmail,
          password: finalPassword,
          email_confirm: true,
          user_metadata: { name: name.trim() }
        })

        if (createResult.error) {
          // Tentativa de fallback sem confirmação de email se falhar
          createResult = await supabaseAdmin.auth.admin.createUser({
            email: authEmail,
            password: finalPassword,
            email_confirm: false
          })
        }

        if (createResult.error || !createResult.data.user) {
          throw new Error(`Erro ao criar usuário no Auth: ${createResult.error?.message}`)
        }
        userId = createResult.data.user.id
      }

      if (!userId) throw new Error("Falha crítica ao obter ID do usuário")

      // 4. Criar registro no Banco de Dados
      const userData: any = {
        id: userId,
        email: sanitizedEmail,
        name: name.trim(),
        role: targetRole,
        company_id: company_id || null,
        transportadora_id: transportadora_id || null,
        is_active: true,
        phone: data.phone?.trim() || null,
        cpf: sanitizedCpf,
        cnh: data.cnh || null,
        cnh_category: data.cnh_category || null,
        address_zip_code: data.address_zip_code,
        address_street: data.address_street,
        address_number: data.address_number,
        address_neighborhood: data.address_neighborhood,
        address_complement: data.address_complement,
        address_city: data.address_city,
        address_state: data.address_state
      }

      const { data: createdUser, error: userError } = await supabaseAdmin
        .from('users')
        .upsert(userData, { onConflict: 'id' })
        .select()
        .single()

      if (userError) {
        // Rollback se possível (deletar do Auth se foi criado agora)
        if (!existingAuthUser) {
          await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => { })
        }
        throw new Error(`Erro ao criar registro do usuário: ${userError.message}`)
      }

      // 5. Mapeamento User-Company (se tabela existir)
      const { error: mapError } = await supabaseAdmin.from('gf_user_company_map').insert({
        user_id: userId,
        company_id: company_id,
        created_at: new Date().toISOString()
      })

      return createdUser
    } catch (error) {
      logger.error("Erro no createUser Service", { error })
      throw error
    }
  }

  /**
   * Atualizar usuário
   */
  static async updateUser(userId: string, updateData: UpdateUserData): Promise<User> {
    try {
      if (!this.validateUserId(userId)) {
        throw new Error('user_id deve ser um UUID válido')
      }

      const supabaseAdmin = getSupabaseAdmin()

      // Verificar se usuário existe e buscar email para validação de mudança
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id,email')
        .eq('id', userId)
        .single()

      if (fetchError || !existingUser) {
        throw new Error('Usuário não encontrado')
      }

      // Preparar dados para atualização
      const updatePayload: Record<string, unknown> = {}
      if (updateData.name !== undefined) updatePayload.name = updateData.name?.trim() || null
      if (updateData.email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(updateData.email)) {
          throw new Error('Email inválido')
        }
        updatePayload.email = updateData.email.trim()
      }
      if (updateData.role !== undefined) updatePayload.role = updateData.role
      if (updateData.is_active !== undefined) updatePayload.is_active = updateData.is_active
      if (updateData.company_id !== undefined) updatePayload.company_id = updateData.company_id || null
      if (updateData.transportadora_id !== undefined) updatePayload.transportadora_id = updateData.transportadora_id || null
      if (updateData.phone !== undefined) updatePayload.phone = updateData.phone?.trim() || null
      if (updateData.cpf !== undefined) updatePayload.cpf = updateData.cpf?.replace(/\D/g, '') || null
      if (updateData.cnh !== undefined) updatePayload.cnh = updateData.cnh || null
      if (updateData.cnh_category !== undefined) updatePayload.cnh_category = updateData.cnh_category || null
      if (updateData.address_zip_code !== undefined) updatePayload.address_zip_code = updateData.address_zip_code
      if (updateData.address_street !== undefined) updatePayload.address_street = updateData.address_street
      if (updateData.address_number !== undefined) updatePayload.address_number = updateData.address_number
      if (updateData.address_neighborhood !== undefined) updatePayload.address_neighborhood = updateData.address_neighborhood
      if (updateData.address_complement !== undefined) updatePayload.address_complement = updateData.address_complement
      if (updateData.address_city !== undefined) updatePayload.address_city = updateData.address_city
      if (updateData.address_state !== undefined) updatePayload.address_state = updateData.address_state

      // Atualizar usuário
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        logger.error('Erro ao atualizar usuário', { error: updateError, userId })
        throw new Error(`Erro ao atualizar usuário: ${updateError.message}`)
      }

      if (!updatedUser) {
        throw new Error('Usuário atualizado mas dados não retornados')
      }

      // Se o email foi alterado, atualizar também no Supabase Auth
      if ((updateData.email && updateData.email !== existingUser.email) || updateData.password) {
        try {
          const authUpdates: Record<string, unknown> = {}
          if (updateData.email && updateData.email !== existingUser.email) {
            authUpdates.email = updateData.email
          }
          if (updateData.password && updateData.password.length >= 6) {
            authUpdates.password = updateData.password
          }

          if (Object.keys(authUpdates).length > 0) {
            await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates)
          }
        } catch (authErr) {
          logger.warn('Aviso: não foi possível atualizar dados no Auth', { error: authErr })
          // Não falhar a operação se apenas o Auth falhar
        }
      }

      // Invalidar cache
      try {
        const { invalidateEntityCache } = await import('@/lib/next-cache')
        await invalidateEntityCache('user', userId)
      } catch (cacheErr) {
        // Ignore cache errors in service
      }

      return updatedUser
    } catch (error) {
      logger.error('Erro ao atualizar usuário', { error, userId })
      throw error
    }
  }

  /**
   * Deletar usuário
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      if (!this.validateUserId(userId)) {
        throw new Error('user_id deve ser um UUID válido')
      }

      const supabaseAdmin = getSupabaseAdmin()

      // Limpar referências em outras tabelas
      await supabaseAdmin
        .from('trips')
        .update({ driver_id: null })
        .eq('driver_id', userId)

      // Deletar usuário
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        logger.error('Erro ao deletar usuário', { error, userId })
        throw new Error(`Erro ao deletar usuário: ${error.message}`)
      }

      // Deletar do Auth também
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      } catch (authErr) {
        logger.warn('Aviso: não foi possível deletar usuário do Auth', { error: authErr })
      }

      // Invalidar cache
      try {
        const { invalidateEntityCache } = await import('@/lib/next-cache')
        await invalidateEntityCache('user', userId)
      } catch (cacheErr) {
        // Ignore cache errors in service
      }
    } catch (error) {
      logger.error('Erro ao deletar usuário', { error, userId })
      throw error
    }
  }
}

