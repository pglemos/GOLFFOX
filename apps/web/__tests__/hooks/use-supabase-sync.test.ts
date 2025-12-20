/**
 * Testes para useSupabaseSync hook
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useSupabaseSync } from '@/hooks/use-supabase-sync'
import { syncToSupabase, getSyncStatus, reprocessFailedSyncs } from '@/lib/supabase-sync'
import { notifySuccess, notifyError } from '@/lib/toast'

jest.mock('@/lib/supabase-sync', () => ({
  syncToSupabase: jest.fn(),
  getSyncStatus: jest.fn(() => ({
    totalHistory: 0,
    failedCount: 0,
    recentFailures: 0,
  })),
  reprocessFailedSyncs: jest.fn(),
}))

jest.mock('@/lib/toast', () => ({
  notifySuccess: jest.fn(),
  notifyError: jest.fn(),
}))

describe('useSupabaseSync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar funções e estado inicial', () => {
    const { result } = renderHook(() => useSupabaseSync())

    expect(result.current.sync).toBeDefined()
    expect(result.current.syncing).toBe(false)
    expect(result.current.lastResult).toBeNull()
    expect(result.current.status).toBeDefined()
    expect(result.current.reprocess).toBeDefined()
  })

  it('deve sincronizar com sucesso', async () => {
    const mockResult = {
      success: true,
      attempts: 1,
    }
    ;(syncToSupabase as jest.Mock).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useSupabaseSync())

    const operation = {
      resourceType: 'veiculo',
      resourceId: 'veiculo-1',
      action: 'create' as const,
      data: { plate: 'ABC1234' },
    }

    const syncPromise = result.current.sync(operation)

    expect(result.current.syncing).toBe(true)

    const resultValue = await syncPromise

    await waitFor(() => {
      expect(result.current.syncing).toBe(false)
    })

    expect(result.current.lastResult).toEqual(mockResult)
    expect(resultValue).toEqual(mockResult)
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('deve lidar com falha de sincronização', async () => {
    const mockResult = {
      success: false,
      attempts: 3,
      error: {
        code: 500,
        message: 'Database error',
        body: {},
        timestamp: new Date().toISOString(),
      },
    }
    ;(syncToSupabase as jest.Mock).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useSupabaseSync())

    const operation = {
      resourceType: 'veiculo',
      resourceId: 'veiculo-1',
      action: 'create' as const,
      data: { plate: 'ABC1234' },
    }

    await result.current.sync(operation)

    await waitFor(() => {
      expect(result.current.syncing).toBe(false)
    })

    expect(result.current.lastResult).toEqual(mockResult)
    expect(notifyError).toHaveBeenCalled()
  })

  it('deve chamar onSuccess quando fornecido', async () => {
    const onSuccess = jest.fn()
    const mockResult = {
      success: true,
      attempts: 1,
    }
    ;(syncToSupabase as jest.Mock).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useSupabaseSync({ onSuccess }))

    await result.current.sync({
      resourceType: 'veiculo',
      resourceId: 'veiculo-1',
      action: 'create',
      data: {},
    })

    expect(onSuccess).toHaveBeenCalledWith(mockResult)
  })

  it('deve chamar onError quando fornecido', async () => {
    const onError = jest.fn()
    const mockResult = {
      success: false,
      attempts: 1,
      error: {
        code: 500,
        message: 'Error',
        body: {},
        timestamp: new Date().toISOString(),
      },
    }
    ;(syncToSupabase as jest.Mock).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useSupabaseSync({ onError }))

    await result.current.sync({
      resourceType: 'veiculo',
      resourceId: 'veiculo-1',
      action: 'create',
      data: {},
    })

    expect(onError).toHaveBeenCalledWith(mockResult)
  })

  it('deve não mostrar toast quando showToast=false', async () => {
    const mockResult = {
      success: true,
      attempts: 1,
    }
    ;(syncToSupabase as jest.Mock).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useSupabaseSync({ showToast: false }))

    await result.current.sync({
      resourceType: 'veiculo',
      resourceId: 'veiculo-1',
      action: 'create',
      data: {},
    })

    expect(notifySuccess).not.toHaveBeenCalled()
  })

  it('deve lidar com exceções durante sincronização', async () => {
    const error = new Error('Network error')
    ;(syncToSupabase as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useSupabaseSync())

    const resultValue = await result.current.sync({
      resourceType: 'veiculo',
      resourceId: 'veiculo-1',
      action: 'create',
      data: {},
    })

    expect(resultValue.success).toBe(false)
    expect(resultValue.error?.message).toBe('Network error')
    expect(notifyError).toHaveBeenCalled()
  })

  it('deve reprocessar sincronizações falhas', async () => {
    const mockResult = {
      processed: 5,
      succeeded: 4,
      failed: 1,
    }
    ;(reprocessFailedSyncs as jest.Mock).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useSupabaseSync())

    const reprocessPromise = result.current.reprocess()

    expect(result.current.syncing).toBe(true)

    await reprocessPromise

    await waitFor(() => {
      expect(result.current.syncing).toBe(false)
    })

    expect(notifySuccess).toHaveBeenCalled()
  })

  it('deve lidar com erro durante reprocessamento', async () => {
    const error = new Error('Reprocess error')
    ;(reprocessFailedSyncs as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useSupabaseSync())

    await expect(result.current.reprocess()).rejects.toThrow('Reprocess error')

    expect(notifyError).toHaveBeenCalled()
  })

  it('deve retornar status de sincronização', () => {
    const mockStatus = {
      totalHistory: 10,
      failedCount: 2,
      recentFailures: 1,
    }
    ;(getSyncStatus as jest.Mock).mockReturnValue(mockStatus)

    const { result } = renderHook(() => useSupabaseSync())

    expect(result.current.status).toEqual(mockStatus)
  })
})

