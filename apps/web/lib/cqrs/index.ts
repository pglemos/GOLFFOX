/**
 * CQRS Layer
 * 
 * Exporta commands, queries, handlers e bus
 */

// Commands
export * from './commands/create-company.command'
export * from './commands/update-vehicle.command'
export * from './commands/create-vehicle.command'
export * from './commands/create-driver.command'
export * from './commands/create-route.command'
export * from './commands/create-carrier.command'

// Queries
export * from './queries/get-company.query'
export * from './queries/list-vehicles.query'

// Handlers - Interfaces
export * from './handlers/command-handler.interface'
export * from './handlers/query-handler.interface'

// Handlers - Command Handlers
export * from './handlers/create-company.handler'
export * from './handlers/update-vehicle.handler'

// Handlers - Query Handlers
export * from './handlers/get-company.handler'
export * from './handlers/list-vehicles.handler'

// Bus
export * from './bus/cqrs-bus'
export { initializeCQRSHandlers } from './bus/register-handlers'
