import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Cria um QueryClient para testes
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Wrapper para providers comuns
 */
interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const client = queryClient || createTestQueryClient()

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/**
 * Renderiza componente com todos os providers necessários
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) {
  const { queryClient, ...renderOptions } = options || {}

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Helper para mockar useRouter do next/navigation
 */
export function mockUseRouter(overrides: Partial<ReturnType<typeof useRouter>> = {}) {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    ...overrides,
  }

  jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }))

  return mockRouter
}

/**
 * Helper para mockar useSearchParams
 */
export function mockUseSearchParams(params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value)
  })

  jest.mock('next/navigation', () => ({
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => searchParams,
  }))

  return searchParams
}

/**
 * Helper para aguardar que um elemento apareça
 */
export async function waitForElement(condition: () => boolean, timeout = 5000) {
  const startTime = Date.now()
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for element')
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

/**
 * Helper para simular eventos de usuário
 */
export const userEvents = {
  click: async (element: HTMLElement) => {
    element.click()
    await new Promise((resolve) => setTimeout(resolve, 0))
  },
  type: async (element: HTMLElement, text: string) => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = text
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  },
  submit: async (form: HTMLFormElement) => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await new Promise((resolve) => setTimeout(resolve, 0))
  },
}

// Type helper para useRouter
function useRouter() {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }
}

