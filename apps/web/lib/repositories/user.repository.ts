/**
 * User Repository
 * Acesso a dados de usuários usando padrão Repository
 */

import { BaseRepository } from './base.repository'

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

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users')
  }

  /**
   * Buscar usuário por email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() })
  }

  /**
   * Buscar usuários por empresa
   */
  async findByCompany(companyId: string) {
    return this.findAll({ filters: { company_id: companyId } })
  }

  /**
   * Buscar usuários por role
   */
  async findByRole(role: string) {
    return this.findAll({ filters: { role } })
  }
}

