/**
 * Testes para useAccessibility hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAccessibility, useListNavigation } from '@/hooks/use-accessibility'

const originalDocument = global.document
const originalWindow = global.window
const originalNavigator = global.navigator

describe('useAccessibility', () => {
  beforeEach(() => {
    global.document = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      createElement: jest.fn((tag) => {
        if (tag === 'div') {
          return {
            setAttribute: jest.fn(),
            textContent: '',
            style: {},
          } as any
        }
        return {} as any
      }),
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
      },
      querySelector: jest.fn(),
      documentElement: {
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
        },
      },
    } as any

    global.window = {
      matchMedia: jest.fn(() => ({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
      speechSynthesis: {
        getVoices: jest.fn(() => []),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    } as any

    global.navigator = {
      userAgent: 'test-agent',
    } as any
  })

  afterEach(() => {
    global.document = originalDocument
    global.window = originalWindow
    global.navigator = originalNavigator
  })

  it('deve retornar estado inicial', () => {
    const { result } = renderHook(() => useAccessibility())

    expect(result.current.state.isKeyboardUser).toBe(false)
    expect(result.current.state.isScreenReaderActive).toBe(false)
    expect(result.current.state.focusedElement).toBeNull()
    expect(result.current.announce).toBeDefined()
    expect(result.current.focusElement).toBeDefined()
    expect(result.current.trapFocus).toBeDefined()
    expect(result.current.skipToContent).toBeDefined()
    expect(result.current.toggleHighContrast).toBeDefined()
  })

  it('deve detectar uso de teclado', () => {
    const { result } = renderHook(() => useAccessibility())

    act(() => {
      const keyDownHandler = (global.document.addEventListener as jest.Mock).mock.calls.find(
        (call) => call[0] === 'keydown'
      )?.[1]
      if (keyDownHandler) {
        keyDownHandler({} as KeyboardEvent)
      }
    })

    expect(result.current.state.isKeyboardUser).toBe(true)
  })

  it('deve detectar uso de mouse', () => {
    const { result } = renderHook(() => useAccessibility())

    act(() => {
      const mouseDownHandler = (global.document.addEventListener as jest.Mock).mock.calls.find(
        (call) => call[0] === 'mousedown'
      )?.[1]
      if (mouseDownHandler) {
        mouseDownHandler({} as MouseEvent)
      }
    })

    expect(result.current.state.isKeyboardUser).toBe(false)
  })

  it('deve anunciar mensagens', () => {
    const { result } = renderHook(() => useAccessibility())

    act(() => {
      result.current.announce('Test announcement')
    })

    expect(result.current.state.announcements).toContain('Test announcement')
  })

  it('deve focar elemento', () => {
    const mockElement = {
      focus: jest.fn(),
      scrollIntoView: jest.fn(),
    } as any

    const { result } = renderHook(() => useAccessibility())

    act(() => {
      result.current.focusElement(mockElement)
    })

    expect(mockElement.focus).toHaveBeenCalled()
    expect(mockElement.scrollIntoView).toHaveBeenCalled()
  })

  it('deve criar focus trap', () => {
    const mockContainer = {
      querySelectorAll: jest.fn(() => [
        { focus: jest.fn() },
        { focus: jest.fn() },
      ]),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as any

    const { result } = renderHook(() => useAccessibility())

    let cleanup: (() => void) | undefined

    act(() => {
      cleanup = result.current.trapFocus(mockContainer)
    })

    expect(mockContainer.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))

    if (cleanup) {
      act(() => {
        cleanup()
      })
      expect(mockContainer.removeEventListener).toHaveBeenCalled()
    }
  })

  it('deve alternar high contrast', () => {
    const { result } = renderHook(() => useAccessibility())

    act(() => {
      result.current.toggleHighContrast()
    })

    expect(global.document.documentElement.classList.add).toHaveBeenCalledWith('high-contrast')
  })

  it('deve pular para conteúdo principal', () => {
    const mockMain = {
      focus: jest.fn(),
      scrollIntoView: jest.fn(),
    } as any

    ;(global.document.querySelector as jest.Mock).mockReturnValue(mockMain)

    const { result } = renderHook(() => useAccessibility())

    act(() => {
      result.current.skipToContent()
    })

    expect(mockMain.focus).toHaveBeenCalled()
  })
})

describe('useListNavigation', () => {
  it('deve retornar estado inicial', () => {
    const items: HTMLElement[] = []
    const { result } = renderHook(() => useListNavigation(items))

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.setCurrentIndex).toBeDefined()
    expect(result.current.handleKeyDown).toBeDefined()
  })

  it('deve navegar para próximo item com ArrowDown', () => {
    const items = [
      { focus: jest.fn() } as any,
      { focus: jest.fn() } as any,
    ]

    const { result } = renderHook(() => useListNavigation(items, { orientation: 'vertical' }))

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: jest.fn() } as any)
    })

    expect(result.current.currentIndex).toBe(1)
  })

  it('deve navegar para item anterior com ArrowUp', () => {
    const items = [
      { focus: jest.fn() } as any,
      { focus: jest.fn() } as any,
    ]

    const { result } = renderHook(() => useListNavigation(items, { orientation: 'vertical' }))

    act(() => {
      result.current.setCurrentIndex(1)
    })

    act(() => {
      result.current.handleKeyDown({ key: 'ArrowUp', preventDefault: jest.fn() } as any)
    })

    expect(result.current.currentIndex).toBe(0)
  })
})

