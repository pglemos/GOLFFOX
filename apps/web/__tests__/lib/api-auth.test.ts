import { hasRole, requireAuth } from '@/lib/api-auth'
import { createMockRequest, createAdminRequest, createOperatorRequest } from '../helpers/api-test-helpers'
import { mockSupabaseClient } from '../helpers/mock-supabase'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('lib/api-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  describe('hasRole', () => {
    it('deve retornar true para admin acessando admin', () => {
      const user = { id: '1', email: 'admin@test.com', role: 'admin' }
      expect(hasRole(user, 'admin')).toBe(true)
    })

    it('deve retornar false para operador acessando admin', () => {
      const user = { id: '2', email: 'operador@test.com', role: 'operador' }
      expect(hasRole(user, 'admin')).toBe(false)
    })

    it('deve retornar true para admin acessando operador', () => {
      const user = { id: '3', email: 'admin@test.com', role: 'admin' }
      expect(hasRole(user, 'operador')).toBe(true)
    })

    it('deve retornar true para operador acessando operador', () => {
      const user = { id: '4', email: 'operador@test.com', role: 'operador' }
      expect(hasRole(user, 'operador')).toBe(true)
    })

    it('deve retornar false para transportadora acessando operador', () => {
      const user = { id: '5', email: 'transportadora@test.com', role: 'transportadora' }
      expect(hasRole(user, 'operador')).toBe(false)
    })

    it('deve aceitar array de roles', () => {
      const user = { id: '6', email: 'transportadora@test.com', role: 'transportadora' }
      expect(hasRole(user, ['admin', 'transportadora'])).toBe(true)
      expect(hasRole(user, ['admin', 'operador'])).toBe(false)
    })

    it('deve retornar false para usuário null', () => {
      expect(hasRole(null, 'admin')).toBe(false)
    })
  })

  describe('requireAuth', () => {
    it('deve retornar null para usuário autenticado', async () => {
      const user = { id: 'user-1', email: 'test@test.com', role: 'admin' }
      mockSupabaseClient.setTableData('users', [user])
      
      mockSupabaseClient.setAuthHandler('getUser', async () => ({
        data: { user: { id: user.id, email: user.email } },
        error: null,
      }))

      const req = createAdminRequest({
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      })

      const result = await requireAuth(req, 'admin')
      expect(result).toBeNull()
    })

    it('deve retornar erro 401 para usuário não autenticado', async () => {
      const req = createMockRequest()

      const result = await requireAuth(req)
      
      expect(result).not.toBeNull()
      expect(result?.status).toBe(401)
      const data = await result?.json()
      expect(data.error).toBe('Não autorizado')
    })

    it('deve retornar erro 403 para role incorreta', async () => {
      const user = { id: 'user-1', email: 'operador@test.com', role: 'operador' }
      mockSupabaseClient.setTableData('users', [user])
      
      mockSupabaseClient.setAuthHandler('getUser', async () => ({
        data: { user: { id: user.id, email: user.email } },
        error: null,
      }))

      const req = createOperatorRequest('company-1', {
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      })

      const result = await requireAuth(req, 'admin')
      
      expect(result).not.toBeNull()
      expect(result?.status).toBe(403)
      const data = await result?.json()
      expect(data.error).toBe('Acesso negado')
    })
  })
})

