import { renderHook, waitFor } from '@testing-library/react'
import { useAdminVehicles } from '@/hooks/use-admin-veiculos'
import { renderWithProviders } from '../../helpers/component-helpers'

global.fetch = jest.fn()

describe('useAdminVehicles hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve buscar veículos', async () => {
    const mockVehicles = [
      { id: '1', plate: 'ABC1234', model: 'Modelo 1' },
      { id: '2', plate: 'XYZ5678', model: 'Modelo 2' },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVehicles,
    })

    const { result } = renderHook(() => useAdminVehicles(), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockVehicles)
  })

  it('deve lidar com resposta em formato de objeto', async () => {
    const mockResponse = {
      success: true,
      veiculos: [
        { id: '1', plate: 'ABC1234' },
      ],
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useAdminVehicles(), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockResponse.veiculos)
  })

  it('deve lidar com erro na requisição', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useAdminVehicles(), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

