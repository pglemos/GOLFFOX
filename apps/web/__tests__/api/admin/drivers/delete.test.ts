import { DELETE } from '@/app/api/admin/motoristas/delete/route'
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

describe('DELETE /api/admin/motoristas/delete', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NODE_ENV = 'test'
  })

  it('deve excluir motorista', async () => {
    const motorista = createTestUser({ role: 'motorista' })
    mockSupabaseClient.setTableData('users', [motorista])
    mockSupabaseClient.setTableData('trips', [])

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/motoristas/delete?id=${motorista.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Motorista excluído com sucesso')
  })

  it('deve atualizar trips antes de excluir', async () => {
    const motorista = createTestUser({ role: 'motorista' })
    mockSupabaseClient.setTableData('users', [motorista])
    mockSupabaseClient.setTableData('trips', [
      { id: 'trip-1', motorista_id: motorista.id },
    ])

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/motoristas/delete?id=${motorista.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve rejeitar sem ID do motorista', async () => {
    const req = createAdminRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/motoristas/delete',
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('ID do motorista é obrigatório')
  })

  it('deve lidar com erro ao excluir', async () => {
    const motorista = createTestUser({ role: 'motorista' })
    mockSupabaseClient.setTableError('users', {
      message: 'Database error',
    })

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/motoristas/delete?id=${motorista.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erro ao excluir motorista')
  })
})

