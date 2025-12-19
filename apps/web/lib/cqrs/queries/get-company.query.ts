/**
 * Get Company Query
 * 
 * Query para obter uma empresa por ID
 */

export class GetCompanyQuery {
  readonly type = 'GetCompanyQuery'
  constructor(public readonly companyId: string) {}
}
