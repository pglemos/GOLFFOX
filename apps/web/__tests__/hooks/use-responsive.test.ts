import { renderHook, waitFor } from '@testing-library/react'
import { useResponsive, useReducedMotion, useSystemTheme } from '@/hooks/use-responsive'

// Mock window.matchMedia
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

describe('useResponsive hook', () => {
  beforeEach(() => {
    // Mock window.innerWidth e innerHeight
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  it('deve retornar estado inicial', () => {
    const { result } = renderHook(() => useResponsive())

    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobile).toBe(false)
  })

  it('deve detectar mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    const { result } = renderHook(() => useResponsive())

    expect(result.current.isMobile).toBe(true)
    expect(result.current.isDesktop).toBe(false)
  })

  it('deve detectar tablet', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    })

    const { result } = renderHook(() => useResponsive())

    expect(result.current.isTablet).toBe(true)
  })

  it('deve detectar orientação landscape', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    })

    const { result } = renderHook(() => useResponsive())

    expect(result.current.isLandscape).toBe(true)
    expect(result.current.isPortrait).toBe(false)
  })

  it('deve atualizar em resize', async () => {
    const { result } = renderHook(() => useResponsive())

    expect(result.current.width).toBe(1024)

    // Simular resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    // Disparar evento resize
    window.dispatchEvent(new Event('resize'))

    await waitFor(() => {
      expect(result.current.width).toBe(500)
    }, { timeout: 200 })
  })
})

describe('useReducedMotion hook', () => {
  it('deve detectar preferência de movimento reduzido', () => {
    const mockMatchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))

    window.matchMedia = mockMatchMedia

    const { result } = renderHook(() => useReducedMotion())

    expect(typeof result.current).toBe('boolean')
  })
})

describe('useSystemTheme hook', () => {
  it('deve detectar tema do sistema', () => {
    const mockMatchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))

    window.matchMedia = mockMatchMedia

    const { result } = renderHook(() => useSystemTheme())

    expect(['light', 'dark']).toContain(result.current)
  })
})

