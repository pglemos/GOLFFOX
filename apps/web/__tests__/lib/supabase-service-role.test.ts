/**
 * Testes para Supabase Service Role (re-export)
 */

import { supabaseServiceRole } from '@/lib/supabase-service-role'

describe('Supabase Service Role', () => {
  it('deve exportar supabaseServiceRole', () => {
    expect(supabaseServiceRole).toBeDefined()
  })
})

