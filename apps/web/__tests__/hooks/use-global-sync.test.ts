/**
 * Testes para useGlobalSync hook
 */

import { renderHook, act } from '@testing-library/react'
import { useGlobalSync, useCacheInvalidation } from '@/hooks/use-global-sync'
import { globalSyncManager } from '@/lib/global-sync'

jest.mock('@/lib/global-sync', () => ({
  globalSyncManager: {
    subscribe: jest.fn(() => () => {}),
    triggerSync: jest.fn(),
  },
}))

const originalWindow = global.window
const originalLocalStorage = global.localStorage

describe('useGlobalSync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.window = {
      ...originalWindow,
      localStorage: {
        removeItem: jest.fn(),
      } as any,
    } as any
  })

  afterEach(() => {
    global.window = originalWindow
    global.localStorage = originalLocalStorage
  })

  it('deve inscrever em eventos de sincronização', () => {
    const callback = jest.fn()
    const eventTypes: any[] = ['company.created', 'user.updated']

    renderHook(() => useGlobalSync(eventTypes, callback))

    expect(globalSyncManager.subscribe).toHaveBeenCalled()
  })

  it('deve chamar callback quando evento ocorre', () => {
    const callback = jest.fn()
    const eventTypes: any[] = ['company.created']

    renderHook(() => useGlobalSync(eventTypes, callback))

    const subscribeCall = (globalSyncManager.subscribe as jest.Mock).mock.calls[0][0]
    const event = { type: 'company.created', data: { id: 'company-1' } }

    act(() => {
      subscribeCall(event)
    })

    expect(callback).toHaveBeenCalledWith(event)
  })

  it('deve não chamar callback para eventos não inscritos', () => {
    const callback = jest.fn()
    const eventTypes: any[] = ['company.created']

    renderHook(() => useGlobalSync(eventTypes, callback))

    const subscribeCall = (globalSyncManager.subscribe as jest.Mock).mock.calls[0][0]
    const event = { type: 'user.created', data: {} }

    act(() => {
      subscribeCall(event)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('deve retornar função triggerSync', () => {
    const callback = jest.fn()
    const eventTypes: any[] = ['company.created']

    const { result } = renderHook(() => useGlobalSync(eventTypes, callback))

    act(() => {
      result.current('company.created', { id: 'company-1' })
    })

    expect(globalSyncManager.triggerSync).toHaveBeenCalledWith('company.created', { id: 'company-1' })
  })

  it('deve desinscrever ao desmontar', () => {
    const unsubscribe = jest.fn()
    ;(globalSyncManager.subscribe as jest.Mock).mockReturnValue(unsubscribe)

    const callback = jest.fn()
    const eventTypes: any[] = ['company.created']

    const { unmount } = renderHook(() => useGlobalSync(eventTypes, callback))

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })

  it('deve atualizar callback quando deps mudam', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const eventTypes: any[] = ['company.created']

    const { rerender } = renderHook(
      ({ callback }) => useGlobalSync(eventTypes, callback),
      { initialProps: { callback: callback1 } }
    )

    rerender({ callback: callback2 })

    const subscribeCall = (globalSyncManager.subscribe as jest.Mock).mock.calls[0][0]
    const event = { type: 'company.created', data: {} }

    act(() => {
      subscribeCall(event)
    })

    expect(callback2).toHaveBeenCalled()
  })
})

describe('useCacheInvalidation', () => {
  it('deve retornar função de invalidação', () => {
    const { result } = renderHook(() => useCacheInvalidation())

    expect(result.current).toBeDefined()
    expect(typeof result.current).toBe('function')
  })

  it('deve remover itens do cache', () => {
    const { result } = renderHook(() => useCacheInvalidation())

    act(() => {
      result.current(['key1', 'key2'])
    })

    expect(global.window.localStorage.removeItem).toHaveBeenCalledWith('golffox_cache_key1')
    expect(global.window.localStorage.removeItem).toHaveBeenCalledWith('golffox_cache_key2')
  })

  it('deve retornar early em ambiente server-side', () => {
    delete (global as any).window

    const { result } = renderHook(() => useCacheInvalidation())

    act(() => {
      result.current(['key1'])
    })

    // Não deve lançar erro
    expect(result.current).toBeDefined()
  })
})

