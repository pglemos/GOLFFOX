/**
 * Company Service
 * Lógica de negócio para gestão de empresas
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey)
}

export interface CompanyFilters {
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface CreateCompanyData {
  name: string
  cnpj?: string
  address?: string
  phone?: string
  email?: string
}

export interface Company {
  id: string
  name: string
  cnpj?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export class CompanyService {
  /**
   * Listar empresas com filtros
   */
  static async listCompanies(filters: CompanyFilters = {}) {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const {
        isActive,
        search,
        limit = 100,
        offset = 0
      } = filters

      const companyColumns = 'id,name,cnpj,address,phone,email,is_active,created_at,updated_at'
      let query = supabaseAdmin.from('companies').select(companyColumns, { count: 'exact' })

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,cnpj.ilike.%${search}%`)
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        logger.error('Erro ao buscar empresas', { error })
        throw new Error(`Erro ao buscar empresas: ${error.message}`)
      }

      return {
        data: data || [],
        count: count || 0,
        limit,
        offset
      }
    } catch (error) {
      logger.error('Erro ao listar empresas', { error })
      throw error
    }
  }

  /**
   * Criar nova empresa
   */
  static async createCompany(companyData: CreateCompanyData): Promise<Company> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { name, cnpj, address, phone, email } = companyData

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Nome da empresa é obrigatório')
      }

      // Validar CNPJ único se fornecido
      if (cnpj) {
        const { data: existingCompany } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('cnpj', cnpj)
          .single()

        if (existingCompany) {
          throw new Error('Uma empresa com este CNPJ já existe')
        }
      }

      const { data, error } = await supabaseAdmin
        .from('companies')
        .insert([
          {
            name: name.trim(),
            cnpj: cnpj?.trim() || null,
            address: address?.trim() || null,
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select()
        .single()

      if (error) {
        logger.error('Erro ao criar empresa', { error })
        throw new Error(`Erro ao criar empresa: ${error.message}`)
      }

      if (!data) {
        throw new Error('Empresa criada mas dados não retornados')
      }

      return data
    } catch (error) {
      logger.error('Erro ao criar empresa', { error })
      throw error
    }
  }

  /**
   * Buscar empresa por ID
   */
  static async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Não encontrado
        }
        logger.error('Erro ao buscar empresa', { error, companyId })
        throw new Error(`Erro ao buscar empresa: ${error.message}`)
      }

      return data
    } catch (error) {
      logger.error('Erro ao buscar empresa por ID', { error, companyId })
      throw error
    }
  }

  /**
   * Atualizar empresa
   */
  static async updateCompany(companyId: string, updateData: Partial<CreateCompanyData & { is_active?: boolean }>): Promise<Company> {
    try {
      const supabaseAdmin = getSupabaseAdmin()

      // Validar CNPJ único se fornecido e diferente do atual
      if (updateData.cnpj) {
        const { data: existingCompany } = await supabaseAdmin
          .from('companies')
          .select('id,cnpj')
          .eq('id', companyId)
          .single()

        if (existingCompany && existingCompany.cnpj !== updateData.cnpj) {
          const { data: duplicateCompany } = await supabaseAdmin
            .from('companies')
            .select('id')
            .eq('cnpj', updateData.cnpj)
            .single()

          if (duplicateCompany) {
            throw new Error('Uma empresa com este CNPJ já existe')
          }
        }
      }

      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      if (updateData.name !== undefined) updatePayload.name = updateData.name.trim()
      if (updateData.cnpj !== undefined) updatePayload.cnpj = updateData.cnpj?.trim() || null
      if (updateData.address !== undefined) updatePayload.address = updateData.address?.trim() || null
      if (updateData.phone !== undefined) updatePayload.phone = updateData.phone?.trim() || null
      if (updateData.email !== undefined) updatePayload.email = updateData.email?.trim() || null
      if (updateData.is_active !== undefined) updatePayload.is_active = updateData.is_active

      const { data, error } = await supabaseAdmin
        .from('companies')
        .update(updatePayload)
        .eq('id', companyId)
        .select()
        .single()

      if (error) {
        logger.error('Erro ao atualizar empresa', { error, companyId })
        throw new Error(`Erro ao atualizar empresa: ${error.message}`)
      }

      if (!data) {
        throw new Error('Empresa atualizada mas dados não retornados')
      }

      return data
    } catch (error) {
      logger.error('Erro ao atualizar empresa', { error, companyId })
      throw error
    }
  }

  /**
   * Deletar empresa (soft delete)
   */
  static async deleteCompany(companyId: string, hardDelete: boolean = false): Promise<void> {
    try {
      const supabaseAdmin = getSupabaseAdmin()

      if (hardDelete) {
        const { error } = await supabaseAdmin
          .from('companies')
          .delete()
          .eq('id', companyId)

        if (error) {
          logger.error('Erro ao deletar empresa (hard)', { error, companyId })
          throw new Error(`Erro ao deletar empresa: ${error.message}`)
        }
      } else {
        // Soft delete
        const { error } = await supabaseAdmin
          .from('companies')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', companyId)

        if (error) {
          logger.error('Erro ao desativar empresa', { error, companyId })
          throw new Error(`Erro ao desativar empresa: ${error.message}`)
        }
      }
    } catch (error) {
      logger.error('Erro ao deletar empresa', { error, companyId })
      throw error
    }
  }
}

