/**
 * Company Repository
 * Acesso a dados de empresas usando padrão Repository
 */

import { BaseRepository, type PaginatedResult, type PaginationOptions, type FilterOptions } from './base.repository'
import { logger } from '@/lib/logger'

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

export interface CompanyFindAllOptions extends PaginationOptions {
  filters?: FilterOptions
  search?: string
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export class CompanyRepository extends BaseRepository<Company> {
  constructor() {
    super('companies')
  }

  /**
   * Buscar empresa por CNPJ
   */
  async findByCnpj(cnpj: string): Promise<Company | null> {
    return this.findOne({ cnpj })
  }

  /**
   * Listar empresas ativas
   */
  async findActive() {
    return this.findAll({ filters: { is_active: true } })
  }

  /**
   * Sobrescrever findAll para suportar busca textual no banco de dados
   * A busca é aplicada ANTES da paginação para garantir metadados corretos
   */
  async findAll(options: CompanyFindAllOptions = {}): Promise<PaginatedResult<Company>> {
    try {
      const {
        page = 1,
        limit = 100,
        offset,
        filters = {},
        search,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = options

      const calculatedOffset = offset !== undefined ? offset : (page - 1) * limit

      // Construir query base
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })

      // Aplicar filtros simples primeiro
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

      // Aplicar busca textual no nível do banco ANTES da paginação
      // Isso garante que o count reflete os resultados filtrados
      if (search && search.trim()) {
        const searchPattern = search.trim()
        // Busca em name OU cnpj usando OR condition do Supabase/PostgREST
        // Formato: column.operator.pattern,column2.operator.pattern
        // O % é usado como wildcard no padrão ilike do Postgres
        query = query.or(`name.ilike.%${searchPattern}%,cnpj.ilike.%${searchPattern}%`)
      }

      // Ordenação
      query = query.order(orderBy, { ascending: orderDirection === 'asc' })

      // Paginação aplicada DEPOIS dos filtros
      query = query.range(calculatedOffset, calculatedOffset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        logger.error(`Erro ao listar ${this.tableName}`, { error })
        throw new Error(`Erro ao listar ${this.tableName}: ${error.message}`)
      }

      const totalPages = count ? Math.ceil(count / limit) : 0

      return {
        data: (data || []) as Company[],
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
}

