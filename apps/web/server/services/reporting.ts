import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE) as string
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function fetchReportRange(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  viewName: string,
  columns: string[],
  filters: { companyId?: string; periodStart?: string; periodEnd?: string },
  limit: number,
  offset: number,
) {
  const sel = columns.join(',')
  let query = supabase.from(viewName).select(sel)
  if (filters.companyId) query = query.eq('company_id', filters.companyId)
  if (filters.periodStart) query = query.gte('period_start', filters.periodStart)
  if (filters.periodEnd) query = query.lte('period_end', filters.periodEnd)
  return query.range(offset, offset + limit - 1)
}

