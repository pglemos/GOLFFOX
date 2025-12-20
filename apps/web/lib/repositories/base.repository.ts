/**
 * Base Repository
 * Padrão Repository para abstrair acesso a dados
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface FilterOptions {
  [key: string]: unknown
}

export abstract class BaseRepository<T> {
  protected tableName: string
  protected _supabase: SupabaseClient | null = null

  constructor(tableName: string) {
    this.tableName = tableName
  }

  /**
   * Lazy getter para Supabase client
   * Evita inicialização durante o build
   */
  protected get supabase(): SupabaseClient {
    if (!this._supabase) {
      this._supabase = getSupabaseAdmin()
    }
    return this._supabase
  }

  /**
   * Buscar por ID
   * 
   * NOTA: Usa select('*') por ser genérico. Repositórios específicos podem sobrescrever
   * este método para otimizar seleção de colunas.
   */
  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Não encontrado
        }
        logger.error(`Erro ao buscar ${this.tableName} por ID`, { error, id })
        throw new Error(`Erro ao buscar ${this.tableName}: ${error.message}`)
      }

      return data as T
    } catch (error) {
      logger.error(`Erro ao buscar ${this.tableName} por ID`, { error, id })
      throw error
    }
  }

  /**
   * Listar com paginação
   */
  async findAll(
    options: PaginationOptions & { filters?: FilterOptions; orderBy?: string; orderDirection?: 'asc' | 'desc' } = {}
  ): Promise<PaginatedResult<T>> {
    try {
      const {
        page = 1,
        limit = 100,
        offset,
        filters = {},
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = options

      const calculatedOffset = offset !== undefined ? offset : (page - 1) * limit

      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value)
          } else if (Array.isArray(value)) {
            query = query.in(key, value)
          } else {
            query = query.eq(key, value)
          }
        }
      })

      // Ordenação
      query = query.order(orderBy, { ascending: orderDirection === 'asc' })

      // Paginação
      query = query.range(calculatedOffset, calculatedOffset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        logger.error(`Erro ao listar ${this.tableName}`, { error })
        throw new Error(`Erro ao listar ${this.tableName}: ${error.message}`)
      }

      const totalPages = count ? Math.ceil(count / limit) : 0

      return {
        data: (data || []) as T[],
        count: count || 0,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    } catch (error) {
      logger.error(`Erro ao listar ${this.tableName}`, { error })
      throw error
    }
  }

  /**
   * Criar registro
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const { data: created, error } = await this.supabase
        .from(this.tableName)
        .insert(data as any)
        .select()
        .single()

      if (error) {
        logger.error(`Erro ao criar ${this.tableName}`, { error })
        throw new Error(`Erro ao criar ${this.tableName}: ${error.message}`)
      }

      return created as T
    } catch (error) {
      logger.error(`Erro ao criar ${this.tableName}`, { error })
      throw error
    }
  }

  /**
   * Atualizar registro
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const { data: updated, error } = await this.supabase
        .from(this.tableName)
        .update(data as any)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logger.error(`Erro ao atualizar ${this.tableName}`, { error, id })
        throw new Error(`Erro ao atualizar ${this.tableName}: ${error.message}`)
      }

      if (!updated) {
        throw new Error(`${this.tableName} não encontrado`)
      }

      return updated as T
    } catch (error) {
      logger.error(`Erro ao atualizar ${this.tableName}`, { error, id })
      throw error
    }
  }

  /**
   * Deletar registro
   */
  async delete(id: string, hardDelete: boolean = false): Promise<void> {
    try {
      if (hardDelete) {
        const { error } = await this.supabase
          .from(this.tableName)
          .delete()
          .eq('id', id)

        if (error) {
          logger.error(`Erro ao deletar ${this.tableName}`, { error, id })
          throw new Error(`Erro ao deletar ${this.tableName}: ${error.message}`)
        }
      } else {
        // Soft delete
        const { error } = await this.supabase
          .from(this.tableName)
          .update({ is_active: false, updated_at: new Date().toISOString() } as any)
          .eq('id', id)

        if (error) {
          logger.error(`Erro ao desativar ${this.tableName}`, { error, id })
          throw new Error(`Erro ao desativar ${this.tableName}: ${error.message}`)
        }
      }
    } catch (error) {
      logger.error(`Erro ao deletar ${this.tableName}`, { error, id })
      throw error
    }
  }

  /**
   * Buscar com filtros customizados
   * 
   * NOTA: Usa select('*') por ser genérico. Repositórios específicos podem sobrescrever
   * este método para otimizar seleção de colunas.
   */
  async findOne(filters: FilterOptions): Promise<T | null> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .limit(1)

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      const { data, error } = await query.maybeSingle()

      if (error && error.code !== 'PGRST116') {
        logger.error(`Erro ao buscar ${this.tableName}`, { error })
        throw new Error(`Erro ao buscar ${this.tableName}: ${error.message}`)
      }

      return (data || null) as T | null
    } catch (error) {
      logger.error(`Erro ao buscar ${this.tableName}`, { error })
      throw error
    }
  }

  /**
   * Contar registros
   */
  async count(filters?: FilterOptions): Promise<number> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { count, error } = await query

      if (error) {
        logger.error(`Erro ao contar ${this.tableName}`, { error })
        throw new Error(`Erro ao contar ${this.tableName}: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      logger.error(`Erro ao contar ${this.tableName}`, { error })
      throw error
    }
  }
}

