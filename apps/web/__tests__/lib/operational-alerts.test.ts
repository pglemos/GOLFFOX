/**
 * Testes para Operational Alerts
 */

import {
  createAlert,
  alertApiError,
  alertCronFailure,
  alertPerformanceIssue,
  alertSyncFailure,
  alertRouteDeviation,
} from '@/lib/operational-alerts'
import { supabase } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

describe('Operational Alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    return () => {
      consoleErrorSpy.mockRestore()
    }
  })

  describe('createAlert', () => {
    it('deve criar alerta com sucesso', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await createAlert({
        type: 'api_error',
        severity: 'error',
        title: 'Test Alert',
        message: 'Test message',
        details: { endpoint: '/api/test' },
        source: 'test',
        company_id: 'company-1',
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api_error',
          severity: 'error',
          title: 'Test Alert',
          message: 'Test message',
          details: { endpoint: '/api/test' },
          source: 'test',
          company_id: 'company-1',
          is_resolved: false,
        })
      )
    })

    it('deve usar valores padrão quando campos opcionais não fornecidos', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await createAlert({
        type: 'other',
        severity: 'info',
        title: 'Test',
        message: 'Test message',
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {},
          source: 'web-app',
          metadata: {},
          company_id: null,
        })
      )
    })

    it('deve lidar com erros sem quebrar', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockRejectedValue(new Error('Database error')),
      })

      await expect(
        createAlert({
          type: 'other',
          severity: 'info',
          title: 'Test',
          message: 'Test message',
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('alertApiError', () => {
    it('deve criar alerta para erro 500+', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await alertApiError('/api/test', 500, 'Internal server error', { userId: 'user-1' })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api_error',
          severity: 'error',
          title: 'Erro de API: /api/test',
          message: 'Status 500: Internal server error',
          source: 'api-client',
          details: expect.objectContaining({
            endpoint: '/api/test',
            status: 500,
            error: 'Internal server error',
            userId: 'user-1',
          }),
        })
      )
    })

    it('deve criar alerta com severity warning para status 4xx', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await alertApiError('/api/test', 400, 'Bad request')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warning',
        })
      )
    })

    it('deve ignorar erros abaixo de 500', async () => {
      const mockInsert = jest.fn()
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await alertApiError('/api/test', 404, 'Not found')

      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('alertCronFailure', () => {
    it('deve criar alerta de falha de cron', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await alertCronFailure('refresh-kpis', 'Failed to refresh', { attempt: 1 })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cron_failure',
          severity: 'critical',
          title: 'Falha no Cron Job: refresh-kpis',
          message: 'Failed to refresh',
          details: expect.objectContaining({
            cron_name: 'refresh-kpis',
            error: 'Failed to refresh',
            attempt: 1,
          }),
        })
      )
    })
  })

  describe('alertPerformanceIssue', () => {
    it('deve criar alerta de performance', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await alertPerformanceIssue('slow-query', 5000, { query: 'SELECT * FROM users' })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance',
          severity: 'warning',
          title: 'Problema de Performance: slow-query',
          details: expect.objectContaining({
            metric: 'slow-query',
            value: 5000,
            query: 'SELECT * FROM users',
          }),
        })
      )
    })
  })

  describe('alertSyncFailure', () => {
    it('deve criar alerta de falha de sincronização', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await alertSyncFailure('veiculo', 'veiculo-1', 'Network error', { retryCount: 3 })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sync_failure',
          severity: 'error',
          title: 'Falha de Sincronização: veiculo',
          message: 'Network error',
          details: expect.objectContaining({
            resource_type: 'veiculo',
            resource_id: 'veiculo-1',
            error: 'Network error',
            retryCount: 3,
          }),
        })
      )
    })
  })

  describe('alertRouteDeviation', () => {
    it('deve criar alerta de desvio de rota', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await alertRouteDeviation('route-1', 'veiculo-1', 1000, {
        expectedLat: -19.916681,
        actualLat: -19.917681,
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'route_deviation',
          severity: 'warning',
          title: 'Desvio de Rota Detectado',
          message: expect.stringContaining('route-1'),
          details: expect.objectContaining({
            route_id: 'route-1',
            vehicle_id: 'veiculo-1',
            deviation_meters: 1000,
            expectedLat: -19.916681,
            actualLat: -19.917681,
          }),
        })
      )
    })
  })
})

