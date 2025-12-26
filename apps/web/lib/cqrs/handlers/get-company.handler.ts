/**
 * Get Company Query Handler
 * 
 * Handler para executar GetCompanyQuery
 */

import { CompanyService } from '@/lib/services/server/company-service'
import { logError } from '@/lib/logger'

import { IQueryHandler } from './query-handler.interface'
import { GetCompanyQuery } from '../queries/get-company.query'

export interface GetCompanyResult {
    success: boolean
    company?: {
        id: string
        name: string
        cnpj?: string | null
        email?: string | null
        phone?: string | null
        address?: string | null
        is_active?: boolean | null
        created_at?: string | null
        updated_at?: string | null
    }
    error?: string
}

export class GetCompanyHandler implements IQueryHandler<GetCompanyQuery, GetCompanyResult> {
    async handle(query: GetCompanyQuery): Promise<GetCompanyResult> {
        try {
            const { companyId } = query

            // Validar ID
            if (!companyId) {
                return {
                    success: false,
                    error: 'ID da empresa é obrigatório'
                }
            }

            // Usar o CompanyService que já tem cache
            const company = await CompanyService.getCompanyById(companyId)

            if (!company) {
                return {
                    success: false,
                    error: 'Empresa não encontrada'
                }
            }

            return {
                success: true,
                company: {
                    id: company.id,
                    name: company.name || '',
                    cnpj: company.cnpj,
                    email: company.email,
                    phone: company.phone,
                    address: company.address,
                    is_active: company.is_active,
                    created_at: company.created_at,
                    updated_at: company.updated_at
                }
            }
        } catch (error) {
            logError('Exceção ao buscar empresa', { error, companyId: query.companyId }, 'GetCompanyHandler')
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }
        }
    }
}

// Instância singleton do handler
export const getCompanyHandler = new GetCompanyHandler()
