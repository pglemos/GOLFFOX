/**
 * Testes para retry-utils
 */

import { withRetry, RetryOptions, calculateBackoff } from '@/lib/retry-utils'

describe('retry-utils', () => {
  describe('calculateBackoff', () => {
    it('deve calcular backoff exponencial corretamente', () => {
      const baseDelay = 1000

      expect(calculateBackoff(0, baseDelay)).toBe(1000)
      expect(calculateBackoff(1, baseDelay)).toBe(2000)
      expect(calculateBackoff(2, baseDelay)).toBe(4000)
      expect(calculateBackoff(3, baseDelay)).toBe(8000)
    })

    it('deve respeitar maxDelay', () => {
      const baseDelay = 1000
      const maxDelay = 5000

      expect(calculateBackoff(10, baseDelay, maxDelay)).toBeLessThanOrEqual(maxDelay)
    })

    it('deve adicionar jitter quando configurado', () => {
      const baseDelay = 1000
      const results = new Set<number>()

      for (let i = 0; i < 10; i++) {
        results.add(calculateBackoff(0, baseDelay, 30000, true))
      }

      // Com jitter, devemos ter valores diferentes
      expect(results.size).toBeGreaterThan(1)
    })
  })

  describe('withRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('deve executar função com sucesso na primeira tentativa', async () => {
      const fn = jest.fn().mockResolvedValue('success')

      const result = await withRetry(fn, { maxRetries: 3 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('deve fazer retry após falha', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success')

      const promise = withRetry(fn, { maxRetries: 3, baseDelay: 100 })
      
      // Avançar timers para permitir retry
      await jest.advanceTimersByTimeAsync(150)

      const result = await promise

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('deve lançar erro após esgotar retries', async () => {
      const error = new Error('persistent error')
      const fn = jest.fn().mockRejectedValue(error)

      const promise = withRetry(fn, { maxRetries: 2, baseDelay: 100 })

      // Avançar timers para todas as tentativas
      await jest.advanceTimersByTimeAsync(500)

      await expect(promise).rejects.toThrow('persistent error')
      expect(fn).toHaveBeenCalledTimes(3) // 1 inicial + 2 retries
    })

    it('deve chamar onRetry callback', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success')
      const onRetry = jest.fn()

      const promise = withRetry(fn, { maxRetries: 3, baseDelay: 100, onRetry })
      
      await jest.advanceTimersByTimeAsync(150)
      await promise

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
    })

    it('deve respeitar shouldRetry', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('no retry'))
      const shouldRetry = jest.fn().mockReturnValue(false)

      const promise = withRetry(fn, { maxRetries: 3, shouldRetry })

      await expect(promise).rejects.toThrow('no retry')
      expect(fn).toHaveBeenCalledTimes(1)
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error))
    })

    it('deve fazer retry apenas para erros específicos', async () => {
      const networkError = new Error('Network Error')
      const validationError = new Error('Validation Error')
      
      const fn = jest
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(validationError)
      
      const shouldRetry = (error: Error) => error.message.includes('Network')

      const promise = withRetry(fn, { maxRetries: 3, baseDelay: 100, shouldRetry })
      
      await jest.advanceTimersByTimeAsync(150)

      await expect(promise).rejects.toThrow('Validation Error')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('deve usar timeout quando configurado', async () => {
      const fn = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      )

      const promise = withRetry(fn, { maxRetries: 1, timeout: 100 })

      await jest.advanceTimersByTimeAsync(200)

      await expect(promise).rejects.toThrow()
    })
  })

  describe('withRetry - cenários de uso real', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('deve funcionar com fetch', async () => {
      const mockFetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: 'test' }) })

      const fetchWithRetry = () => withRetry(
        () => mockFetch('https://api.example.com/data'),
        { maxRetries: 2, baseDelay: 100 }
      )

      const promise = fetchWithRetry()
      await jest.advanceTimersByTimeAsync(150)
      const result = await promise

      expect(result).toEqual({ ok: true, json: expect.any(Function) })
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('deve funcionar com operações de banco de dados', async () => {
      let attempts = 0
      const dbOperation = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Connection lost'))
        }
        return Promise.resolve({ id: 1, name: 'Test' })
      })

      const promise = withRetry(dbOperation, { 
        maxRetries: 3, 
        baseDelay: 100,
        shouldRetry: (error) => error.message.includes('Connection')
      })

      // Avançar tempo para todas as tentativas
      await jest.advanceTimersByTimeAsync(500)
      const result = await promise

      expect(result).toEqual({ id: 1, name: 'Test' })
      expect(dbOperation).toHaveBeenCalledTimes(3)
    })
  })
})

