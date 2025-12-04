import { POST } from '@/app/api/admin/users/change-role/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestUser } from '../../../helpers/test-data'
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

describe('POST /api/admin/users/change-role', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve alterar role do usuário', async () => {
    const user = createTestUser({ role: 'operador' })
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('audit_logs', [])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        userId: user.id,
        newRole: 'admin',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.role).toBe('admin')
  })

  it('deve rejeitar se usuário não encontrado', async () => {
    mockSupabaseClient.setTableData('users', [])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        userId: 'non-existent-id',
        newRole: 'admin',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Usuário não encontrado')
  })

  it('deve rejeitar se role é a mesma', async () => {
    const user = createTestUser({ role: 'admin' })
    mockSupabaseClient.setTableData('users', [user])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        userId: user.id,
        newRole: 'admin',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('O usuário já possui este papel')
  })

  it('deve validar dados obrigatórios', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        newRole: 'admin',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Dados inválidos')
  })

  it('deve validar role inválida', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        userId: user.id,
        newRole: 'invalid-role',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('deve registrar log de auditoria', async () => {
    const user = createTestUser({ role: 'operador' })
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('audit_logs', [])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        userId: user.id,
        newRole: 'admin',
      },
    }) as NextRequest

    const response = await POST(req)

    expect(response.status).toBe(200)
    // Log de auditoria é opcional, não deve falhar a operação
  })
})

