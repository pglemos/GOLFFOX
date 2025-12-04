/**
 * Testes para useAdvancedNavigation hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAdvancedNavigation } from '@/hooks/use-advanced-navigation'
import { useRouter, useSearchParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

const originalDocument = global.document
const originalWindow = global.window

describe('useAdvancedNavigation', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }

  const mockSearchParams = new URLSearchParams()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

    global.document = {
      createElement: jest.fn((tag) => {
        if (tag === 'script') {
          return {
            src: '',
            onload: null,
            onerror: null,
          } as any
        }
        if (tag === 'img') {
          return {
            src: '',
            onload: null,
            onerror: null,
          } as any
        }
        return {} as any
      }),
      head: {
        appendChild: jest.fn(),
      },
    } as any

    global.window = {} as any
  })

  afterEach(() => {
    global.document = originalDocument
    global.window = originalWindow
  })

  it('deve retornar funções e estado inicial', () => {
    const { result } = renderHook(() => useAdvancedNavigation())

    expect(result.current.navigateToTab).toBeDefined()
    expect(result.current.isTransitioning).toBe(false)
    expect(result.current.routeState).toEqual({})
    expect(result.current.calculateOptimalZoom).toBeDefined()
    expect(result.current.TransitionOverlay).toBeDefined()
  })

  it('deve navegar para tab', async () => {
    const { result } = renderHook(() => useAdvancedNavigation())

    await act(async () => {
      await result.current.navigateToTab('mapa')
    })

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalled()
    })
  })

  it('deve calcular zoom ótimo para pontos', () => {
    const { result } = renderHook(() => useAdvancedNavigation())

    const points = [
      { lat: -19.916681, lng: -43.934493 },
      { lat: -19.917681, lng: -43.935493 },
    ]

    const zoomResult = result.current.calculateOptimalZoom(points)

    expect(zoomResult.center).toBeDefined()
    expect(zoomResult.zoom).toBeGreaterThan(0)
    expect(zoomResult.bounds).toBeDefined()
  })

  it('deve retornar fallback quando não há pontos', () => {
    const { result } = renderHook(() => useAdvancedNavigation())

    const zoomResult = result.current.calculateOptimalZoom([])

    expect(zoomResult.center.lat).toBe(-23.5505) // São Paulo fallback
    expect(zoomResult.zoom).toBe(10)
  })

  it('deve pré-carregar assets', async () => {
    const { result } = renderHook(() => useAdvancedNavigation())

    await act(async () => {
      await result.current.navigateToTab('mapa', undefined, { preloadAssets: true })
    })

    expect(global.document.createElement).toHaveBeenCalled()
  })

  it('deve manter estado da rota quando maintainState=true', async () => {
    mockSearchParams.set('route', 'route-1')
    mockSearchParams.set('search', 'test')

    const { result } = renderHook(() => useAdvancedNavigation())

    await act(async () => {
      await result.current.navigateToTab('rotas', undefined, { maintainState: true })
    })

    expect(result.current.routeState.selectedRoute).toBe('route-1')
    expect(result.current.routeState.searchQuery).toBe('test')
  })

  it('deve calcular zoom quando routePoints fornecidos', async () => {
    const { result } = renderHook(() => useAdvancedNavigation())

    const routePoints = [
      { lat: -19.916681, lng: -43.934493 },
      { lat: -19.917681, lng: -43.935493 },
    ]

    await act(async () => {
      await result.current.navigateToTab('mapa', routePoints, { calculateZoom: true })
    })

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('lat=')
      )
    })
  })

  it('deve mostrar overlay durante transição', () => {
    const { result } = renderHook(() => useAdvancedNavigation())

    act(() => {
      // Simular transição iniciada
      result.current.navigateToTab('mapa')
    })

    // TransitionOverlay é um componente, não podemos testar diretamente
    // mas podemos verificar que isTransitioning muda
    expect(result.current.isTransitioning).toBe(true)
  })
})

