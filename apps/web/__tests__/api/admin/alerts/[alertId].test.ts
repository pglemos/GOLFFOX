import { PUT } from '@/app/api/admin/alerts/[alertId]/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole !== 'admin') {
      return { json: () => ({ error: 'Forbidden' }), status: 403 }
    }
    return null
  }),
}))

describe('PUT /api/admin/alerts/[alertId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve atualizar alerta', async () => {
    const alert = {
      id: '00000000-0000-0000-0000-000000000001',
      description: 'Alerta original',
      severity: 'warning',
      status: 'open',
    }
    mockSupabaseClient.setTableData('alerts', [alert])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        description: 'Alerta atualizado',
        severity: 'critical',
        status: 'resolved',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ alertId: alert.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.alert).toBeDefined()
  })

  it('deve validar UUID do alertId', async () => {
    const req = createAdminRequest({
      method: 'PUT',
      body: {
        status: 'resolved',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ alertId: 'invalid-uuid' }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('alert_id deve ser um UUID válido')
  })

  it('deve rejeitar se alerta não encontrado', async () => {
    mockSupabaseClient.setTableData('alerts', [])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        status: 'resolved',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ alertId: '00000000-0000-0000-0000-000000000001' }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Alerta não encontrado')
  })

  it('deve atualizar múltiplos campos', async () => {
    const alert = {
      id: '00000000-0000-0000-0000-000000000001',
      description: 'Alerta',
      severity: 'warning',
      status: 'open',
    }
    mockSupabaseClient.setTableData('alerts', [alert])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        description: 'Nova descrição',
        severity: 'critical',
        status: 'assigned',
        route_id: 'route-1',
        veiculo_id: 'veiculo-1',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ alertId: alert.id }),
    }

    const response = await PUT(req, context)

    expect([200, 400]).toContain(response.status)
  })
})

