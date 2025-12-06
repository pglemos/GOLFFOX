import { useState, useEffect, useCallback, useRef } from 'react'

export interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  loadTime: number
  renderTime: number
  networkLatency: number
  cacheHitRate: number
}

export interface PerformanceConfig {
  enableFPSMonitoring: boolean
  enableMemoryMonitoring: boolean
  enableNetworkMonitoring: boolean
  fpsThreshold: number
  memoryThreshold: number
  sampleInterval: number
}

const defaultConfig: PerformanceConfig = {
  enableFPSMonitoring: true,
  enableMemoryMonitoring: true,
  enableNetworkMonitoring: true,
  fpsThreshold: 30,
  memoryThreshold: 50 * 1024 * 1024, // 50MB
  sampleInterval: 1000, // 1 second
}

export function usePerformance(config: Partial<PerformanceConfig> = {}): {
  metrics: PerformanceMetrics
  isPerformanceGood: boolean
  measureOperation: (name: string, operation: () => Promise<any>) => Promise<any>
  clearMetrics: () => void
} {
  const finalConfig = { ...defaultConfig, ...config }
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    networkLatency: 0,
    cacheHitRate: 100,
  })

  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const animationFrame = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // FPS Monitoring
  const measureFPS = useCallback(() => {
    if (!finalConfig.enableFPSMonitoring) return

    const now = performance.now()
    frameCount.current++

    if (now - lastTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current))
      setMetrics(prev => ({ ...prev, fps }))
      frameCount.current = 0
      lastTime.current = now
    }

    animationFrame.current = requestAnimationFrame(measureFPS)
  }, [finalConfig.enableFPSMonitoring])

  // Memory Monitoring
  const measureMemory = useCallback(() => {
    if (!finalConfig.enableMemoryMonitoring || !('memory' in performance)) return

    const memory = (performance as any).memory
    if (memory) {
      const memoryUsage = memory.usedJSHeapSize
      setMetrics(prev => ({ ...prev, memoryUsage }))
    }
  }, [finalConfig.enableMemoryMonitoring])

  // Network Latency Monitoring
  const measureNetworkLatency = useCallback(async () => {
    if (!finalConfig.enableNetworkMonitoring) return

    const start = performance.now()
    try {
      // Ping a small resource to measure latency
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
      const latency = performance.now() - start
      setMetrics(prev => ({ ...prev, networkLatency: latency }))
    } catch (error) {
      // Network error, set high latency
      setMetrics(prev => ({ ...prev, networkLatency: 5000 }))
    }
  }, [finalConfig.enableNetworkMonitoring])

  // Operation Measurement
  const measureOperation = useCallback(async (name: string, operation: () => Promise<any>) => {
    const start = performance.now()
    
    try {
      const result = await operation()
      const duration = performance.now() - start
      
      // Update render time for UI operations
      if (name.includes('render') || name.includes('ui')) {
        setMetrics(prev => ({ ...prev, renderTime: duration }))
      }
      
      // Update load time for data operations
      if (name.includes('load') || name.includes('fetch')) {
        setMetrics(prev => ({ ...prev, loadTime: duration }))
      }

      return result
    } catch (error) {
      const duration = performance.now() - start
      console.warn(`Performance: Operation "${name}" failed after ${duration}ms`, error)
      throw error
    }
  }, [])

  // Clear metrics
  const clearMetrics = useCallback(() => {
    setMetrics({
      fps: 60,
      memoryUsage: 0,
      loadTime: 0,
      renderTime: 0,
      networkLatency: 0,
      cacheHitRate: 100,
    })
  }, [])

  // Performance assessment
  const isPerformanceGood = 
    metrics.fps >= finalConfig.fpsThreshold &&
    metrics.memoryUsage <= finalConfig.memoryThreshold &&
    metrics.networkLatency <= 1000 &&
    metrics.renderTime <= 16.67 // 60fps = 16.67ms per frame

  useEffect(() => {
    // Start FPS monitoring
    if (finalConfig.enableFPSMonitoring) {
      animationFrame.current = requestAnimationFrame(measureFPS)
    }

    // Start periodic monitoring
    intervalRef.current = setInterval(() => {
      measureMemory()
      measureNetworkLatency()
    }, finalConfig.sampleInterval)

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [finalConfig, measureFPS, measureMemory, measureNetworkLatency])

  return {
    metrics,
    isPerformanceGood,
    measureOperation,
    clearMetrics,
  }
}

// Hook para lazy loading de imagens
export function useLazyImage(src: string, options: IntersectionObserverInit = {}): {
  imageSrc: string | null
  isLoaded: boolean
  isInView: boolean
  ref: React.RefObject<HTMLElement | null>
} {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsInView(true)
          setImageSrc(src)
          observer.unobserve(element)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [src, options])

  useEffect(() => {
    if (!imageSrc) return

    const img = new Image()
    img.onload = () => setIsLoaded(true)
    img.onerror = () => setIsLoaded(false)
    img.src = imageSrc
  }, [imageSrc])

  return { imageSrc, isLoaded, isInView, ref }
}

// Hook para debounce de valores
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para throttle de funções
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now
        return callback(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now()
          callback(...args)
        }, delay - (now - lastCall.current)) as unknown as NodeJS.Timeout
      }
    }) as T,
    [callback, delay]
  )
}