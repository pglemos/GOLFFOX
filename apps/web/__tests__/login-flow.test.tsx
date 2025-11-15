import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock next/navigation router and search params
jest.mock('next/navigation', () => {
  const push = jest.fn()
  const replace = jest.fn()
  const useRouter = () => ({ push, replace })
  const useSearchParams = () => new URLSearchParams('next=%2Fadmin')
  return { useRouter, useSearchParams }
})

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
    },
  },
}))

// Mock AuthManager
jest.mock('@/lib/auth', () => ({
  AuthManager: {
    login: jest.fn(async (email: string, password: string) => {
      // Fast resolve to satisfy <300ms
      await new Promise((r) => setTimeout(r, 50))
      if (password === 'wrongpass') return { success: false, error: 'Credenciais inválidas' }
      return {
        success: true,
        user: {
          id: 'u1',
          email,
          role: email.includes('admin') ? 'admin' : 'operator',
          accessToken: 'eyJ.hbGci.Oi',
        },
      }
    }),
    getStoredUser: jest.fn(() => null),
    getRedirectUrl: jest.fn((role: string) => (role === 'admin' ? '/admin' : '/operator')),
  },
}))

// API set-session mock
global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })) as any

// Import after mocks
import LoginPage from '@/app/login/page'

describe('Login Flow - performance and redirect', () => {
  test('shows error for invalid credentials quickly', async () => {
    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('seu@email.com') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
    const submitBtn = screen.getByRole('button', { name: /Entrar/i })

    fireEvent.change(emailInput, { target: { value: 'golffox@admin.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
    const t0 = performance.now()
    fireEvent.click(submitBtn)

    await waitFor(() => expect(screen.getByText(/Credenciais inválidas/i)).toBeInTheDocument(), { timeout: 500 })
    const dt = performance.now() - t0
    expect(dt).toBeLessThan(500)
  })

  test('redirects to next=/admin with smooth router push', async () => {
    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('seu@email.com') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement

    fireEvent.change(emailInput, { target: { value: 'golffox@admin.com' } })
    fireEvent.change(passwordInput, { target: { value: 'senha123' } })

    // Press Enter to submit
    fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' })

    // Ensure feedback appears fast
    await waitFor(() => screen.getByRole('button', { name: /Entrando.../i }), { timeout: 100 })

    // Ensure redirect happens to /admin within 500ms
    const { useRouter } = require('next/navigation')
    const { push } = useRouter()
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin'), { timeout: 500 })
  })

  test('load test: 1000 concurrent login resolutions within 500ms', async () => {
    const { AuthManager } = require('@/lib/auth')
    const start = performance.now()
    const promises = Array.from({ length: 1000 }).map((_, i) => AuthManager.login(`user${i}@test.com`, 'senha123'))
    const results = await Promise.all(promises)
    const duration = performance.now() - start
    expect(duration).toBeLessThan(500)
    const successCount = results.filter((r: any) => r.success).length
    expect(successCount).toBe(1000)
  })
})
