/**
 * Testes para useAdminMap hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'

// Mock de dependências externas
jest.mock('@/lib/google-maps-loader', () => ({
  loadGoogleMapsAPI: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/maps-billing-monitor', () => ({
  getMapsBillingMonitor: jest.fn().mockReturnValue({
    getStatus: jest.fn().mockReturnValue({ used: 0, limit: 1000, remaining: 1000 }),
    isQuotaExceeded: jest.fn().mockReturnValue(false),
    incrementUsage: jest.fn(),
  }),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          data: [],
          error: null,
        }),
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}))

jest.mock('@/lib/services/map/map-services/vehicle-loader', () => ({
  loadVehicles: jest.fn().mockResolvedValue([]),
}))

jest.mock('@/lib/toast', () => ({
  notifySuccess: jest.fn(),
  notifyError: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))

jest.mock('@/lib/i18n', () => ({
  t: jest.fn((ns, key) => key),
}))

jest.mock('@/stores/map-filters', () => ({
  useMapFilters: jest.fn().mockReturnValue({
    company: null,
    route: null,
    veiculo: null,
    motorista: null,
    setCompany: jest.fn(),
    setRoute: jest.fn(),
    setVeiculo: jest.fn(),
    setMotorista: jest.fn(),
  }),
}))

jest.mock('@/stores/map-selection', () => ({
  useMapSelection: jest.fn().mockReturnValue({
    selectedVeiculo: null,
    selectedRoute: null,
    selectedAlert: null,
    selectedRouteId: null,
    setSelectedVeiculo: jest.fn(),
    setSelectedRoute: jest.fn(),
    setSelectedAlert: jest.fn(),
  }),
}))

jest.mock('@/stores/map-playback', () => ({
  useMapPlayback: jest.fn().mockReturnValue({
    mode: 'live',
    showTrajectories: false,
    showHeatmap: false,
  }),
}))

// Mock do google.maps
const mockMap = {
  getCenter: jest.fn().mockReturnValue({ toJSON: () => ({ lat: -19.9, lng: -43.9 }) }),
  getZoom: jest.fn().mockReturnValue(12),
  setCenter: jest.fn(),
  setZoom: jest.fn(),
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}

const mockGoogle = {
  maps: {
    Map: jest.fn().mockReturnValue(mockMap),
    Marker: jest.fn(),
    event: {
      trigger: jest.fn(),
      removeListener: jest.fn(),
    },
  },
}

// Definir global.google
beforeAll(() => {
  // @ts-ignore
  global.google = mockGoogle
  global.window.google = mockGoogle
  
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
})

describe('useAdminMap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve inicializar com estado de loading', async () => {
    // Importar o hook após os mocks estarem configurados
    const { useAdminMap } = await import('@/hooks/use-admin-map')
    
    const { result } = renderHook(() => useAdminMap())

    expect(result.current.loading).toBe(true)
    expect(result.current.mapError).toBeNull()
    expect(result.current.veiculos).toEqual([])
  })

  it('deve aceitar opções de configuração', async () => {
    const { useAdminMap } = await import('@/hooks/use-admin-map')
    
    const options = {
      companyId: 'company-123',
      routeId: 'route-456',
      vehicleId: 'vehicle-789',
      initialCenter: { lat: -23.5, lng: -46.6 },
      initialZoom: 15,
    }

    const { result } = renderHook(() => useAdminMap(options))

    expect(result.current.loading).toBe(true)
  })

  it('deve expor função de refresh', async () => {
    const { useAdminMap } = await import('@/hooks/use-admin-map')
    
    const { result } = renderHook(() => useAdminMap())

    expect(typeof result.current.refresh).toBe('function')
  })

  it('deve expor função de exportar imagem', async () => {
    const { useAdminMap } = await import('@/hooks/use-admin-map')
    
    const { result } = renderHook(() => useAdminMap())

    expect(typeof result.current.exportMapImage).toBe('function')
  })

  it('deve expor função de análise de trajetória', async () => {
    const { useAdminMap } = await import('@/hooks/use-admin-map')
    
    const { result } = renderHook(() => useAdminMap())

    expect(typeof result.current.analyzeVehicleTrajectory).toBe('function')
    expect(typeof result.current.clearTrajectoryAnalysis).toBe('function')
  })

  it('deve limpar análise de trajetória', async () => {
    const { useAdminMap } = await import('@/hooks/use-admin-map')
    
    const { result } = renderHook(() => useAdminMap())

    act(() => {
      result.current.clearTrajectoryAnalysis()
    })

    expect(result.current.trajectoryAnalysis).toBeNull()
  })
})

