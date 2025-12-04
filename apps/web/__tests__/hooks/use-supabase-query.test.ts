import { renderHook, waitFor } from '@testing-library/react'
import { useSupabaseQuery } from '@/hooks/use-supabase-query'
import { renderWithProviders } from '../../helpers/component-helpers'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock as any

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

describe('useSupabaseQuery hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    navigator.onLine = true
  })

  it('deve executar query e retornar dados', async () => {
    const queryFn = jest.fn(async () => ({
      data: { id: '1', name: 'Test' },
      error: null,
    }))

    const { result } = renderHook(() => useSupabaseQuery(queryFn), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ id: '1', name: 'Test' })
    expect(result.current.error).toBeNull()
  })

  it('deve lidar com erro na query', async () => {
    const queryFn = jest.fn(async () => ({
      data: null,
      error: { message: 'Query error' },
    }))

    const { result } = renderHook(() => useSupabaseQuery(queryFn), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeDefined()
  })

  it('deve usar cache quando disponível', async () => {
    const cachedData = { id: '1', name: 'Cached' }
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({
        data: cachedData,
        timestamp: Date.now(),
        ttl: 300000,
      })
    )

    const queryFn = jest.fn(async () => ({
      data: { id: '2', name: 'Fresh' },
      error: null,
    }))

    const { result } = renderHook(
      () => useSupabaseQuery(queryFn, { cacheKey: 'test-cache' }),
      {
        wrapper: renderWithProviders,
      }
    )

    // Deve usar cache primeiro
    expect(result.current.data).toEqual(cachedData)
  })

  it('deve detectar modo offline', () => {
    navigator.onLine = false

    const queryFn = jest.fn(async () => ({
      data: null,
      error: null,
    }))

    const { result } = renderHook(() => useSupabaseQuery(queryFn), {
      wrapper: renderWithProviders,
    })

    expect(result.current.isOffline).toBe(true)
  })

  it('deve refetch quando solicitado', async () => {
    const queryFn = jest.fn(async () => ({
      data: { id: '1' },
      error: null,
    }))

    const { result } = renderHook(() => useSupabaseQuery(queryFn), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const initialCallCount = queryFn.mock.calls.length

    await result.current.refetch()

    expect(queryFn.mock.calls.length).toBeGreaterThan(initialCallCount)
  })
})

