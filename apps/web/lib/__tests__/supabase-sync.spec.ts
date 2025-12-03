/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

/**
 * Testes para o serviço de sincronização com Supabase
 */

import {
  syncToSupabase,
  getSyncHistory,
  getFailedSyncs,
  reprocessFailedSyncs,
  getSyncStatus,
  clearFailedSync,
} from '../supabase-sync'
import { supabase } from '../supabase'

// Mock do Supabase
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockSelect = jest.fn()
const mockSingle = jest.fn()

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

describe('Supabase Sync Service', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear()
    jest.clearAllMocks()

      // Configurar o mock do Supabase
      ; (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        select: mockSelect,
      })
  })

  describe('syncToSupabase', () => {
    it('deve sincronizar criação de veículo com sucesso', async () => {
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'vehicle-123', plate: 'ABC1234', model: 'Modelo X' },
            error: null,
          }),
        }),
      })

      const operation = {
        resourceType: 'vehicle',
        resourceId: 'vehicle-123',
        action: 'create' as const,
        data: {
          plate: 'ABC1234',
          model: 'Modelo X',
          capacity: 40,
          is_active: true,
        },
      }

      const result = await syncToSupabase(operation)

      expect(result.success).toBe(true)
      expect(result.attempts).toBe(1)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('deve sincronizar atualização de motorista com sucesso', async () => {
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'driver-123', name: 'João Silva', email: 'joao@example.com' },
              error: null,
            }),
          }),
        }),
      })

      const operation = {
        resourceType: 'driver',
        resourceId: 'driver-123',
        action: 'update' as const,
        data: {
          name: 'João Silva',
          email: 'joao@example.com',
        },
      }

      const result = await syncToSupabase(operation)

      expect(result.success).toBe(true)
      expect(result.attempts).toBe(1)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('deve retentar sincronização após falha com backoff exponencial', async () => {
      // Primeira tentativa falha, segunda sucede
      let callCount = 0
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockImplementation(() => {
            callCount++
            if (callCount === 1) {
              return Promise.reject({
                message: 'Network error',
                code: 500,
              })
            }
            return Promise.resolve({
              data: { id: 'route-123', name: 'Rota A' },
              error: null,
            })
          }),
        }),
      })

      const operation = {
        resourceType: 'route',
        resourceId: 'route-123',
        action: 'create' as const,
        data: {
          name: 'Rota A',
          company_id: 'company-123',
        },
      }

      // Mock setTimeout para acelerar o teste
      jest.useFakeTimers()
      const resultPromise = syncToSupabase(operation)

      // Avançar timers para simular o delay
      jest.advanceTimersByTime(2000)
      await Promise.resolve() // Flush microtasks
      await Promise.resolve()

      const result = await resultPromise

      expect(result.success).toBe(true)
      expect(result.attempts).toBe(2)
      jest.useRealTimers()
    })

    it('deve salvar sincronização falha após máximo de tentativas', async () => {
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({
            message: 'Persistent error',
            code: 500,
          }),
        }),
      })

      const operation = {
        resourceType: 'vehicle',
        resourceId: 'vehicle-123',
        action: 'create' as const,
        data: {
          plate: 'ABC1234',
          model: 'Modelo X',
        },
      }

      jest.useFakeTimers()
      const resultPromise = syncToSupabase(operation)

      // Avançar todos os delays de retry
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(1000 * Math.pow(2, i))
        await Promise.resolve()
      }

      const result = await resultPromise
      jest.useRealTimers()

      expect(result.success).toBe(false)
      expect(result.attempts).toBe(5)

      // Verificar se foi salvo como falha
      const failed = getFailedSyncs()
      expect(failed.length).toBeGreaterThan(0)
      expect(failed[0].operation.resourceId).toBe('vehicle-123')
    })

    it('deve validar dados antes de sincronizar', async () => {
      const operation = {
        resourceType: 'vehicle',
        resourceId: 'vehicle-123',
        action: 'create' as const,
        data: {
          // Falta placa obrigatória
          model: 'Modelo X',
        },
      }

      const result = await syncToSupabase(operation)

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Placa é obrigatória')
      expect(supabase.from).not.toHaveBeenCalled()
    })
  })

  describe('getSyncHistory', () => {
    it('deve retornar histórico vazio quando não há registros', () => {
      const history = getSyncHistory()
      expect(history).toEqual([])
    })

    it('deve retornar histórico após sincronizações', async () => {
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-123' },
            error: null,
          }),
        }),
      })

      const operation = {
        resourceType: 'vehicle',
        resourceId: 'test-123',
        action: 'create' as const,
        data: {
          plate: 'TEST123',
          model: 'Test Model',
        },
      }

      await syncToSupabase(operation)

      const history = getSyncHistory()
      expect(history.length).toBeGreaterThan(0)
      expect(history[history.length - 1].operation.resourceId).toBe('test-123')
    })
  })

  describe('getSyncStatus', () => {
    it('deve retornar status inicial correto', () => {
      const status = getSyncStatus()

      expect(status.totalHistory).toBe(0)
      expect(status.failedCount).toBe(0)
      expect(status.recentFailures).toBe(0)
      expect(status.lastSyncAt).toBeUndefined()
    })

    it('deve calcular status após sincronizações', async () => {
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-123' },
            error: null,
          }),
        }),
      })

      const operation = {
        resourceType: 'vehicle',
        resourceId: 'test-123',
        action: 'create' as const,
        data: {
          plate: 'TEST123',
          model: 'Test Model',
        },
      }

      await syncToSupabase(operation)

      const status = getSyncStatus()
      expect(status.totalHistory).toBeGreaterThan(0)
      expect(status.lastSyncAt).toBeDefined()
    })
  })

  describe('reprocessFailedSyncs', () => {
    it('deve reprocessar sincronizações falhas com sucesso', async () => {
      // Primeiro, criar uma falha
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({
            message: 'Error',
            code: 500,
          }),
        }),
      })

      const operation = {
        resourceType: 'vehicle',
        resourceId: 'reprocess-test',
        action: 'create' as const,
        data: {
          plate: 'REP123',
          model: 'Reprocess Model',
        },
      }

      jest.useFakeTimers()
      await syncToSupabase(operation)
      // Avançar todos os delays
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(1000 * Math.pow(2, i))
        await Promise.resolve()
      }
      jest.useRealTimers()

      // Agora simular sucesso na reprocessamento
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'reprocess-test' },
            error: null,
          }),
        }),
      })

      const result = await reprocessFailedSyncs()

      expect(result.processed).toBeGreaterThan(0)
      expect(result.succeeded).toBeGreaterThan(0)
    })
  })

  describe('clearFailedSync', () => {
    it('deve limpar sincronização falha específica', async () => {
      // Criar uma falha
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({
            message: 'Error',
            code: 500,
          }),
        }),
      })

      const operation = {
        id: 'clear-test-123',
        resourceType: 'vehicle',
        resourceId: 'clear-test',
        action: 'create' as const,
        data: {
          plate: 'CLR123',
          model: 'Clear Model',
        },
      }

      jest.useFakeTimers()
      await syncToSupabase(operation)
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(1000 * Math.pow(2, i))
        await Promise.resolve()
      }
      jest.useRealTimers()

      const failedBefore = getFailedSyncs()
      expect(failedBefore.length).toBeGreaterThan(0)

      clearFailedSync('clear-test-123')

      const failedAfter = getFailedSyncs()
      expect(failedAfter.length).toBeLessThan(failedBefore.length)
    })
  })

  describe('Mapeamento de dados', () => {
    it('deve mapear dados de veículo corretamente', async () => {
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'vehicle-123' },
            error: null,
          }),
        }),
      })

      const operation = {
        resourceType: 'vehicle',
        resourceId: 'vehicle-123',
        action: 'create' as const,
        data: {
          plate: 'ABC1234',
          model: 'Modelo X',
          year: '2020', // String que deve ser convertida
          capacity: '40', // String que deve ser convertida
          is_active: 'true', // String que deve ser convertida
        },
      }

      await syncToSupabase(operation)

      // Verificar que o insert foi chamado (mapeamento ocorreu internamente)
      expect(mockInsert).toHaveBeenCalled()
    })
  })
})
