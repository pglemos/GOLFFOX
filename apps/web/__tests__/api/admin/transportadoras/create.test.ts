import { POST } from '@/app/api/admin/transportadoras/create/route'
import { createAdminRequest, createOperatorRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestTransportadora } from '../../../helpers/test-data'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(async (req: any, role?: string | string[]) => {
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!userId || !userRole) {
      return {
        json: () => ({ error: 'Unauthorized' }),
        status: 401,
      }
    }
    
    if (role && !Array.isArray(role) && userRole !== role && role !== 'admin') {
      return {
        json: () => ({ error: 'Forbidden' }),
        status: 403,
      }
    }
    
    return null
  }),
}))

jest.mock('@/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(async () => null),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}))

describe('POST /api/admin/transportadoras/create', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve criar transportadora com dados válidos', async () => {
    const transportadoraData = {
      name: 'Transportadora Teste',
      cnpj: '12345678000190',
      email: 'teste@transportadora.com',
      phone: '+5511999999999',
      address: 'Rua Teste, 123',
    }

    const req = createAdminRequest({
      method: 'POST',
      body: transportadoraData,
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.transportadora).toMatchObject({
      name: transportadoraData.name,
      cnpj: transportadoraData.cnpj,
      email: transportadoraData.email,
    })
  })

  it('deve rejeitar sem autenticação admin', async () => {
    const req = createOperatorRequest('company-1', {
      method: 'POST',
      body: {
        name: 'Transportadora Teste',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('deve validar schema Zod - nome obrigatório', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        email: 'teste@transportadora.com',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Dados inválidos')
    expect(data.details).toBeDefined()
  })

  it('deve validar email quando fornecido', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        name: 'Transportadora Teste',
        email: 'email-invalido',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Dados inválidos')
  })

  it('deve aceitar email vazio como null', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        name: 'Transportadora Teste',
        email: '',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve lidar com erro do banco de dados', async () => {
    // Mock para simular erro do banco
    const originalFrom = mockSupabaseClient.from
    mockSupabaseClient.from = jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: '23505' },
          }),
        })),
      })),
    })) as any

    const req = createAdminRequest({
      method: 'POST',
      body: {
        name: 'Transportadora Teste',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Erro ao criar transportadora')

    // Restore
    mockSupabaseClient.from = originalFrom
  })

  it('deve aplicar rate limiting', async () => {
    const { applyRateLimit } = require('@/lib/rate-limit')
    
    const req = createAdminRequest({
      method: 'POST',
      body: {
        name: 'Transportadora Teste',
      },
    })

    await POST(req)

    expect(applyRateLimit).toHaveBeenCalledWith(req, 'sensitive')
  })
})

