/**
 * Company Repository
 * Acesso a dados de empresas usando padrão Repository
 */

import { BaseRepository } from './base.repository'

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
}

