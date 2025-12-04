import { useDebounce } from '@/lib/debounce'
import { renderHook, waitFor } from '@testing-library/react'

describe('lib/debounce', () => {
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

  it('deve debounce mudanças', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial')

    jest.advanceTimersByTime(500)
    expect(result.current).toBe('updated')
  })

  it('deve limpar timeout ao desmontar', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    const { unmount } = renderHook(() => useDebounce('test', 500))

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})

