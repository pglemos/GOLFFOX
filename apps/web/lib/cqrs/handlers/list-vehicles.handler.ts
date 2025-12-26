/**
 * List Vehicles Query Handler
 * 
 * Handler para executar ListVehiclesQuery
 */

import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'

import { IQueryHandler } from './query-handler.interface'
import { ListVeiculosQuery, ListVehiclesQueryFilters } from '../queries/list-vehicles.query'

type VeiculoRow = Database['public']['Tables']['veiculos']['Row']

export interface ListVehiclesResult {
    success: boolean
    vehicles?: VeiculoRow[]
    count?: number
    page?: number
    limit?: number
    error?: string
}

export class ListVehiclesHandler implements IQueryHandler<ListVeiculosQuery, ListVehiclesResult> {
    async handle(query: ListVeiculosQuery): Promise<ListVehiclesResult> {
        try {
            const supabase = getSupabaseAdmin()
            const filters = query.filters || {}

            // Valores padrão para paginação
            const page = filters.page || 1
            const limit = filters.limit || 20
            const offset = (page - 1) * limit

            // Construir query
            let dbQuery = supabase
                .from('veiculos')
                .select('*', { count: 'exact' })

            // Aplicar filtros
            if (filters.company_id) {
                dbQuery = dbQuery.eq('company_id', filters.company_id)
            }

            if (filters.transportadora_id) {
                dbQuery = dbQuery.eq('transportadora_id', filters.transportadora_id)
            }

            if (filters.is_active !== undefined) {
                dbQuery = dbQuery.eq('is_active', filters.is_active)
            }

            // Aplicar ordenação e paginação
            const { data: vehicles, error, count } = await dbQuery
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

            if (error) {
                logError('Erro ao listar veículos', { error, filters }, 'ListVehiclesHandler')
                return {
                    success: false,
                    error: error.message
                }
            }

            return {
                success: true,
                vehicles: vehicles || [],
                count: count || 0,
                page,
                limit
            }
        } catch (error) {
            logError('Exceção ao listar veículos', { error }, 'ListVehiclesHandler')
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }
        }
    }
}

// Instância singleton do handler
export const listVehiclesHandler = new ListVehiclesHandler()
