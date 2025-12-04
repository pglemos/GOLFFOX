/**
 * Testes para Audit Log
 */

import { logAudit, auditLogs, sanitizeDetails } from '@/lib/audit-log'
import { supabase } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}))

describe('Audit Log', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    return () => {
      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    }
  })

  describe('logAudit', () => {
    it('deve registrar log de auditoria com sucesso', async () => {
      const mockSession = {
        user: { id: 'user-1' },
      }
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await logAudit({
        action: 'create',
        resourceType: 'vehicle',
        resourceId: 'vehicle-1',
        details: { plate: 'ABC1234' },
      })

      expect(supabase.auth.getSession).toHaveBeenCalled()
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: 'user-1',
          action_type: 'create',
          resource_type: 'vehicle',
          resource_id: 'vehicle-1',
        })
      )
    })

    it('deve buscar companyId do usuário quando não fornecido', async () => {
      const mockSession = {
        user: { id: 'user-1' },
      }
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { company_id: 'company-1' },
            error: null,
          }),
        }),
      })
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      })
      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: mockSelect,
          }
        }
        return {
          insert: mockInsert,
        }
      })

      await logAudit({
        action: 'create',
        resourceType: 'vehicle',
        resourceId: 'vehicle-1',
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 'company-1',
        })
      )
    })

    it('deve usar companyId fornecido quando disponível', async () => {
      const mockSession = {
        user: { id: 'user-1' },
      }
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await logAudit({
        action: 'create',
        resourceType: 'vehicle',
        resourceId: 'vehicle-1',
        companyId: 'company-2',
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 'company-2',
        })
      )
    })

    it('deve sanitizar CPF dos detalhes', async () => {
      const mockSession = {
        user: { id: 'user-1' },
      }
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await logAudit({
        action: 'create',
        resourceType: 'driver',
        resourceId: 'driver-1',
        details: {
          name: 'João',
          cpf: '12345678900',
          email: 'joao@test.com',
        },
      })

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.not.objectContaining({
            cpf: expect.anything(),
          }),
        })
      )
    })

    it('deve sanitizar endereço completo dos detalhes', async () => {
      const mockSession = {
        user: { id: 'user-1' },
      }
      const mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await logAudit({
        action: 'create',
        resourceType: 'driver',
        resourceId: 'driver-1',
        details: {
          name: 'João',
          address: 'Rua Teste, 123, Bairro, Cidade',
          city: 'Belo Horizonte',
          state: 'MG',
        },
      })

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.details).not.toHaveProperty('address')
      expect(insertCall.details).not.toHaveProperty('street')
      expect(insertCall.details).not.toHaveProperty('number')
      expect(insertCall.details).toHaveProperty('city')
      expect(insertCall.details).toHaveProperty('state')
    })

    it('deve retornar early quando não há sessão', async () => {
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      })

      await logAudit({
        action: 'create',
        resourceType: 'vehicle',
        resourceId: 'vehicle-1',
      })

      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('deve lidar com erros sem quebrar o fluxo', async () => {
      const mockSession = {
        user: { id: 'user-1' },
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockRejectedValue(new Error('Database error')),
      })

      // Não deve lançar exceção
      await expect(
        logAudit({
          action: 'create',
          resourceType: 'vehicle',
          resourceId: 'vehicle-1',
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('auditLogs helpers', () => {
    beforeEach(() => {
      const mockSession = {
        user: { id: 'user-1' },
      }
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })
    })

    it('deve criar log de criação', async () => {
      await auditLogs.create('vehicle', 'vehicle-1', { plate: 'ABC1234' })

      const insertCall = (supabase.from as jest.Mock).mock.results[0].value.insert.mock.calls[0][0]
      expect(insertCall.action_type).toBe('create')
      expect(insertCall.resource_type).toBe('vehicle')
      expect(insertCall.resource_id).toBe('vehicle-1')
    })

    it('deve criar log de atualização', async () => {
      await auditLogs.update('vehicle', 'vehicle-1', { plate: 'XYZ5678' })

      const insertCall = (supabase.from as jest.Mock).mock.results[0].value.insert.mock.calls[0][0]
      expect(insertCall.action_type).toBe('update')
    })

    it('deve criar log de deleção', async () => {
      await auditLogs.delete('vehicle', 'vehicle-1')

      const insertCall = (supabase.from as jest.Mock).mock.results[0].value.insert.mock.calls[0][0]
      expect(insertCall.action_type).toBe('delete')
    })

    it('deve criar log de aprovação', async () => {
      await auditLogs.approve('invoice', 'invoice-1')

      const insertCall = (supabase.from as jest.Mock).mock.results[0].value.insert.mock.calls[0][0]
      expect(insertCall.action_type).toBe('approve')
    })

    it('deve criar log de rejeição', async () => {
      await auditLogs.reject('invoice', 'invoice-1', { reason: 'Invalid data' })

      const insertCall = (supabase.from as jest.Mock).mock.results[0].value.insert.mock.calls[0][0]
      expect(insertCall.action_type).toBe('reject')
    })

    it('deve criar log de resolução', async () => {
      await auditLogs.resolve('alert', 'alert-1')

      const insertCall = (supabase.from as jest.Mock).mock.results[0].value.insert.mock.calls[0][0]
      expect(insertCall.action_type).toBe('resolve')
    })
  })
})

