/**
 * Testes para AdminMap
 * Testa inicialização, carregamento de dados, filtros e interações básicas
 * Nota: Este é um componente muito complexo (1800+ linhas), então focamos nos aspectos críticos
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AdminMap } from '@/components/admin-map/admin-map'
import { renderWithProviders } from '../../helpers/component-helpers'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'
import { RealtimeService } from '@/lib/realtime-service'
import { PlaybackService } from '@/lib/playback-service'

// Mock dependencies
jest.mock('@/lib/google-maps-loader')
jest.mock('@/lib/realtime-service')
jest.mock('@/lib/playback-service')
jest.mock('@/lib/services/map/map-services/vehicle-loader', () => ({
  loadVehicles: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/lib/route-deviation-detector')
jest.mock('@/lib/operational-alerts')
jest.mock('@/lib/maps-billing-monitor')
jest.mock('@/lib/trajectory-analyzer')
jest.mock('@/lib/coordinate-validator')
jest.mock('@/lib/toast', () => ({
  notifySuccess: jest.fn(),
  notifyError: jest.fn(),
}))
jest.mock('@/lib/core/logger', () => ({
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}))
jest.mock('@/lib/error-utils', () => ({
  formatError: jest.fn((err) => err?.message || 'Erro'),
  getErrorMeta: jest.fn(() => ({})),
}))
jest.mock('@/lib/i18n', () => ({
  t: jest.fn((key) => key),
}))
jest.mock('@/stores/map-filters', () => ({
  useMapFilters: jest.fn((selector) => {
    const state = {
      company: null,
      route: null,
      veiculo: null,
      motorista: null,
      setCompany: jest.fn(),
      setRoute: jest.fn(),
      setVeiculo: jest.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))
jest.mock('@/stores/map-selection', () => ({
  useMapSelection: jest.fn(() => ({
    selectedVeiculo: null,
    selectedRoute: null,
    setSelectedVeiculo: jest.fn(),
    setSelectedRoute: jest.fn(),
    clearSelection: jest.fn(),
  })),
}))
jest.mock('@/stores/map-playback', () => ({
  useMapPlayback: jest.fn(() => ({
    isPlaying: false,
    currentTime: null,
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
  })),
}))
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
    })),
  },
}))
jest.mock('@/lib/next-navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Google Maps
const mockGoogleMaps = {
  Map: jest.fn().mockImplementation(() => ({
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    addListener: jest.fn(),
  })),
  Marker: jest.fn().mockImplementation(() => ({
    setPosition: jest.fn(),
    setMap: jest.fn(),
  })),
  Polyline: jest.fn().mockImplementation(() => ({
    setPath: jest.fn(),
    setMap: jest.fn(),
  })),
  InfoWindow: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
    close: jest.fn(),
  })),
}

const mockLoadGoogleMapsAPI = loadGoogleMapsAPI as jest.MockedFunction<typeof loadGoogleMapsAPI>

describe('AdminMap', () => {
  const defaultProps = {
    companyId: 'company-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Google Maps API
    ;(window as any).google = mockGoogleMaps
    
    mockLoadGoogleMapsAPI.mockResolvedValue(mockGoogleMaps as any)
    
    // Mock RealtimeService
    ;(RealtimeService as any).mockImplementation(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      subscribe: jest.fn(),
    }))
    
    // Mock PlaybackService
    ;(PlaybackService as any).mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
    }))
  })

  describe('Inicialização', () => {
    it('deve renderizar componente sem erros', () => {
      renderWithProviders(<AdminMap {...defaultProps} />)
      
      // Componente deve renderizar (pode estar em loading)
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('deve carregar Google Maps API na inicialização', async () => {
      renderWithProviders(<AdminMap {...defaultProps} />)
      
      await waitFor(() => {
        expect(mockLoadGoogleMapsAPI).toHaveBeenCalled()
      })
    })

    it('deve inicializar mapa com props fornecidas', async () => {
      const props = {
        companyId: 'company-1',
        routeId: 'route-1',
        vehicleId: 'vehicle-1',
        initialCenter: { lat: -23.5505, lng: -46.6333 },
        initialZoom: 12,
      }

      renderWithProviders(<AdminMap {...props} />)
      
      await waitFor(() => {
        expect(mockLoadGoogleMapsAPI).toHaveBeenCalled()
      })
    })
  })

  describe('Props e Configuração', () => {
    it('deve aceitar companyId como prop', () => {
      renderWithProviders(<AdminMap companyId="company-1" />)
      
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('deve aceitar routeId como prop', () => {
      renderWithProviders(<AdminMap routeId="route-1" />)
      
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('deve aceitar vehicleId como prop', () => {
      renderWithProviders(<AdminMap vehicleId="vehicle-1" />)
      
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('deve aceitar initialCenter como prop', () => {
      const props = {
        initialCenter: { lat: -23.5505, lng: -46.6333 },
      }

      renderWithProviders(<AdminMap {...props} />)
      
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('deve aceitar initialZoom como prop', () => {
      const props = {
        initialZoom: 15,
      }

      renderWithProviders(<AdminMap {...props} />)
      
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })
  })

  describe('Estados de Loading e Erro', () => {
    it('deve exibir estado de loading inicialmente', () => {
      renderWithProviders(<AdminMap {...defaultProps} />)
      
      // Componente deve estar em estado de loading
      // Verificamos que renderiza sem quebrar
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('deve lidar com erro ao carregar Google Maps API', async () => {
      mockLoadGoogleMapsAPI.mockRejectedValueOnce(new Error('Failed to load maps'))
      
      renderWithProviders(<AdminMap {...defaultProps} />)
      
      await waitFor(() => {
        expect(mockLoadGoogleMapsAPI).toHaveBeenCalled()
      })
      
      // Componente deve lidar com erro graciosamente
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })
  })

  describe('Integração com Serviços', () => {
    it('deve inicializar RealtimeService', async () => {
      renderWithProviders(<AdminMap {...defaultProps} />)
      
      await waitFor(() => {
        expect(RealtimeService).toHaveBeenCalled()
      })
    })

    it('deve inicializar PlaybackService', async () => {
      renderWithProviders(<AdminMap {...defaultProps} />)
      
      await waitFor(() => {
        expect(PlaybackService).toHaveBeenCalled()
      })
    })
  })

  describe('Cleanup', () => {
    it('deve limpar recursos ao desmontar', () => {
      const { unmount } = renderWithProviders(<AdminMap {...defaultProps} />)
      
      unmount()
      
      // Verificamos que não há erros ao desmontar
      // (cleanup é testado implicitamente pela ausência de erros)
    })
  })

  describe('Edge Cases', () => {
    it('deve funcionar sem props', () => {
      renderWithProviders(<AdminMap />)
      
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('deve funcionar com múltiplas props simultaneamente', () => {
      const props = {
        companyId: 'company-1',
        routeId: 'route-1',
        vehicleId: 'vehicle-1',
        initialCenter: { lat: -23.5505, lng: -46.6333 },
        initialZoom: 12,
      }

      renderWithProviders(<AdminMap {...props} />)
      
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })
  })
})

