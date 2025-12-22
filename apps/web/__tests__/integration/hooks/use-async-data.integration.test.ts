/**
 * Testes de Integração: useAsyncData Hook
 * 
 * Testa a integração do hook com:
 * - Fetch de dados
 * - Estados de loading/error
 * - Refresh e retry
 * - Caching
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAsyncData, UseAsyncDataOptions } from '@/hooks/use-async-data'

// Mock fetch global
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useAsyncData - Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
  })

  const defaultFetcher = async () => {
    const response = await fetch('/api/test')
    if (!response.ok) throw new Error('Fetch failed')
    return response.json()
  }

  describe('Estados Básicos', () => {
    it('deve iniciar em estado de loading', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      const { result } = renderHook(() => useAsyncData(defaultFetcher))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeNull()
    })

    it('deve retornar dados após fetch bem-sucedido', async () => {
      const mockData = { id: 1, name: 'Test Item' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      })

      const { result } = renderHook(() => useAsyncData(defaultFetcher))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
    })

    it('deve retornar erro após fetch falho', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })

      const { result } = renderHook(() => useAsyncData(defaultFetcher))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('Refresh e Retry', () => {
    it('deve permitir refresh manual dos dados', async () => {
      let callCount = 0
      mockFetch.mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ count: callCount }),
        })
      })

      const { result } = renderHook(() => useAsyncData(defaultFetcher))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual({ count: 1 })

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.data).toEqual({ count: 2 })
    })

    it('deve fazer retry automático em caso de erro quando configurado', async () => {
      let callCount = 0
      mockFetch.mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.resolve({ ok: false, status: 500 })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      })

      const { result } = renderHook(() =>
        useAsyncData(defaultFetcher, { retryCount: 3, retryDelay: 100 })
      )

      await waitFor(
        () => {
          expect(result.current.data).toEqual({ success: true })
        },
        { timeout: 5000 }
      )

      expect(callCount).toBe(3)
    })
  })

  describe('Dependências', () => {
    it('deve refetch quando dependências mudam', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      const { result, rerender } = renderHook(
        ({ deps }) => useAsyncData(defaultFetcher, { deps }),
        { initialProps: { deps: [1] } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)

      rerender({ deps: [2] })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })

    it('não deve refetch se dependências não mudam', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      const { result, rerender } = renderHook(
        ({ deps }) => useAsyncData(defaultFetcher, { deps }),
        { initialProps: { deps: [1] } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      rerender({ deps: [1] })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Opções de Configuração', () => {
    it('não deve fazer fetch inicial quando enabled=false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      const { result } = renderHook(() =>
        useAsyncData(defaultFetcher, { enabled: false })
      )

      // Aguardar um pouco para garantir que não foi chamado
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
    })

    it('deve usar initialData quando fornecido', () => {
      const initialData = { name: 'Initial' }

      const { result } = renderHook(() =>
        useAsyncData(defaultFetcher, { initialData, enabled: false })
      )

      expect(result.current.data).toEqual(initialData)
      expect(result.current.isLoading).toBe(false)
    })

    it('deve chamar onSuccess quando fetch é bem-sucedido', async () => {
      const mockData = { id: 1 }
      const onSuccess = jest.fn()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      })

      renderHook(() => useAsyncData(defaultFetcher, { onSuccess }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockData)
      })
    })

    it('deve chamar onError quando fetch falha', async () => {
      const onError = jest.fn()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      renderHook(() => useAsyncData(defaultFetcher, { onError }))

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })
  })

  describe('Cancelamento e Cleanup', () => {
    it('deve cancelar fetch em andamento quando componente é desmontado', async () => {
      const abortSpy = jest.spyOn(AbortController.prototype, 'abort')

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ data: 'test' }),
              })
            }, 1000)
          })
      )

      const { unmount } = renderHook(() => useAsyncData(defaultFetcher))

      // Desmontar antes do fetch completar
      unmount()

      // Verificar que abort foi chamado
      expect(abortSpy).toHaveBeenCalled()

      abortSpy.mockRestore()
    })
  })

  describe('Estado de Stale', () => {
    it('deve marcar dados como stale após refetch', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      const { result } = renderHook(() =>
        useAsyncData(defaultFetcher, { staleTime: 0 })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Dados devem estar fresh inicialmente
      expect(result.current.isStale).toBe(false)

      // Aguardar dados ficarem stale
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Após staleTime, dados devem estar stale
      expect(result.current.isStale).toBe(true)
    })
  })
})

