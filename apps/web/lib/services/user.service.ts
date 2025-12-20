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
  phone?: string
  cpf?: string
  password?: string
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
      if (updateData.phone !== undefined) updatePayload.phone = updateData.phone?.trim() || null
      if (updateData.cpf !== undefined) updatePayload.cpf = updateData.cpf?.replace(/\D/g, '') || null
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
        .update({ motorista_id: null })
        .eq('motorista_id', userId)

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
    } catch (error) {
      logger.error('Erro ao deletar usuário', { error, userId })
      throw error
    }
  }
}

