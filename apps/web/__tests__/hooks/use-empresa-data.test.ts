import { renderHook, waitFor } from '@testing-library/react'
import { useOperatorKPIs, useControlTower, useEmployees } from '@/hooks/use-operador-data'
import { renderWithProviders } from '../../helpers/component-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}))

global.fetch = jest.fn()

describe('useOperatorKPIs hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve buscar KPIs do operador', async () => {
    const kpiData = {
      company_id: 'company-1',
      trips_today: 10,
      trips_in_progress: 2,
      trips_completed: 8,
      delays_over_5min: 1,
      avg_occupancy: 75.5,
      daily_cost: 1000,
      sla_d0: 95,
    }

    mockSupabaseClient.setTableData('v_operator_dashboard_kpis_secure', [kpiData])

    const { result } = renderHook(() => useOperatorKPIs('company-1'), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.trips_today).toBe(10)
  })

  it('deve retornar null se companyId não fornecido', async () => {
    const { result } = renderHook(() => useOperatorKPIs(null), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
  })
})

describe('useControlTower hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve buscar dados da torre de controle', async () => {
    mockSupabaseClient.setTableData('v_operator_alerts_secure', [])
    mockSupabaseClient.setTableData('gf_service_requests', [])

    const { result } = renderHook(() => useControlTower('company-1'), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.delays).toBeDefined()
  })
})

describe('useEmployees hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('deve buscar funcionários via API', async () => {
    const mockResponse = {
      data: [
        { id: '1', name: 'Funcionário 1' },
        { id: '2', name: 'Funcionário 2' },
      ],
      count: 2,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useEmployees('company-1', 1, 50, ''), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.data).toHaveLength(2)
  })

  it('deve retornar vazio se companyId não fornecido', async () => {
    const { result } = renderHook(() => useEmployees(null), {
      wrapper: renderWithProviders,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.data).toEqual([])
  })
})

