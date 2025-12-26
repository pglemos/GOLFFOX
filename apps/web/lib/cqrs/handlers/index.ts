/**
 * CQRS Handlers - Índice
 * 
 * Exporta todos os handlers de commands e queries
 */

// Interfaces
export type { ICommandHandler } from './command-handler.interface'
export type { IQueryHandler } from './query-handler.interface'

// Command Handlers
export { CreateCompanyHandler } from './create-company.handler'
export { UpdateVehicleHandler, updateVehicleHandler } from './update-vehicle.handler'
export type { UpdateVehicleResult } from './update-vehicle.handler'

// Query Handlers
export { GetCompanyHandler, getCompanyHandler } from './get-company.handler'
export type { GetCompanyResult } from './get-company.handler'
export { ListVehiclesHandler, listVehiclesHandler } from './list-vehicles.handler'
export type { ListVehiclesResult } from './list-vehicles.handler'
