/**
 * Testes de Integração: Componentes de Login
 * 
 * Testa a integração dos componentes refatorados:
 * - LoginHero
 * - LoginForm
 * - useLogin hook
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginHero, LoginForm } from '@/components/login'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock do useRouter
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock do Supabase
jest.mock('@/lib/supabase-client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  }),
}))

// Mock do fetch para CSRF
global.fetch = jest.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Login Components - Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('LoginHero', () => {
    it('deve renderizar seção de hero com título', () => {
      render(<LoginHero />)

      expect(screen.getByText(/golffox/i)).toBeInTheDocument()
    })

    it('deve renderizar descrição do sistema', () => {
      render(<LoginHero />)

      expect(
        screen.getByText(/transporte|frota|logística/i)
      ).toBeInTheDocument()
    })

    it('deve ter animações visíveis quando motion é permitido', () => {
      // Mock prefers-reduced-motion: no-preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: false, // no-preference = animations allowed
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      const { container } = render(<LoginHero />)

      // Verificar presença de elementos animados
      const animatedElements = container.querySelectorAll('[class*="animate"], [style*="animation"]')
      expect(animatedElements.length).toBeGreaterThan(0)
    })
  })

  describe('LoginForm', () => {
    const defaultProps = {
      onSubmit: jest.fn(),
      isLoading: false,
    }

    beforeEach(() => {
      // Mock CSRF token fetch
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'mock-csrf-token' }),
      })
    })

    it('deve renderizar campos de email e senha', () => {
      render(<LoginForm {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    })

    it('deve renderizar botão de submit', () => {
      render(<LoginForm {...defaultProps} />, { wrapper: createWrapper() })

      expect(
        screen.getByRole('button', { name: /entrar|login|sign in/i })
      ).toBeInTheDocument()
    })

    it('deve chamar onSubmit com credenciais válidas', async () => {
      const user = userEvent.setup()
      const onSubmit = jest.fn()
      render(<LoginForm {...defaultProps} onSubmit={onSubmit} />, {
        wrapper: createWrapper(),
      })

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar|login|sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
    })

    it('deve mostrar erro de validação para email inválido', async () => {
      const user = userEvent.setup()
      render(<LoginForm {...defaultProps} />, { wrapper: createWrapper() })

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /entrar|login|sign in/i })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email inválido|invalid email/i)).toBeInTheDocument()
      })
    })

    it('deve mostrar erro de validação para senha vazia', async () => {
      const user = userEvent.setup()
      render(<LoginForm {...defaultProps} />, { wrapper: createWrapper() })

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /entrar|login|sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/senha.*obrigatóri|password.*required/i)).toBeInTheDocument()
      })
    })

    it('deve desabilitar botão durante loading', () => {
      render(<LoginForm {...defaultProps} isLoading />, { wrapper: createWrapper() })

      const submitButton = screen.getByRole('button', { name: /entrar|login|sign in/i })
      expect(submitButton).toBeDisabled()
    })

    it('deve mostrar indicador de loading', () => {
      render(<LoginForm {...defaultProps} isLoading />, { wrapper: createWrapper() })

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('deve mostrar mensagem de erro quando fornecida', () => {
      render(
        <LoginForm {...defaultProps} error="Credenciais inválidas" />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument()
    })
  })

  describe('Acessibilidade', () => {
    it('LoginHero deve ter estrutura semântica correta', () => {
      render(<LoginHero />)

      // Deve ter heading principal
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('LoginForm deve ter labels associados aos inputs', () => {
      render(<LoginForm onSubmit={jest.fn()} isLoading={false} />, {
        wrapper: createWrapper(),
      })

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)

      expect(emailInput).toHaveAttribute('id')
      expect(passwordInput).toHaveAttribute('id')
    })

    it('LoginForm deve ter autocomplete correto', () => {
      render(<LoginForm onSubmit={jest.fn()} isLoading={false} />, {
        wrapper: createWrapper(),
      })

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)

      expect(emailInput).toHaveAttribute('autocomplete', 'email')
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    })

    it('erros devem ser anunciados por screen readers', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSubmit={jest.fn()} isLoading={false} />, {
        wrapper: createWrapper(),
      })

      const submitButton = screen.getByRole('button', { name: /entrar|login|sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert')
        expect(errorMessages.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Navegação por Teclado', () => {
    it('deve permitir submit com Enter', async () => {
      const user = userEvent.setup()
      const onSubmit = jest.fn()
      render(<LoginForm onSubmit={onSubmit} isLoading={false} />, {
        wrapper: createWrapper(),
      })

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled()
      })
    })

    it('deve permitir Tab entre campos', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSubmit={jest.fn()} isLoading={false} />, {
        wrapper: createWrapper(),
      })

      const emailInput = screen.getByLabelText(/email/i)
      emailInput.focus()

      await user.tab()

      expect(screen.getByLabelText(/senha/i)).toHaveFocus()
    })
  })

  describe('Integração com CSRF', () => {
    it('deve buscar token CSRF ao montar', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'csrf-token' }),
      })

      render(<LoginForm onSubmit={jest.fn()} isLoading={false} />, {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/csrf'),
          expect.any(Object)
        )
      })
    })

    it('deve incluir CSRF token na submissão', async () => {
      const user = userEvent.setup()
      const onSubmit = jest.fn()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'my-csrf-token' }),
      })

      render(<LoginForm onSubmit={onSubmit} isLoading={false} />, {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar|login|sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            csrfToken: 'my-csrf-token',
          })
        )
      })
    })
  })
})

