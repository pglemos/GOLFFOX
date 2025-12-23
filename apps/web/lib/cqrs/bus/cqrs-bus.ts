/**
 * CQRS Bus
 * 
 * Message bus para executar commands e queries
 */

import { logError } from '@/lib/logger'

import { ICommandHandler } from '../handlers/command-handler.interface'
import { IQueryHandler } from '../handlers/query-handler.interface'

// Usar string como identificador ao invés de constructor
type CommandType = string
type QueryType = string

class CQRSBus {
  private commandHandlers = new Map<CommandType, ICommandHandler<any, any>>()
  private queryHandlers = new Map<QueryType, IQueryHandler<any, any>>()

  /**
   * Registrar command handler
   */
  registerCommandHandler<TCommand, TResult>(
    commandType: CommandType,
    handler: ICommandHandler<TCommand, TResult>
  ): void {
    this.commandHandlers.set(commandType, handler)
  }

  /**
   * Registrar query handler
   */
  registerQueryHandler<TQuery, TResult>(
    queryType: QueryType,
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    this.queryHandlers.set(queryType, handler)
  }

  /**
   * Executar command
   */
  async executeCommand<TCommand extends { type: string }, TResult>(command: TCommand): Promise<TResult> {
    const commandType = command.type
    const handler = this.commandHandlers.get(commandType)

    if (!handler) {
      const error = new Error(`Handler não encontrado para command: ${commandType}`)
      logError('Command handler não encontrado', { commandType }, 'CQRSBus')
      throw error
    }

    try {
      return await handler.handle(command)
    } catch (error) {
      logError('Erro ao executar command', { 
        error, 
        commandType 
      }, 'CQRSBus')
      throw error
    }
  }

  /**
   * Executar query
   */
  async executeQuery<TQuery extends { type: string }, TResult>(query: TQuery): Promise<TResult> {
    const queryType = query.type
    const handler = this.queryHandlers.get(queryType)

    if (!handler) {
      const error = new Error(`Handler não encontrado para query: ${queryType}`)
      logError('Query handler não encontrado', { queryType }, 'CQRSBus')
      throw error
    }

    try {
      return await handler.handle(query)
    } catch (error) {
      logError('Erro ao executar query', { 
        error, 
        queryType 
      }, 'CQRSBus')
      throw error
    }
  }
}

// Singleton
export const cqrsBus = new CQRSBus()
