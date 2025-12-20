/**
 * Register CQRS Handlers
 * 
 * Registra todos os handlers no CQRS Bus
 */

import { cqrsBus } from './cqrs-bus'
import { CreateCompanyHandler } from '../handlers/create-company.handler'
import { CreateCompanyCommand } from '../commands/create-company.command'

// Registrar handlers
const createCompanyHandler = new CreateCompanyHandler()
cqrsBus.registerCommandHandler<CreateCompanyCommand, any>(
  'CreateCompanyCommand',
  createCompanyHandler
)

// Exportar função para inicialização (opcional)
export function registerAllHandlers() {
  // Handlers já registrados acima
  // Adicionar mais handlers conforme necessário
}

