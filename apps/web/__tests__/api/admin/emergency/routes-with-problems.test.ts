import { GET } from '@/app/api/admin/emergency/routes-with-problems/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestRoute, createTestVehicle, createTestUser } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('GET /api/admin/emergency/routes-with-problems', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve listar rotas com problemas', async () => {
    const route = createTestRoute()
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('gf_incidents', [
      {
        id: 'incident-1',
        route_id: route.id,
        severity: 'critical',
        status: 'open',
      },
    ])
    mockSupabaseClient.setTableData('gf_assistance_requests', [])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('veiculos', [])
    mockSupabaseClient.setTableData('users', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.routes)).toBe(true)
  })

  it('deve incluir informações de veículo e motorista', async () => {
    const route = createTestRoute()
    const veiculo = createTestVehicle('transportadora-1')
    const motorista = createTestUser({ role: 'motorista' })
    
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('gf_incidents', [
      {
        id: 'incident-1',
        route_id: route.id,
        severity: 'high',
        status: 'open',
      },
    ])
    mockSupabaseClient.setTableData('gf_assistance_requests', [])
    mockSupabaseClient.setTableData('trips', [
      {
        id: 'trip-1',
        route_id: route.id,
        veiculo_id: veiculo.id,
        motorista_id: motorista.id,
        status: 'inProgress',
      },
    ])
    mockSupabaseClient.setTableData('veiculos', [veiculo])
    mockSupabaseClient.setTableData('users', [motorista])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    if (data.routes.length > 0) {
      expect(data.routes[0].veiculo).toBeDefined()
      expect(data.routes[0].motorista).toBeDefined()
    }
  })

  it('deve filtrar apenas rotas com incidentes críticos ou altos', async () => {
    const route1 = createTestRoute({ name: 'Rota Crítica' })
    const route2 = createTestRoute({ name: 'Rota Normal' })
    
    mockSupabaseClient.setTableData('routes', [route1, route2])
    mockSupabaseClient.setTableData('gf_incidents', [
      {
        id: 'incident-1',
        route_id: route1.id,
        severity: 'critical',
        status: 'open',
      },
    ])
    mockSupabaseClient.setTableData('gf_assistance_requests', [])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('veiculos', [])
    mockSupabaseClient.setTableData('users', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Apenas rota com incidente crítico deve aparecer
    const normalRoute = data.routes.find((r: any) => r.id === route2.id)
    expect(normalRoute).toBeUndefined()
  })

  it('deve incluir rotas com solicitações de socorro abertas', async () => {
    const route = createTestRoute()
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('gf_incidents', [])
    mockSupabaseClient.setTableData('gf_assistance_requests', [
      {
        id: 'request-1',
        route_id: route.id,
        status: 'open',
      },
    ])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('veiculos', [])
    mockSupabaseClient.setTableData('users', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.routes.length).toBeGreaterThan(0)
  })

  it('deve retornar array vazio se não houver rotas com problemas', async () => {
    const route = createTestRoute()
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('gf_incidents', [])
    mockSupabaseClient.setTableData('gf_assistance_requests', [])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('veiculos', [])
    mockSupabaseClient.setTableData('users', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.routes).toEqual([])
  })
})

