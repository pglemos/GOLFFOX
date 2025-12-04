import { validateEnv, getEnvVars, isDevelopment } from '@/lib/env'

describe('lib/env', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validateEnv', () => {
    it('deve validar variáveis obrigatórias', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJ' + 'a'.repeat(100)
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIza' + 'a'.repeat(35)

      const result = validateEnv()

      expect(result.isValid).toBe(true)
      expect(result.missing).toHaveLength(0)
      expect(result.invalid).toHaveLength(0)
    })

    it('deve detectar variáveis faltando', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const result = validateEnv()

      expect(result.isValid).toBe(false)
      expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_URL')
    })

    it('deve validar formato de URL do Supabase', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url'

      const result = validateEnv()

      expect(result.isValid).toBe(false)
      expect(result.invalid.some(i => i.key === 'NEXT_PUBLIC_SUPABASE_URL')).toBe(true)
    })

    it('deve validar formato de API Key do Supabase', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'invalid-key'

      const result = validateEnv()

      expect(result.isValid).toBe(false)
      expect(result.invalid.some(i => i.key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY')).toBe(true)
    })

    it('deve validar formato de email opcional', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJ' + 'a'.repeat(100)
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIza' + 'a'.repeat(35)
      process.env.REPORTS_FROM_EMAIL = 'invalid-email'

      const result = validateEnv()

      expect(result.invalid.some(i => i.key === 'REPORTS_FROM_EMAIL')).toBe(true)
    })
  })

  describe('getEnvVars', () => {
    it('deve retornar variáveis de ambiente', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJ' + 'a'.repeat(100)

      const vars = getEnvVars()

      expect(vars.supabaseUrl).toBe('https://test.supabase.co')
      expect(vars.supabaseAnonKey).toBeDefined()
      expect(vars.validation).toBeDefined()
    })
  })

  describe('isDevelopment', () => {
    it('deve retornar true em desenvolvimento', () => {
      process.env.NODE_ENV = 'development'
      expect(isDevelopment()).toBe(true)
    })

    it('deve retornar false em produção', () => {
      process.env.NODE_ENV = 'production'
      expect(isDevelopment()).toBe(false)
    })
  })
})

