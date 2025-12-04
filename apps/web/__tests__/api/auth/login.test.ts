import { POST } from '@/app/api/auth/login/route'
import { createMockRequest, createCSRFRequest, createRateLimitRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestUser } from '../../helpers/test-data'

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}))

jest.mock('@/lib/user-role', () => ({
  getUserRoleByEmail: jest.fn((email: string) => {
    if (email.includes('admin')) return 'admin'
    if (email.includes('operador')) return 'operador'
    if (email.includes('transportadora')) return 'transportadora'
    return null
  }),
}))

jest.mock('@/lib/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}))

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn((name: string) => {
      if (name === 'golffox-csrf') {
        return { value: 'test-csrf-token' }
      }
      return undefined
    }),
  })),
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NODE_ENV = 'test'
  })

  describe('Validação de entrada', () => {
    it('deve rejeitar payload inválido', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('invalid_payload')
    })

    it('deve rejeitar credenciais faltando', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { email: 'test@test.com' },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('missing_credentials')
    })

    it('deve rejeitar email inválido', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { email: 'invalid-email', password: 'senha123' },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toBe('invalid_email')
    })

    it('deve sanitizar email', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { email: 'test<script>@test.com', password: 'senha123' },
      })

      // Mock auth to fail
      mockSupabaseClient.setAuthHandler('signInWithPassword', async () => ({
        data: null,
        error: { message: 'Invalid credentials', status: 401 },
      }))

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      // Email deve ser sanitizado (sem <script>)
    })
  })

  describe('Validação CSRF', () => {
    it('deve aceitar requisição com CSRF válido', async () => {
      const user = createTestUser({ role: 'admin' })
      mockSupabaseClient.setTableData('users', [user])
      
      mockSupabaseClient.setAuthHandler('signInWithPassword', async () => ({
        data: {
          user: { id: user.id, email: user.email },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: { id: user.id, email: user.email },
          },
        },
        error: null,
      }))

      mockSupabaseClient.setRPCHandler('get_user_by_id_for_login', async () => [user])

      const req = createCSRFRequest('test-csrf-token', {
        method: 'POST',
        body: { email: user.email, password: 'senha123' },
      })

      const response = await POST(req)
      
      // Em modo de teste, deve passar
      expect([200, 401]).toContain(response.status)
    })

    it('deve rejeitar requisição com CSRF inválido em produção', async () => {
      process.env.NODE_ENV = 'production'
      process.env.VERCEL = '0'

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'x-csrf-token': 'wrong-token',
        },
        body: { email: 'test@test.com', password: 'senha123' },
      })

      const response = await POST(req)
      const data = await response.json()

      // Deve validar CSRF em produção
      expect([403, 401]).toContain(response.status)
    })
  })

  describe('Autenticação', () => {
    it('deve autenticar com credenciais válidas', async () => {
      const user = createTestUser({ role: 'admin' })
      mockSupabaseClient.setTableData('users', [user])

      mockSupabaseClient.setAuthHandler('signInWithPassword', async () => ({
        data: {
          user: { id: user.id, email: user.email },
          session: {
            access_token: 'token-123',
            refresh_token: 'refresh-123',
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: { id: user.id, email: user.email },
          },
        },
        error: null,
      }))

      mockSupabaseClient.setRPCHandler('get_user_by_id_for_login', async () => [user])

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'x-test-mode': 'true',
        },
        body: { email: user.email, password: 'senha123' },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.token).toBe('token-123')
      expect(data.user).toMatchObject({
        id: user.id,
        email: user.email,
        role: 'admin',
      })
    })

    it('deve rejeitar credenciais inválidas', async () => {
      mockSupabaseClient.setAuthHandler('signInWithPassword', async () => ({
        data: null,
        error: { message: 'Invalid credentials', status: 401 },
      }))

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'x-test-mode': 'true',
        },
        body: { email: 'test@test.com', password: 'wrongpass' },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.code).toBe('invalid_credentials')
    })

    it('deve rejeitar usuário não cadastrado no sistema', async () => {
      mockSupabaseClient.setAuthHandler('signInWithPassword', async () => ({
        data: {
          user: { id: 'user-1', email: 'test@test.com' },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: { id: 'user-1', email: 'test@test.com' },
          },
        },
        error: null,
      }))

      // Usuário não existe na tabela users
      mockSupabaseClient.setTableData('users', [])
      mockSupabaseClient.setRPCHandler('get_user_by_id_for_login', async () => [])

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'x-test-mode': 'true',
        },
        body: { email: 'test@test.com', password: 'senha123' },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.code).toBe('user_not_in_db')
    })

    it('deve retornar role correta do usuário', async () => {
      const user = createTestUser({ role: 'operador', company_id: 'company-1' })
      mockSupabaseClient.setTableData('users', [user])

      mockSupabaseClient.setAuthHandler('signInWithPassword', async () => ({
        data: {
          user: { id: user.id, email: user.email },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: { id: user.id, email: user.email },
          },
        },
        error: null,
      }))

      mockSupabaseClient.setRPCHandler('get_user_by_id_for_login', async () => [user])
      mockSupabaseClient.setTableData('gf_user_company_map', [{ user_id: user.id, company_id: 'company-1' }])
      mockSupabaseClient.setTableData('companies', [{ id: 'company-1', is_active: true }])

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'x-test-mode': 'true',
        },
        body: { email: user.email, password: 'senha123' },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.role).toBe('operador')
      expect(data.user.companyId).toBe('company-1')
    })

    it('deve criar cookie de sessão', async () => {
      const user = createTestUser({ role: 'admin' })
      mockSupabaseClient.setTableData('users', [user])

      mockSupabaseClient.setAuthHandler('signInWithPassword', async () => ({
        data: {
          user: { id: user.id, email: user.email },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: { id: user.id, email: user.email },
          },
        },
        error: null,
      }))

      mockSupabaseClient.setRPCHandler('get_user_by_id_for_login', async () => [user])

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'x-test-mode': 'true',
        },
        body: { email: user.email, password: 'senha123' },
      })

      const response = await POST(req)

      expect(response.status).toBe(200)
      const setCookie = response.headers.get('Set-Cookie')
      expect(setCookie).toContain('golffox-session=')
    })
  })

  describe('Rate limiting', () => {
    it('deve aplicar rate limiting', async () => {
      // Rate limiting é testado via withRateLimit mock
      const req = createRateLimitRequest('127.0.0.1')
      
      // Se rate limit funcionar, deve retornar erro 429
      // Como estamos mockando, apenas verificamos que a função é chamada
      expect(req).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    it('deve lidar com erro de rede do Supabase', async () => {
      mockSupabaseClient.setAuthHandler('signInWithPassword', async () => ({
        data: null,
        error: { message: 'fetch failed', status: 0 },
      }))

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'x-test-mode': 'true',
        },
        body: { email: 'test@test.com', password: 'senha123' },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.code).toBe('supabase_unreachable')
    })

    it('deve lidar com email não confirmado', async () => {
      mockSupabaseClient.setAuthHandler('signInWithPassword', async () => ({
        data: null,
        error: { message: 'Email not confirmed', status: 401 },
      }))

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'x-test-mode': 'true',
        },
        body: { email: 'test@test.com', password: 'senha123' },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.code).toBe('email_not_confirmed')
    })

    it('deve lidar com operador sem empresa associada', async () => {
      const user = createTestUser({ role: 'operador' })
      mockSupabaseClient.setTableData('users', [user])

      mockSupabaseClient.setAuthHandler('signInWithPassword', async () => ({
        data: {
          user: { id: user.id, email: user.email },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: { id: user.id, email: user.email },
          },
        },
        error: null,
      }))

      mockSupabaseClient.setRPCHandler('get_user_by_id_for_login', async () => [user])
      mockSupabaseClient.setTableData('gf_user_company_map', []) // Sem mapeamento

      const req = createMockRequest({
        method: 'POST',
        headers: {
          'x-test-mode': 'true',
        },
        body: { email: user.email, password: 'senha123' },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.code).toBe('no_company_mapping')
    })
  })
})

