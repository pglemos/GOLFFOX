import { createClient } from '@supabase/supabase-js'
import type { BrazilianAddress } from '../address-validator'

export interface EmployeeRecord {
  id: string
  fullName: string
  address: BrazilianAddress
  routeId?: string
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

// Tenta diferentes fontes de dados para obter funcionários.
export async function getEmployeesForRoute(routeId: string, employeeDb?: string, limit?: number): Promise<EmployeeRecord[]> {
  const supabase = getSupabase()
  const table = employeeDb || process.env.NEXT_PUBLIC_EMPLOYEE_DB_TABLE || 'gf_employee_company'

  try {
    const { data, error } = await supabase
      .from(table)
      .select('id, name, street, number, neighborhood, city, state, cep, route_id')
      .eq('route_id', routeId)
      .limit(limit || 1000)

    if (error) throw error
    if (!data || data.length === 0) return []

    return data.map((row: any) => ({
      id: row.id,
      fullName: row.name,
      routeId: row.route_id,
      address: {
        street: row.street,
        number: row.number,
        neighborhood: row.neighborhood,
        city: row.city,
        state: row.state,
        cep: row.cep,
      },
    }))
  } catch (e) {
    // Fallback genérico: tentar a tabela users + ligação por outra tabela (se existir)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, street, number, neighborhood, city, state, cep, route_id, role')
        .eq('route_id', routeId)
        .eq('role', 'employee')
        .limit(limit || 1000)

      if (error) throw error
      if (!data || data.length === 0) return []

      return data.map((row: any) => ({
        id: row.id,
        fullName: row.full_name,
        routeId: row.route_id,
        address: {
          street: row.street,
          number: row.number,
          neighborhood: row.neighborhood,
          city: row.city,
          state: row.state,
          cep: row.cep,
        },
      }))
    } catch {
      return []
    }
  }
}
