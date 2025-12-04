/**
 * Testes para Supabase Server
 */

import { supabaseServiceRole, getSupabaseAdmin } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

describe('Supabase Server', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    // Reset singleton
    ;(supabaseServiceRole as any)._supabaseServiceRole = null
  })

  describe('supabaseServiceRole', () => {
    it('deve criar cliente quando variáveis de ambiente estão configuradas', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

      const mockClient = {
        from: jest.fn(),
        auth: {},
      }
      ;(createClient as jest.Mock).mockReturnValue(mockClient)

      // Acessar propriedade para triggerar criação
      const _ = supabaseServiceRole.from

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'service-role-key',
        expect.objectContaining({
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      )
    })

    it('deve usar SUPABASE_SERVICE_ROLE como fallback', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      process.env.SUPABASE_SERVICE_ROLE = 'fallback-key'

      const mockClient = {
        from: jest.fn(),
        auth: {},
      }
      ;(createClient as jest.Mock).mockReturnValue(mockClient)

      const _ = supabaseServiceRole.from

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'fallback-key',
        expect.any(Object)
      )
    })

    it('deve lançar erro quando URL não está configurada', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

      expect(() => {
        const _ = supabaseServiceRole.from
      }).toThrow('Supabase service role não configurado')
    })

    it('deve lançar erro quando key não está configurada', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      delete process.env.SUPABASE_SERVICE_ROLE

      expect(() => {
        const _ = supabaseServiceRole.from
      }).toThrow('Supabase service role não configurado')
    })

    it('deve reutilizar cliente singleton', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

      const mockClient = {
        from: jest.fn(),
        auth: {},
      }
      ;(createClient as jest.Mock).mockReturnValue(mockClient)

      const _1 = supabaseServiceRole.from
      const _2 = supabaseServiceRole.from

      expect(createClient).toHaveBeenCalledTimes(1)
    })

    it('deve fazer bind de funções corretamente', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

      const mockFrom = jest.fn()
      const mockClient = {
        from: mockFrom,
        auth: {},
      }
      ;(createClient as jest.Mock).mockReturnValue(mockClient)

      const fromFn = supabaseServiceRole.from
      expect(typeof fromFn).toBe('function')

      fromFn('test-table')
      expect(mockFrom).toHaveBeenCalledWith('test-table')
    })
  })

  describe('getSupabaseAdmin', () => {
    it('deve retornar cliente Supabase', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

      const mockClient = {
        from: jest.fn(),
        auth: {},
      }
      ;(createClient as jest.Mock).mockReturnValue(mockClient)

      const client = getSupabaseAdmin()

      expect(client).toBe(mockClient)
    })
  })
})

