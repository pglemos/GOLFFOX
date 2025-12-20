/**
 * Testes para AuthManager
 */

import { AuthManager, UserData } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getUserRoleByEmail } from '@/lib/user-role'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      setSession: jest.fn(),
    },
  },
}))

jest.mock('@/lib/user-role', () => ({
  getUserRoleByEmail: jest.fn(),
}))

describe('AuthManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      document.cookie = ''
    }
  })

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        user_metadata: {},
        app_metadata: {},
      }
      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: mockUser,
      }

        ; (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        })
        ; (getUserRoleByEmail as jest.Mock).mockReturnValue('admin')

      const result = await AuthManager.login('admin@test.com', 'password123')

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe('user-1')
      expect(result.user?.email).toBe('admin@test.com')
      expect(result.user?.role).toBe('admin')
      expect(result.user?.accessToken).toBe('token-123')
    })

    it('deve retornar erro quando credenciais são inválidas', async () => {
      ; (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', status: 401 },
      })

      const result = await AuthManager.login('admin@test.com', 'wrongpass')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      expect(result.user).toBeUndefined()
    })

    it('deve retornar erro quando não há sessão', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
      }

        ; (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
          data: { user: mockUser, session: null },
          error: null,
        })

      const result = await AuthManager.login('admin@test.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Falha na autenticação')
    })

    it('deve lidar com exceções durante login', async () => {
      ; (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      const result = await AuthManager.login('admin@test.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('logout', () => {
    it('deve fazer logout e limpar dados locais', async () => {
      // Simular usuário logado
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }
      AuthManager.persistSession(userData)

        ; (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null })

      await AuthManager.logout()

      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(localStorage.getItem('golffox-auth')).toBeNull()
      expect(document.cookie).not.toContain('golffox-session')
    })

    it('deve lidar com erros durante logout', async () => {
      ; (supabase.auth.signOut as jest.Mock).mockRejectedValue(
        new Error('Logout error')
      )

      // Não deve lançar exceção
      await expect(AuthManager.logout()).resolves.toBeUndefined()
    })
  })

  describe('getStoredUser', () => {
    it('deve retornar usuário armazenado', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }
      localStorage.setItem('golffox-auth', JSON.stringify(userData))

      const stored = AuthManager.getStoredUser()

      expect(stored).toEqual(userData)
    })

    it('deve retornar null quando não há usuário armazenado', () => {
      const stored = AuthManager.getStoredUser()
      expect(stored).toBeNull()
    })

    it('deve retornar null quando dados são inválidos', () => {
      localStorage.setItem('golffox-auth', 'invalid-json')

      const stored = AuthManager.getStoredUser()
      expect(stored).toBeNull()
    })

    it('deve retornar null em ambiente server-side', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const stored = AuthManager.getStoredUser()
      expect(stored).toBeNull()

      global.window = originalWindow
    })
  })

  describe('isAuthenticated', () => {
    it('deve retornar true quando há usuário armazenado', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }
      localStorage.setItem('golffox-auth', JSON.stringify(userData))

      expect(AuthManager.isAuthenticated()).toBe(true)
    })

    it('deve retornar false quando não há usuário armazenado', () => {
      expect(AuthManager.isAuthenticated()).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('deve retornar true para admin quando usuário é admin', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }
      localStorage.setItem('golffox-auth', JSON.stringify(userData))

      expect(AuthManager.hasRole('admin')).toBe(true)
    })

    it('deve retornar false para admin quando usuário não é admin', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'operador',
        accessToken: 'token-123',
      }
      localStorage.setItem('golffox-auth', JSON.stringify(userData))

      expect(AuthManager.hasRole('admin')).toBe(false)
    })

    it('deve retornar true para operador quando usuário é admin', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }
      localStorage.setItem('golffox-auth', JSON.stringify(userData))

      expect(AuthManager.hasRole('operador')).toBe(true)
    })

    it('deve retornar true para operador quando usuário é operador', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'operador@test.com',
        role: 'operador',
        accessToken: 'token-123',
      }
      localStorage.setItem('golffox-auth', JSON.stringify(userData))

      expect(AuthManager.hasRole('operador')).toBe(true)
    })

    it('deve retornar true para transportadora quando usuário é admin', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }
      localStorage.setItem('golffox-auth', JSON.stringify(userData))

      expect(AuthManager.hasRole('transportadora')).toBe(true)
    })

    it('deve retornar false quando não há usuário', () => {
      expect(AuthManager.hasRole('admin')).toBe(false)
    })
  })

  describe('getRedirectUrl', () => {
    it('deve retornar /admin para role admin', () => {
      expect(AuthManager.getRedirectUrl('admin')).toBe('/admin')
    })

    it('deve retornar /transportadora para role operador', () => {
      expect(AuthManager.getRedirectUrl('operador')).toBe('/transportadora')
    })

    it('deve retornar /empresa para role operador (compat.)', () => {
      expect(AuthManager.getRedirectUrl('operador')).toBe('/empresa')
    })

    it('deve retornar /empresa para role empresa', () => {
      expect(AuthManager.getRedirectUrl('empresa')).toBe('/empresa')
    })

    it('deve retornar /transportadora para role transportadora', () => {
      expect(AuthManager.getRedirectUrl('transportadora')).toBe('/transportadora')
    })

    it('deve retornar /transportadora para role transportadora (compat.)', () => {
      expect(AuthManager.getRedirectUrl('transportadora')).toBe('/transportadora')
    })

    it('deve retornar /empresa como fallback para role desconhecido', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      expect(AuthManager.getRedirectUrl('unknown')).toBe('/empresa')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('persistSession', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:' },
        writable: true,
      })
    })

    it('deve persistir sessão em localStorage e cookie', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
        name: 'Admin User',
        avatar_url: 'https://example.com/avatar.jpg',
      }

        ; (supabase.auth.setSession as jest.Mock).mockResolvedValue({ error: null })

      AuthManager.persistSession(userData, { token: 'token-123' })

      const stored = localStorage.getItem('golffox-auth')
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed.id).toBe('user-1')
      expect(parsed.email).toBe('admin@test.com')
      expect(parsed.role).toBe('admin')
      expect(parsed.name).toBe('Admin User')
      expect(parsed.avatar_url).toBe('https://example.com/avatar.jpg')
      expect(parsed.access_token).toBe('token-123')

      expect(document.cookie).toContain('golffox-session')
    })

    it('deve persistir apenas em localStorage quando especificado', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }

      AuthManager.persistSession(userData, { storage: 'local' })

      expect(localStorage.getItem('golffox-auth')).toBeTruthy()
      expect(sessionStorage.getItem('golffox-auth')).toBeNull()
    })

    it('deve persistir apenas em sessionStorage quando especificado', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }

      AuthManager.persistSession(userData, { storage: 'session' })

      expect(sessionStorage.getItem('golffox-auth')).toBeTruthy()
    })

    it('deve usar cookie seguro em HTTPS', () => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:' },
        writable: true,
      })

      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }

      AuthManager.persistSession(userData)

      expect(document.cookie).toContain('Secure')
    })

    it('deve disparar evento customizado ao persistir', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }

      const eventSpy = jest.fn()
      window.addEventListener('golffox:auth', eventSpy)

      AuthManager.persistSession(userData)

      expect(eventSpy).toHaveBeenCalled()
      expect(eventSpy.mock.calls[0][0].detail).toEqual(userData)

      window.removeEventListener('golffox:auth', eventSpy)
    })

    it('deve usar email como name quando name não é fornecido', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }

      AuthManager.persistSession(userData)

      const stored = JSON.parse(localStorage.getItem('golffox-auth')!)
      expect(stored.name).toBe('admin')
    })

    it('deve lidar com erros de storage', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }

      // Simular erro de storage
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded')
      })

      // Não deve lançar exceção
      expect(() => AuthManager.persistSession(userData)).not.toThrow()

      localStorage.setItem = originalSetItem
    })
  })

  describe('extractUserFromCookie', () => {
    it('deve extrair usuário de cookie válido', () => {
      const userData: UserData = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'admin',
        accessToken: 'token-123',
      }
      const cookieValue = btoa(JSON.stringify(userData))

      const extracted = AuthManager.extractUserFromCookie(cookieValue)

      expect(extracted).toEqual(userData)
    })

    it('deve retornar null para cookie inválido', () => {
      const extracted = AuthManager.extractUserFromCookie('invalid-cookie')
      expect(extracted).toBeNull()
    })

    it('deve retornar null para JSON inválido', () => {
      const cookieValue = btoa('invalid-json')
      const extracted = AuthManager.extractUserFromCookie(cookieValue)
      expect(extracted).toBeNull()
    })
  })
})

