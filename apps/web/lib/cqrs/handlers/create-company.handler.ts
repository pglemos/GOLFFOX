/**
 * Create Company Command Handler
 * 
 * Handler para executar CreateCompanyCommand
 */

import { ICommandHandler } from './command-handler.interface'
import { CreateCompanyCommand } from '../commands/create-company.command'
import { CompanyService } from '@/lib/services/company.service'
import { publishCreatedEvent } from '@/lib/events'

export class CreateCompanyHandler implements ICommandHandler<CreateCompanyCommand, any> {
  async handle(command: CreateCompanyCommand): Promise<any> {
    const company = await CompanyService.createCompany({
      name: command.payload.name,
      email: command.payload.email || undefined,
      phone: command.payload.phone || undefined,
    })

    // Evento já é publicado pelo CompanyService.createCompany
    // Mas podemos adicionar metadata adicional se necessário

    return company
  }
}

