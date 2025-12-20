/**
 * List Vehicles Query
 * 
 * Query para listar veículos com filtros
 */

export interface ListVehiclesQueryFilters {
  company_id?: string
  transportadora_id?: string
  is_active?: boolean
  page?: number
  limit?: number
}

export class ListVeiculosQuery {
  readonly type = 'ListVeiculosQuery'
  constructor(public readonly filters: ListVehiclesQueryFilters = {}) {}
}
