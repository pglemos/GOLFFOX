import { renderHook, waitFor } from '@testing-library/react'
import { usePerformance, useLazyImage, useThrottle } from '@/hooks/use-performance'

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 10 * 1024 * 1024, // 10MB
  },
} as any

global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16)
  return 1
}) as any

global.cancelAnimationFrame = jest.fn()

describe('usePerformance hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('deve retornar métricas iniciais', () => {
    const { result } = renderHook(() => usePerformance())

    expect(result.current.metrics).toBeDefined()
    expect(result.current.metrics.fps).toBe(60)
    expect(typeof result.current.isPerformanceGood).toBe('boolean')
  })

  it('deve medir operação assíncrona', async () => {
    const { result } = renderHook(() => usePerformance())

    const operation = jest.fn(async () => 'result')
    const measured = await result.current.measureOperation('test-operation', operation)

    expect(measured).toBe('result')
    expect(operation).toHaveBeenCalled()
  })

  it('deve limpar métricas', () => {
    const { result } = renderHook(() => usePerformance())

    result.current.clearMetrics()

    expect(result.current.metrics.fps).toBe(60)
    expect(result.current.metrics.memoryUsage).toBe(0)
  })

  it('deve desabilitar monitoramento FPS', () => {
    const { result } = renderHook(() => usePerformance({
      enableFPSMonitoring: false,
    }))

    expect(result.current.metrics).toBeDefined()
  })
})

describe('useLazyImage hook', () => {
  beforeEach(() => {
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })) as any
  })

  it('deve retornar estado inicial', () => {
    const { result } = renderHook(() => useLazyImage('test.jpg'))

    expect(result.current.imageSrc).toBeNull()
    expect(result.current.isLoaded).toBe(false)
    expect(result.current.isInView).toBe(false)
    expect(result.current.ref).toBeDefined()
  })
})

describe('useThrottle hook', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('deve throttle chamadas', () => {
    const callback = jest.fn()
    const { result } = renderHook(() => useThrottle(callback, 100))

    result.current()
    result.current()
    result.current()

    jest.advanceTimersByTime(50)
    expect(callback).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(100)
    expect(callback).toHaveBeenCalledTimes(2)
  })
})

