import { POST } from '@/app/api/admin/emergency/dispatch/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestRoute, createTestVehicle, createTestUser } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('POST /api/admin/emergency/dispatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve despachar veículo e motorista para emergência', async () => {
    const route = createTestRoute()
    const veiculo = createTestVehicle('transportadora-1')
    const motorista = createTestUser({ role: 'motorista' })
    
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('vehicles', [veiculo])
    mockSupabaseClient.setTableData('users', [motorista])
    mockSupabaseClient.setTableData('gf_assistance_requests', [])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        routeId: route.id,
        driverId: motorista.id,
        vehicleId: veiculo.id,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve validar dados obrigatórios', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        routeId: 'route-1',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Rota, motorista e veículo são obrigatórios')
  })

  it('deve rejeitar se rota não encontrada', async () => {
    mockSupabaseClient.setTableData('routes', [])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        routeId: 'non-existent',
        driverId: 'motorista-1',
        vehicleId: 'veiculo-1',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Rota não encontrada')
  })

  it('deve atualizar solicitação existente', async () => {
    const route = createTestRoute()
    const veiculo = createTestVehicle('transportadora-1')
    const motorista = createTestUser({ role: 'motorista' })
    
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('vehicles', [veiculo])
    mockSupabaseClient.setTableData('users', [motorista])
    mockSupabaseClient.setTableData('gf_assistance_requests', [
      {
        id: 'request-1',
        route_id: route.id,
        status: 'open',
      },
    ])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        routeId: route.id,
        driverId: motorista.id,
        vehicleId: veiculo.id,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

