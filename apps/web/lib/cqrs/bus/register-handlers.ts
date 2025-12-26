/**
 * Register CQRS Handlers
 * 
 * Registra todos os handlers no CQRS Bus
 */

import { cqrsBus } from './cqrs-bus'
import { debug } from '@/lib/logger'

// Commands
import { CreateCompanyCommand } from '../commands/create-company.command'
import { UpdateVeiculoCommand } from '../commands/update-vehicle.command'

// Queries
import { GetCompanyQuery } from '../queries/get-company.query'
import { ListVeiculosQuery } from '../queries/list-vehicles.query'

// Command Handlers
import { CreateCompanyHandler } from '../handlers/create-company.handler'
import { UpdateVehicleHandler } from '../handlers/update-vehicle.handler'

// Query Handlers
import { GetCompanyHandler } from '../handlers/get-company.handler'
import { ListVehiclesHandler } from '../handlers/list-vehicles.handler'

// ============================================
// Registrar Command Handlers
// ============================================

const createCompanyHandler = new CreateCompanyHandler()
cqrsBus.registerCommandHandler<CreateCompanyCommand, any>(
  'CreateCompanyCommand',
  createCompanyHandler
)

const updateVehicleHandler = new UpdateVehicleHandler()
cqrsBus.registerCommandHandler<UpdateVeiculoCommand, any>(
  'UpdateVeiculoCommand',
  updateVehicleHandler
)

// ============================================
// Registrar Query Handlers
// ============================================

const getCompanyHandler = new GetCompanyHandler()
cqrsBus.registerQueryHandler<GetCompanyQuery, any>(
  'GetCompanyQuery',
  getCompanyHandler
)

const listVehiclesHandler = new ListVehiclesHandler()
cqrsBus.registerQueryHandler<ListVeiculosQuery, any>(
  'ListVeiculosQuery',
  listVehiclesHandler
)

// ============================================
// Função de inicialização (opcional)
// ============================================

export function initializeCQRSHandlers(): void {
  // Os handlers já são registrados ao importar este arquivo
  // Esta função existe para uso explícito se necessário
  debug('[CQRS] Handlers inicializados')
}

// Exportar bus configurado
export { cqrsBus }
