import { renderHook, waitFor } from '@testing-library/react'
import { useAdminKpis } from '@/hooks/use-admin-kpis'
import { renderWithProviders } from '../../helpers/component-helpers'

global.fetch = jest.fn()

describe('useAdminKpis hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve buscar KPIs administrativos', async () => {
    const mockKpis = [
      {
        company_id: 'company-1',
        company_name: 'Empresa 1',
        trips_today: 10,
        vehicles_active: 5,
        employees_in_transit: 20,
        critical_alerts: 2,
        routes_today: 8,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, kpis: mockKpis }),
    })

    const { result } = renderHook(() => useAdminKpis(), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockKpis)
  })

  it('deve retornar array vazio se resposta não tiver kpis', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }),
    })

    const { result } = renderHook(() => useAdminKpis(), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual([])
  })

  it('deve filtrar por company', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, kpis: [] }),
    })

    const { result } = renderHook(() => useAdminKpis('company-1'), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/admin/kpis')
  })
})

