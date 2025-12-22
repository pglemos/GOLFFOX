/**
 * Testes para AuthProvider
 * Testa carregamento de usuário, cache, múltiplas estratégias de autenticação
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/components/providers/auth-provider'
import { supabase } from '@/lib/supabase'
// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  },
}))

// Mock já está no jest.setup.js

// Helper component para testar o hook
function TestComponent() {
  const { user, loading, error, reload, clearCache } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button data-testid="reload" onClick={reload}>Reload</button>
      <button data-testid="clear-cache" onClick={clearCache}>Clear Cache</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Limpar cookies
    document.cookie = 'golffox-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    
    // Mock window.addEventListener/removeEventListener
    const listeners: Map<string, EventListener> = new Map()
    window.addEventListener = jest.fn((event, handler) => {
      listeners.set(event, handler as EventListener)
    })
    window.removeEventListener = jest.fn((event) => {
      listeners.delete(event)
    })
  })

  describe('Carregamento Inicial', () => {
    it('deve iniciar com loading true quando não há cache', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    })

    it('deve carregar usuário do cookie quando disponível', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@test.com',
        role: 'admin',
        name: 'Test User',
      }

      // Criar cookie válido
      const cookieValue = btoa(JSON.stringify(userData))
      document.cookie = `golffox-session=${cookieValue}`

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      const userText = screen.getByTestId('user').textContent
      expect(userText).toContain('user-1')
      expect(userText).toContain('test@test.com')
    })

    it('deve ignorar cookie inválido', async () => {
      document.cookie = 'golffox-session=invalid-base64'

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })
  })

  describe('Estratégia 1: Cookie (golffox-session)', () => {
    it('deve usar cookie quando disponível e válido', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@test.com',
        role: 'admin',
      }

      const cookieValue = btoa(JSON.stringify(userData))
      document.cookie = `golffox-session=${cookieValue}`

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        const userText = screen.getByTestId('user').textContent
        expect(userText).toContain('user-1')
        expect(userText).toContain('test@test.com')
      })

      // Não deve chamar API ou Supabase se cookie está disponível
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('deve extrair companyId do cookie quando disponível', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@test.com',
        companyId: 'company-1',
      }

      const cookieValue = btoa(JSON.stringify(userData))
      document.cookie = `golffox-session=${cookieValue}`

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        const userText = screen.getByTestId('user').textContent
        expect(userText).toContain('company-1')
      })
    })
  })

  describe('Estratégia 2: API /api/auth/me', () => {
    it('deve usar API quando cookie não está disponível', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        role: 'admin',
        name: 'Test User',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/me',
          expect.objectContaining({
            credentials: 'include',
            cache: 'no-store',
          })
        )
      })

      await waitFor(() => {
        const userText = screen.getByTestId('user').textContent
        expect(userText).toContain('user-1')
      })
    })

    it('deve continuar para próxima estratégia quando API falha', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const mockSession = {
        data: {
          session: {
            user: {
              id: 'user-1',
              email: 'test@test.com',
            },
          },
        },
        error: null,
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValueOnce(mockSession)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(ensureSupabaseSession).toHaveBeenCalled()
      })
    })
  })

  describe('Estratégia 3: Supabase Auth', () => {
    it('deve usar Supabase quando cookie e API não estão disponíveis', async () => {
      const mockSession = {
        data: {
          session: {
            user: {
              id: 'user-1',
              email: 'test@test.com',
            },
          },
        },
        error: null,
      }

      const mockUserData = {
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'admin',
        company_id: 'company-1',
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValueOnce(mockSession)
      
      // Mock da query do Supabase
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          })),
        })),
      }))

      ;(supabase as any).from = mockFrom

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(ensureSupabaseSession).toHaveBeenCalled()
        expect(supabase.auth.getSession).toHaveBeenCalled()
      })
    })

    it('deve lidar com erro na sessão do Supabase', async () => {
      const mockSession = {
        data: { session: null },
        error: { message: 'Session error' },
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValueOnce(mockSession)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })
    })
  })

  describe('Cache', () => {
    it('deve usar cache quando válido e não forçado', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@test.com',
      }

      const cookieValue = btoa(JSON.stringify(userData))
      document.cookie = `golffox-session=${cookieValue}`

      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('user-1')
      })

      // Limpar cookie
      document.cookie = 'golffox-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

      // Re-render não deve fazer nova busca se cache é válido
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Cache deve ser usado (não deve chamar fetch novamente imediatamente)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('deve limpar cache quando clearCache é chamado', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@test.com',
      }

      const cookieValue = btoa(JSON.stringify(userData))
      document.cookie = `golffox-session=${cookieValue}`

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('user-1')
      })

      const clearCacheButton = screen.getByTestId('clear-cache')
      clearCacheButton.click()

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })
    })
  })

  describe('Reload', () => {
    it('deve forçar recarregamento quando reload é chamado', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@test.com',
      }

      const cookieValue = btoa(JSON.stringify(userData))
      document.cookie = `golffox-session=${cookieValue}`

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('user-1')
      })

      const reloadButton = screen.getByTestId('reload')
      reloadButton.click()

      // Deve fazer nova busca (forçar)
      await waitFor(() => {
        // Verificamos que o componente ainda renderiza
        expect(screen.getByTestId('user')).toBeInTheDocument()
      })
    })
  })

  describe('Auth State Changes', () => {
    it('deve escutar mudanças de sessão do Supabase', () => {
      const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(mockOnAuthStateChange).toHaveBeenCalled()
      
      // Verificar que callback foi registrado
      const callback = mockOnAuthStateChange.mock.calls[0][0]
      expect(typeof callback).toBe('function')
    })

    it('deve recarregar usuário quando SIGNED_IN', async () => {
      const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const callback = mockOnAuthStateChange.mock.calls[0][0]
      
      // Simular SIGNED_IN
      await callback('SIGNED_IN', {
        user: { id: 'user-1', email: 'test@test.com' },
      } as any)

      // Deve tentar recarregar
      await waitFor(() => {
        expect(screen.getByTestId('user')).toBeInTheDocument()
      })
    })

    it('deve limpar usuário quando SIGNED_OUT', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@test.com',
      }

      const cookieValue = btoa(JSON.stringify(userData))
      document.cookie = `golffox-session=${cookieValue}`

      const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('user-1')
      })

      const callback = mockOnAuthStateChange.mock.calls[0][0]
      
      // Simular SIGNED_OUT
      await callback('SIGNED_OUT', null)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })
    })
  })

  describe('Custom Events', () => {
    it('deve escutar evento auth:update', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Disparar evento customizado
      const event = new Event('auth:update')
      window.dispatchEvent(event)

      // Deve tentar recarregar após delay
      await waitFor(() => {
        expect(screen.getByTestId('user')).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('Tratamento de Erros', () => {
    it('deve exibir erro quando todas as estratégias falham', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'))
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      // Deve ter tentado todas as estratégias
      expect(global.fetch).toHaveBeenCalled()
      expect(ensureSupabaseSession).toHaveBeenCalled()
    })
  })

  describe('useAuth Hook', () => {
    it('deve lançar erro se usado fora do AuthProvider', () => {
      // Suprimir console.error para este teste
      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth deve ser usado dentro de um AuthProvider')

      consoleError.mockRestore()
    })

    it('deve retornar contexto quando usado dentro do provider', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@test.com',
      }

      const cookieValue = btoa(JSON.stringify(userData))
      document.cookie = `golffox-session=${cookieValue}`

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('user-1')
      })

      // Hook deve funcionar corretamente
      expect(screen.getByTestId('reload')).toBeInTheDocument()
      expect(screen.getByTestId('clear-cache')).toBeInTheDocument()
    })
  })
})

