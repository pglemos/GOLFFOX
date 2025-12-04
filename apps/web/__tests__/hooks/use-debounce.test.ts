import { renderHook, waitFor } from '@testing-library/react'
import { useDebounce, useDebouncedCallback } from '@/hooks/use-debounce'

describe('useDebounce hook', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('deve retornar valor inicial', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('deve debounce mudanças de valor', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial') // Ainda não atualizou

    jest.advanceTimersByTime(500)
    
    await waitFor(() => {
      expect(result.current).toBe('updated')
    })
  })

  it('deve resetar timer em mudanças rápidas', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 'initial' },
      }
    )

    rerender({ value: 'update1' })
    jest.advanceTimersByTime(300)
    expect(result.current).toBe('initial')

    rerender({ value: 'update2' })
    jest.advanceTimersByTime(300)
    expect(result.current).toBe('initial')

    jest.advanceTimersByTime(500)
    expect(result.current).toBe('update2')
  })

  it('deve limpar timeout ao desmontar', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    const { unmount } = renderHook(() => useDebounce('test', 500))
    
    unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})

describe('useDebouncedCallback hook', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('deve debounce chamadas de callback', () => {
    const callback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    result.current('arg1', 'arg2')
    expect(callback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(500)
    expect(callback).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('deve cancelar chamada anterior em novas chamadas', () => {
    const callback = jest.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    result.current('first')
    jest.advanceTimersByTime(300)
    
    result.current('second')
    jest.advanceTimersByTime(500)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('second')
  })

  it('deve limpar timeout ao desmontar', () => {
    const callback = jest.fn()
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500))

    result.current('test')
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})

