import { DELETE, POST } from '@/app/api/admin/users/delete/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestUser } from '../../../helpers/test-data'
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

describe('DELETE /api/admin/users/delete', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NODE_ENV = 'test'
  })

  it('deve excluir usuário por query param', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('trips', [])

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/users/delete?id=${user.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Usuário excluído com sucesso')
  })

  it('deve excluir usuário por body', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('trips', [])

    const req = createAdminRequest({
      method: 'POST',
      body: { id: user.id },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve rejeitar sem ID do usuário', async () => {
    const req = createAdminRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/users/delete',
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('ID do usuário é obrigatório')
  })

  it('deve atualizar trips antes de excluir motorista', async () => {
    const user = createTestUser({ role: 'driver' })
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('trips', [
      { id: 'trip-1', driver_id: user.id },
    ])

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/users/delete?id=${user.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve lidar com erro ao excluir', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableError('users', {
      message: 'Database error',
      code: 'PGRST116',
    })

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/users/delete?id=${user.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erro ao excluir usuário')
  })
})

