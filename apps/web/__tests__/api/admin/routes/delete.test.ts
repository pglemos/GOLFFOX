import { DELETE } from '@/app/api/admin/rotas/delete/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestRoute } from '../../../helpers/test-data'
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

describe('DELETE /api/admin/rotas/delete', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NODE_ENV = 'test'
  })

  it('deve excluir rota sem viagens', async () => {
    const route = createTestRoute()
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('route_stops', [])
    mockSupabaseClient.setTableData('trip_summary', [])
    mockSupabaseClient.setTableData('motorista_positions', [])

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/rotas/delete?id=${route.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Rota excluída com sucesso')
  })

  it('deve excluir rota com viagens e dependências', async () => {
    const route = createTestRoute()
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('trips', [
      { id: 'trip-1', route_id: route.id },
    ])
    mockSupabaseClient.setTableData('route_stops', [])
    mockSupabaseClient.setTableData('trip_summary', [])
    mockSupabaseClient.setTableData('motorista_positions', [])
    mockSupabaseClient.setTableData('trip_events', [])
    mockSupabaseClient.setTableData('trip_passageiros', [])
    mockSupabaseClient.setTableData('checklists', [])
    mockSupabaseClient.setTableData('passenger_reports', [])
    mockSupabaseClient.setTableData('chat_messages', [])

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/rotas/delete?id=${route.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve rejeitar sem ID da rota', async () => {
    const req = createAdminRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/rotas/delete',
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('ID da rota é obrigatório')
  })

  it('deve lidar com erro ao excluir', async () => {
    const route = createTestRoute()
    mockSupabaseClient.setTableError('routes', {
      message: 'Database error',
    })

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/rotas/delete?id=${route.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erro ao excluir rota')
  })
})

