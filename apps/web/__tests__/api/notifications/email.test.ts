import { POST } from '@/app/api/notifications/email/route'
import { createAdminRequest, createTransportadoraRequest } from '../../helpers/api-test-helpers'
import { NextRequest } from 'next/server'

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole === 'admin' || userRole === 'transportadora') {
      return null
    }
    return { json: () => ({ error: 'Forbidden' }), status: 403 }
  }),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('POST /api/notifications/email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve enviar email', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        to: ['test@example.com'],
        subject: 'Teste',
        body: 'Corpo do email',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Email enviado com sucesso')
  })

  it('deve validar dados obrigatórios', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        to: ['test@example.com'],
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Dados incompletos')
  })

  it('deve aceitar transportadora', async () => {
    const req = createTransportadoraRequest('transportadora-1', {
      method: 'POST',
      body: {
        to: ['test@example.com'],
        subject: 'Teste',
        body: 'Corpo do email',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

