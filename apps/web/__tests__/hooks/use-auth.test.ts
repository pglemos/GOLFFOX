import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { renderWithProviders } from '../../helpers/component-helpers'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  AuthManager: {
    getStoredUser: jest.fn(() => null),
    login: jest.fn(),
    logout: jest.fn(),
  },
}))

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar estado inicial', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('deve carregar usuário armazenado', async () => {
    const { AuthManager } = require('@/lib/auth')
    AuthManager.getStoredUser.mockReturnValue({
      id: 'user-1',
      email: 'test@test.com',
      role: 'admin',
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toMatchObject({
      id: 'user-1',
      email: 'test@test.com',
      role: 'admin',
    })
  })

  it('deve fazer login', async () => {
    const { AuthManager } = require('@/lib/auth')
    AuthManager.login.mockResolvedValue({
      success: true,
      user: {
        id: 'user-1',
        email: 'test@test.com',
        role: 'admin',
      },
    })

    const { result } = renderHook(() => useAuth())

    await result.current.login('test@test.com', 'senha123')

    expect(AuthManager.login).toHaveBeenCalledWith('test@test.com', 'senha123')
    expect(result.current.user).toMatchObject({
      id: 'user-1',
      email: 'test@test.com',
    })
  })

  it('deve fazer logout', async () => {
    const { AuthManager } = require('@/lib/auth')
    AuthManager.getStoredUser.mockReturnValue({
      id: 'user-1',
      email: 'test@test.com',
      role: 'admin',
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user).not.toBeNull()
    })

    await result.current.logout()

    expect(AuthManager.logout).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
  })
})

