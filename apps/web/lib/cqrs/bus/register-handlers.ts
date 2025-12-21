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

// Handlers são registrados diretamente acima
// Se necessário criar função de inicialização no futuro, adicionar aqui

