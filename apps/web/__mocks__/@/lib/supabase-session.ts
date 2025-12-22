/**
 * Mock para @/lib/supabase-session
 * Jest automaticamente usa este arquivo quando @/lib/supabase-session é importado
 */

export const ensureSupabaseSession = jest.fn().mockResolvedValue(null)

