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

export class ListVehiclesQuery {
  readonly type = 'ListVehiclesQuery'
  constructor(public readonly filters: ListVehiclesQueryFilters = {}) {}
}
