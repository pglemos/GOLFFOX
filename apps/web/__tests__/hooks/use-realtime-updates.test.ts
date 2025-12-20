/**
 * Testes para useRealtimeUpdates hooks
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRealtimeKPIs, useRealtimeAlerts, useRealtimeRoutes } from '@/hooks/use-realtime-updates'
import { supabase } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useRealtimeUpdates', () => {
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(supabase.channel as jest.Mock).mockReturnValue(mockChannel)
  })

  describe('useRealtimeKPIs', () => {
    it('deve criar canal quando companyId é fornecido', () => {
      renderHook(() => useRealtimeKPIs('company-1'), { wrapper: createWrapper() })

      expect(supabase.channel).toHaveBeenCalledWith('operador-kpis:company-1')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          table: 'mv_operator_kpis',
          filter: 'company_id=eq.company-1',
        }),
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })

    it('deve não criar canal quando companyId é null', () => {
      renderHook(() => useRealtimeKPIs(null), { wrapper: createWrapper() })

      expect(supabase.channel).not.toHaveBeenCalled()
    })

    it('deve remover canal ao desmontar', () => {
      const { unmount } = renderHook(() => useRealtimeKPIs('company-1'), {
        wrapper: createWrapper(),
      })

      unmount()

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })

    it('deve invalidar queries quando há mudanças', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      })
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      renderHook(() => useRealtimeKPIs('company-1'), { wrapper })

      const onChangeCallback = (mockChannel.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'postgres_changes'
      )?.[2]

      if (onChangeCallback) {
        onChangeCallback()
      }

      await waitFor(() => {
        expect(queryClient.getQueryCache().find({ queryKey: ['operador-kpis', 'company-1'] })).toBeDefined()
      })
    })
  })

  describe('useRealtimeAlerts', () => {
    it('deve criar canal quando companyId é fornecido', () => {
      renderHook(() => useRealtimeAlerts('company-1'), { wrapper: createWrapper() })

      expect(supabase.channel).toHaveBeenCalledWith('operador-alerts:company-1')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          table: 'gf_alerts',
          filter: 'company_id=eq.company-1',
        }),
        expect.any(Function)
      )
    })

    it('deve invalidar múltiplas queries quando há mudanças', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      })
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      renderHook(() => useRealtimeAlerts('company-1'), { wrapper })

      const onChangeCallback = (mockChannel.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'postgres_changes'
      )?.[2]

      if (onChangeCallback) {
        onChangeCallback()
      }

      await waitFor(() => {
        expect(queryClient.getQueryCache().find({ queryKey: ['alerts', 'company-1'] })).toBeDefined()
        expect(queryClient.getQueryCache().find({ queryKey: ['control-tower', 'company-1'] })).toBeDefined()
      })
    })
  })

  describe('useRealtimeRoutes', () => {
    it('deve criar canal quando companyId é fornecido', () => {
      renderHook(() => useRealtimeRoutes('company-1'), { wrapper: createWrapper() })

      expect(supabase.channel).toHaveBeenCalledWith('operador-routes:company-1')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          table: 'routes',
        }),
        expect.any(Function)
      )
    })

    it('deve remover canal ao desmontar', () => {
      const { unmount } = renderHook(() => useRealtimeRoutes('company-1'), {
        wrapper: createWrapper(),
      })

      unmount()

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })
  })
})

