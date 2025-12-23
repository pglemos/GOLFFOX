/**
 * Company Service
 * Lógica de negócio para gestão de empresas
 */

import { withCache, cacheService } from '@/lib/cache/cache.service'
import { publishCreatedEvent } from '@/lib/events'
import { logger } from '@/lib/logger'
import { cacheDataFetch } from '@/lib/react-cache'
import { CompanyRepository, type Company as CompanyEntity } from '@/lib/repositories'

export interface CompanyFilters {
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface CreateCompanyData {
  name: string
  cnpj?: string | null
  address?: string | null
  address_zip_code?: string | null
  address_street?: string | null
  address_number?: string | null
  address_neighborhood?: string | null
  address_complement?: string | null
  address_city?: string | null
  address_state?: string | null
  phone?: string | null
  email?: string | null
}

export type Company = CompanyEntity

const companyRepository = new CompanyRepository()

export class CompanyService {
  /**
   * Listar empresas com filtros e paginação
   */
  static async listCompanies(filters: CompanyFilters = {}) {
    try {
      const {
        isActive,
        search,
        limit = 100,
        offset = 0
      } = filters

      const page = Math.floor(offset / limit) + 1

      // Construir filtros para o repositório
      const repoFilters: Record<string, unknown> = {}
      if (isActive !== undefined) {
        repoFilters.is_active = isActive
      }

      // Usar cache para listagens frequentes
      const cacheKey = `companies:list:${JSON.stringify({ isActive, search, page, limit })}`

      return await withCache(cacheKey, async () => {
        // Passar busca para o repositório ANTES da paginação
        // Isso garante que count, totalPages, hasNext e hasPrev refletem os resultados filtrados
        const result = await companyRepository.findAll({
          page,
          limit,
          filters: repoFilters,
          search: search?.trim() || undefined, // Busca aplicada no banco antes da paginação
          orderBy: 'created_at',
          orderDirection: 'desc'
        })

        return {
          data: result.data,
          count: result.count,
          limit: result.limit,
          offset: (result.page - 1) * result.limit,
          page: result.page,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev
        }
      }, 2 * 60 * 1000) // Cache de 2 minutos
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
      const { name, cnpj, address, phone, email } = companyData

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Nome da empresa é obrigatório')
      }

      // Validar CNPJ único se fornecido
      if (cnpj) {
        const existingCompany = await companyRepository.findByCnpj(cnpj)
        if (existingCompany) {
          throw new Error('Uma empresa com este CNPJ já existe')
        }
      }

      const company = await companyRepository.create({
        name: name.trim(),
        cnpj: cnpj?.trim() || null,
        address: address?.trim() || null,
        address_zip_code: companyData.address_zip_code?.trim() || null,
        address_street: companyData.address_street?.trim() || null,
        address_number: companyData.address_number?.trim() || null,
        address_neighborhood: companyData.address_neighborhood?.trim() || null,
        address_complement: companyData.address_complement?.trim() || null,
        address_city: companyData.address_city?.trim() || null,
        address_state: companyData.address_state?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Company)

      // Invalidar cache (não deve quebrar a operação se falhar)
      try {
        cacheService.invalidatePattern('companies:list:*')
      } catch (cacheError) {
        logger.warn('Erro ao invalidar cache após criar empresa', { error: cacheError, companyId: company.id })
        // Não relança o erro - a operação principal foi bem-sucedida
      }

      // Publicar evento de criação (Event Sourcing)
      try {
        await publishCreatedEvent(
          'Company',
          company.id,
          {
            name: company.name,
            cnpj: company.cnpj,
            email: company.email,
            phone: company.phone,
          },
          undefined // userId será adicionado nas rotas API
        )
      } catch (eventError) {
        logger.warn('Erro ao publicar evento de criação de empresa', { error: eventError, companyId: company.id })
        // Não relança o erro - evento não deve quebrar a operação
      }

      return company
    } catch (error) {
      logger.error('Erro ao criar empresa', { error })
      throw error
    }
  }

  /**
   * Buscar empresa por ID
   * Usa cache() do React para memoização automática por request
   */
  private static getCompanyByIdCached = cacheDataFetch(
    async (companyId: string): Promise<Company | null> => {
      return await companyRepository.findById(companyId)
    },
    'getCompanyById'
  )

  static async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      // Usar cache do React para memoização por request
      // Também manter cache em memória para requests subsequentes
      const cacheKey = `companies:${companyId}`
      const cached = cacheService.get<Company | null>(cacheKey)
      if (cached !== null) {
        return cached
      }

      const company = await this.getCompanyByIdCached(companyId)
      if (company) {
        cacheService.set(cacheKey, company, 5 * 60 * 1000) // Cache de 5 minutos
      }
      return company
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
      // Validar CNPJ único se fornecido e diferente do atual
      if (updateData.cnpj) {
        const existingCompany = await companyRepository.findById(companyId)
        if (existingCompany && existingCompany.cnpj !== updateData.cnpj) {
          const duplicateCompany = await companyRepository.findByCnpj(updateData.cnpj)
          if (duplicateCompany) {
            throw new Error('Uma empresa com este CNPJ já existe')
          }
        }
      }

      const updatePayload: Partial<Company> = {
        updated_at: new Date().toISOString()
      }

      if (updateData.name !== undefined) updatePayload.name = updateData.name.trim()
      if (updateData.cnpj !== undefined) updatePayload.cnpj = updateData.cnpj?.trim() || null
      if (updateData.address !== undefined) updatePayload.address = updateData.address?.trim() || null
      if (updateData.address_zip_code !== undefined) updatePayload.address_zip_code = updateData.address_zip_code?.trim() || null
      if (updateData.address_street !== undefined) updatePayload.address_street = updateData.address_street?.trim() || null
      if (updateData.address_number !== undefined) updatePayload.address_number = updateData.address_number?.trim() || null
      if (updateData.address_neighborhood !== undefined) updatePayload.address_neighborhood = updateData.address_neighborhood?.trim() || null
      if (updateData.address_complement !== undefined) updatePayload.address_complement = updateData.address_complement?.trim() || null
      if (updateData.address_city !== undefined) updatePayload.address_city = updateData.address_city?.trim() || null
      if (updateData.address_state !== undefined) updatePayload.address_state = updateData.address_state?.trim() || null
      if (updateData.phone !== undefined) updatePayload.phone = updateData.phone?.trim() || null
      if (updateData.email !== undefined) updatePayload.email = updateData.email?.trim() || null
      if (updateData.is_active !== undefined) updatePayload.is_active = updateData.is_active

      const company = await companyRepository.update(companyId, updatePayload)

      // Invalidar cache (não deve quebrar a operação se falhar)
      try {
        cacheService.invalidate(`companies:${companyId}`)
        cacheService.invalidatePattern('companies:list:*')
      } catch (cacheError) {
        logger.warn('Erro ao invalidar cache após atualizar empresa', { error: cacheError, companyId })
        // Não relança o erro - a operação principal foi bem-sucedida
      }

      return company
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
      await companyRepository.delete(companyId, hardDelete)

      // Invalidar cache (não deve quebrar a operação se falhar)
      try {
        cacheService.invalidate(`companies:${companyId}`)
        cacheService.invalidatePattern('companies:list:*')
      } catch (cacheError) {
        logger.warn('Erro ao invalidar cache após deletar empresa', { error: cacheError, companyId })
        // Não relança o erro - a operação principal foi bem-sucedida
      }
    } catch (error) {
      logger.error('Erro ao deletar empresa', { error, companyId })
      throw error
    }
  }
}

