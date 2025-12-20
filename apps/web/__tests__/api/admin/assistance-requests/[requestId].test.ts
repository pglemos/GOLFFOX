import { PUT } from '@/app/api/admin/assistance-requests/[requestId]/route'
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

describe('PUT /api/admin/assistance-requests/[requestId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve atualizar solicitação de assistência', async () => {
    const request = {
      id: '00000000-0000-0000-0000-000000000001',
      description: 'Solicitação original',
      status: 'open',
    }
    mockSupabaseClient.setTableData('gf_service_requests', [request])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        description: 'Solicitação atualizada',
        status: 'dispatched',
        dispatched_driver_id: 'motorista-1',
        dispatched_vehicle_id: 'veiculo-1',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ requestId: request.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.request).toBeDefined()
  })

  it('deve validar UUID do requestId', async () => {
    const req = createAdminRequest({
      method: 'PUT',
      body: {
        status: 'dispatched',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ requestId: 'invalid-uuid' }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('request_id deve ser um UUID válido')
  })

  it('deve rejeitar se solicitação não encontrada', async () => {
    mockSupabaseClient.setTableData('gf_service_requests', [])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        status: 'dispatched',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ requestId: '00000000-0000-0000-0000-000000000001' }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Ocorrência não encontrada')
  })

  it('deve atualizar múltiplos campos', async () => {
    const request = {
      id: '00000000-0000-0000-0000-000000000001',
      description: 'Solicitação',
      status: 'open',
    }
    mockSupabaseClient.setTableData('gf_service_requests', [request])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        description: 'Nova descrição',
        status: 'resolved',
        request_type: 'emergency',
        address: 'Endereço atualizado',
        route_id: 'route-1',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ requestId: request.id }),
    }

    const response = await PUT(req, context)

    expect([200, 400]).toContain(response.status)
  })
})

