/**
 * Testes para garantir que o cliente Supabase não altera globalThis.fetch
 * e que o cliente é instanciado corretamente com variáveis de ambiente.
 */

describe('supabase client bootstrap', () => {
  const originalFetch = globalThis.fetch

  beforeAll(() => {
    // Garantir que existem variáveis de ambiente para criar o cliente
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key'
  })

  afterAll(() => {
    // Restaurar fetch se algum teste o modificar
    globalThis.fetch = originalFetch
  })

  it('does not monkey-patch globalThis.fetch', async () => {
    const before = globalThis.fetch
    const mod = await import('../supabase')
    const after = globalThis.fetch
    expect(mod.supabase).toBeTruthy()
    expect(after).toBe(before)
  })
})

