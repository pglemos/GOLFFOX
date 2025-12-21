/**
 * Testes para Web Vitals
 */

import {
  collectWebVitals,
  sendWebVitalsToServer,
  getWebVitalsReport,
  getMetric,
  getPoorMetrics,
  resetMetrics,
  initWebVitals,
} from '@/lib/web-vitals'
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'
import { warn, debug } from '@/lib/logger'

jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  warn: jest.fn(),
  debug: jest.fn(),
}))

const originalWindow = global.window
const originalDocument = global.document
const originalNavigator = global.navigator
const originalFetch = global.fetch

describe('Web Vitals', () => {
  let originalWindowDescriptor: PropertyDescriptor | undefined
  let originalDocumentDescriptor: PropertyDescriptor | undefined
  let originalNavigatorDescriptor: PropertyDescriptor | undefined
  let originalFetch: typeof fetch

  beforeEach(() => {
    jest.clearAllMocks()
    resetMetrics()

    // Store original descriptors
    originalWindowDescriptor = Object.getOwnPropertyDescriptor(global, 'window')
    originalDocumentDescriptor = Object.getOwnPropertyDescriptor(global, 'document')
    originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(global, 'navigator')
    originalFetch = global.fetch

    Object.defineProperty(global, 'window', {
      value: {
        location: { href: 'http://localhost:3000/test' },
      },
      writable: true,
      configurable: true,
    })

    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'test-agent',
        onLine: true,
        sendBeacon: jest.fn(() => true),
      },
      writable: true,
      configurable: true,
    })

    Object.defineProperty(global, 'document', {
      value: {
        addEventListener: jest.fn(),
        visibilityState: 'visible',
      },
      writable: true,
      configurable: true,
    })

    global.fetch = jest.fn().mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    // Restore original descriptors
    if (originalWindowDescriptor) {
      Object.defineProperty(global, 'window', originalWindowDescriptor)
    }
    if (originalDocumentDescriptor) {
      Object.defineProperty(global, 'document', originalDocumentDescriptor)
    }
    if (originalNavigatorDescriptor) {
      Object.defineProperty(global, 'navigator', originalNavigatorDescriptor)
    }
    global.fetch = originalFetch
  })

  describe('collectWebVitals', () => {
    it('deve retornar early em ambiente server-side', () => {
      delete (global as any).window
      collectWebVitals()
      expect(onCLS).not.toHaveBeenCalled()
    })

    it('deve registrar callbacks para todas as métricas', () => {
      collectWebVitals()

      expect(onCLS).toHaveBeenCalled()
      expect(onFCP).toHaveBeenCalled()
      expect(onINP).toHaveBeenCalled()
      expect(onLCP).toHaveBeenCalled()
      expect(onTTFB).toHaveBeenCalled()
    })

    it('deve coletar métrica CLS e classificar como good', () => {
      collectWebVitals()

      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0]
      clsCallback({
        value: 0.05,
        delta: 0.05,
        id: 'cls-1',
        navigationType: 'navigate',
      })

      const metric = getMetric('CLS')
      expect(metric).toBeDefined()
      expect(metric?.value).toBe(0.05)
      expect(metric?.rating).toBe('good')
    })

    it('deve classificar CLS como poor e logar warning', () => {
      collectWebVitals()

      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0]
      clsCallback({
        value: 0.3,
        delta: 0.3,
        id: 'cls-2',
        navigationType: 'navigate',
      })

      const metric = getMetric('CLS')
      expect(metric?.rating).toBe('poor')
      expect(warn).toHaveBeenCalled()
    })

    it('deve coletar métrica FCP', () => {
      collectWebVitals()

      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0]
      fcpCallback({
        value: 1500,
        delta: 1500,
        id: 'fcp-1',
        navigationType: 'navigate',
      })

      const metric = getMetric('FCP')
      expect(metric).toBeDefined()
      expect(metric?.value).toBe(1500)
    })

    it('deve coletar métrica INP e classificar como poor', () => {
      collectWebVitals()

      const inpCallback = (onINP as jest.Mock).mock.calls[0][0]
      inpCallback({
        value: 600,
        delta: 600,
        id: 'inp-1',
        navigationType: 'navigate',
      })

      const metric = getMetric('INP')
      expect(metric?.rating).toBe('poor')
      expect(warn).toHaveBeenCalled()
    })

    it('deve coletar métrica LCP', () => {
      collectWebVitals()

      const lcpCallback = (onLCP as jest.Mock).mock.calls[0][0]
      lcpCallback({
        value: 2000,
        delta: 2000,
        id: 'lcp-1',
        navigationType: 'navigate',
      })

      const metric = getMetric('LCP')
      expect(metric).toBeDefined()
      expect(metric?.value).toBe(2000)
    })

    it('deve coletar métrica TTFB', () => {
      collectWebVitals()

      const ttfbCallback = (onTTFB as jest.Mock).mock.calls[0][0]
      ttfbCallback({
        value: 500,
        delta: 500,
        id: 'ttfb-1',
        navigationType: 'navigate',
      })

      const metric = getMetric('TTFB')
      expect(metric).toBeDefined()
      expect(metric?.value).toBe(500)
    })
  })

  describe('sendWebVitalsToServer', () => {
    it('deve usar sendBeacon quando disponível', async () => {
      const report = {
        url: 'http://localhost:3000/test',
        userAgent: 'test-agent',
        timestamp: Date.now(),
        metrics: [],
      }

      await sendWebVitalsToServer(report)

      expect((global.navigator as any).sendBeacon).toHaveBeenCalledWith(
        '/api/analytics/web-vitals',
        expect.any(Blob)
      )
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('deve usar fetch como fallback quando sendBeacon retorna false', async () => {
      ; (global.navigator as any).sendBeacon = jest.fn(() => false)

      const report = {
        url: 'http://localhost:3000/test',
        userAgent: 'test-agent',
        timestamp: Date.now(),
        metrics: [],
      }

      await sendWebVitalsToServer(report)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/web-vitals',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          cache: 'no-store',
        })
      )
    })

    it('deve usar fetch quando sendBeacon não disponível', async () => {
      delete (global.navigator as any).sendBeacon

      const report = {
        url: 'http://localhost:3000/test',
        userAgent: 'test-agent',
        timestamp: Date.now(),
        metrics: [],
      }

      await sendWebVitalsToServer(report)

      expect(global.fetch).toHaveBeenCalled()
    })

    it('deve lidar com erros silenciosamente quando documento está hidden', async () => {
      ; (global.document as any).visibilityState = 'hidden'
        ; (global.navigator as any).sendBeacon = jest.fn(() => false)
        ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const report = {
        url: 'http://localhost:3000/test',
        userAgent: 'test-agent',
        timestamp: Date.now(),
        metrics: [],
      }

      await expect(sendWebVitalsToServer(report)).resolves.toBeUndefined()
    })
  })

  describe('getWebVitalsReport', () => {
    it('deve retornar relatório com métricas coletadas', () => {
      collectWebVitals()

      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0]
      clsCallback({
        value: 0.1,
        delta: 0.1,
        id: 'cls-1',
        navigationType: 'navigate',
      })

      const report = getWebVitalsReport()

      expect(report.url).toBe('http://localhost:3000/test')
      expect(report.userAgent).toBe('test-agent')
      expect(report.metrics).toHaveLength(1)
      expect(report.metrics[0].name).toBe('CLS')
    })
  })

  describe('getMetric', () => {
    it('deve retornar métrica específica por nome', () => {
      collectWebVitals()

      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0]
      clsCallback({
        value: 0.1,
        delta: 0.1,
        id: 'cls-1',
        navigationType: 'navigate',
      })

      const metric = getMetric('CLS')
      expect(metric).toBeDefined()
      expect(metric?.name).toBe('CLS')
    })

    it('deve retornar undefined para métrica não encontrada', () => {
      const metric = getMetric('NON_EXISTENT')
      expect(metric).toBeUndefined()
    })
  })

  describe('getPoorMetrics', () => {
    it('deve retornar apenas métricas com rating poor', () => {
      collectWebVitals()

      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0]
      clsCallback({
        value: 0.3, // poor
        delta: 0.3,
        id: 'cls-1',
        navigationType: 'navigate',
      })

      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0]
      fcpCallback({
        value: 1500, // good
        delta: 1500,
        id: 'fcp-1',
        navigationType: 'navigate',
      })

      const poorMetrics = getPoorMetrics()
      expect(poorMetrics).toHaveLength(1)
      expect(poorMetrics[0].name).toBe('CLS')
    })
  })

  describe('resetMetrics', () => {
    it('deve limpar todas as métricas coletadas', () => {
      collectWebVitals()

      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0]
      clsCallback({
        value: 0.1,
        delta: 0.1,
        id: 'cls-1',
        navigationType: 'navigate',
      })

      expect(getWebVitalsReport().metrics.length).toBeGreaterThan(0)

      resetMetrics()

      expect(getWebVitalsReport().metrics).toHaveLength(0)
    })
  })

  describe('initWebVitals', () => {
    it('deve retornar early em ambiente server-side', () => {
      delete (global as any).window
      initWebVitals()
      expect(onCLS).not.toHaveBeenCalled()
    })

    it('deve inicializar coleta e registrar listener de visibilitychange', () => {
      initWebVitals()

      expect(onCLS).toHaveBeenCalled()
      expect(global.document.addEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      )
    })

    it('deve enviar métricas quando documento fica hidden', () => {
      initWebVitals()

      const visibilityCallback = (global.document.addEventListener as jest.Mock).mock.calls.find(
        (call) => call[0] === 'visibilitychange'
      )?.[1]

      collectWebVitals()
      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0]
      clsCallback({
        value: 0.1,
        delta: 0.1,
        id: 'cls-1',
        navigationType: 'navigate',
      })

        ; (global.document as any).visibilityState = 'hidden'
      visibilityCallback?.()

      expect(global.fetch).toHaveBeenCalled()
    })
  })
})

