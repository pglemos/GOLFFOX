import { POST } from '@/app/api/admin/alerts/update/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
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

jest.mock('@/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(async () => null),
}))

describe('POST /api/admin/alerts/update', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve atualizar alerta', async () => {
    const alert = {
      id: '00000000-0000-0000-0000-000000000001',
      status: 'open',
    }
    mockSupabaseClient.setTableData('gf_incidents', [alert])
    mockSupabaseClient.setTableData('gf_audit_log', [])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        id: alert.id,
        status: 'resolved',
        description: 'Alerta resolvido',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.alert).toBeDefined()
  })

  it('deve validar dados obrigatórios', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        status: 'resolved',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Dados inválidos')
  })

  it('deve validar status válido', async () => {
    const alert = {
      id: '00000000-0000-0000-0000-000000000001',
    }
    mockSupabaseClient.setTableData('gf_incidents', [alert])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        id: alert.id,
        status: 'invalid-status',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('deve registrar log de auditoria', async () => {
    const alert = {
      id: '00000000-0000-0000-0000-000000000001',
      status: 'open',
    }
    mockSupabaseClient.setTableData('gf_incidents', [alert])
    mockSupabaseClient.setTableData('gf_audit_log', [])

    const req = createAdminRequest({
      method: 'POST',
      headers: {
        'user-email': 'admin@test.com',
        'user-id': 'admin-user-id',
      },
      body: {
        id: alert.id,
        status: 'resolved',
      },
    }) as NextRequest

    const response = await POST(req)

    expect(response.status).toBe(200)
  })
})

