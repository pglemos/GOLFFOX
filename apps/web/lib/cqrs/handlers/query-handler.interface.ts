/**
 * Query Handler Interface
 * 
 * Interface para handlers de queries
 */

export interface IQueryHandler<TQuery, TResult> {
  handle(query: TQuery): Promise<TResult>
}
