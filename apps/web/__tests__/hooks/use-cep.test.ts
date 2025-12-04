import { renderHook, waitFor } from '@testing-library/react'
import { useCep } from '@/hooks/use-cep'

// Mock fetch e toast
global.fetch = jest.fn()
jest.mock('@/lib/toast', () => ({
  notifyError: jest.fn(),
}))

describe('useCep hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar loading inicial como false', () => {
    const { result } = renderHook(() => useCep())
    expect(result.current.loading).toBe(false)
  })

  it('deve buscar CEP válido', async () => {
    const mockAddress = {
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      complemento: '',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, address: mockAddress }),
    })

    const { result } = renderHook(() => useCep())

    const address = await result.current.fetchCep('01310100')

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(address).toEqual(mockAddress)
    expect(global.fetch).toHaveBeenCalledWith('/api/cep?cep=01310100')
  })

  it('deve rejeitar CEP com menos de 8 dígitos', async () => {
    const { result } = renderHook(() => useCep())

    const address = await result.current.fetchCep('123')

    expect(address).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('deve lidar com erro da API', async () => {
    const { notifyError } = require('@/lib/toast')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'CEP não encontrado' }),
    })

    const { result } = renderHook(() => useCep())

    const address = await result.current.fetchCep('00000000')

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(address).toBeNull()
    expect(notifyError).toHaveBeenCalled()
  })

  it('deve remover formatação do CEP', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, address: {} }),
    })

    const { result } = renderHook(() => useCep())

    await result.current.fetchCep('01310-100')

    expect(global.fetch).toHaveBeenCalledWith('/api/cep?cep=01310100')
  })
})

