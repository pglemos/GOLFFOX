/**
 * Command Handler Interface
 * 
 * Interface para handlers de commands
 */

export interface ICommandHandler<TCommand, TResult> {
  handle(command: TCommand): Promise<TResult>
}
