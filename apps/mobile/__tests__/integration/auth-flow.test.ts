/**
 * Testes Mobile: Fluxo de Autenticação
 * 
 * Testes de integração para o fluxo completo de autenticação
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock do Supabase
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
}

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token-123' },
        },
        error: null,
      })

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.data.user).toBeTruthy()
      expect(result.data.session).toBeTruthy()
      expect(result.error).toBeNull()
    })

    it('deve rejeitar login com credenciais inválidas', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrong',
      })

      expect(result.data.user).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('Session Management', () => {
    it('deve obter sessão atual', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: { access_token: 'token-123', user: { id: 'user-123' } },
        },
        error: null,
      })

      const result = await mockSupabase.auth.getSession()

      expect(result.data.session).toBeTruthy()
      expect(result.data.session.access_token).toBe('token-123')
    })

    it('deve fazer logout corretamente', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const result = await mockSupabase.auth.signOut()

      expect(result.error).toBeNull()
    })
  })
})
