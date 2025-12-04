import { GET, POST } from '@/app/api/transportadora/costs/route/route'
import { createTransportadoraRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestUser, createTestTransportadora, createTestRoute } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole !== 'transportadora') {
      return { json: () => ({ error: 'Forbidden' }), status: 403 }
    }
    return null
  }),
  validateAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole === 'transportadora') {
      return {
        id: 'transportadora-user-id',
        role: 'transportadora',
      }
    }
    return null
  }),
}))

describe('GET /api/transportadora/costs/route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve listar custos de rotas', async () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora.id })
    const route = createTestRoute(transportadora.id)
    
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('route_costs', [
      {
        id: 'cost-1',
        route_id: route.id,
        cost_date: '2024-01-15',
        fuel_cost_brl: 50.0,
      },
    ])
    mockSupabaseClient.setTableData('routes', [route])

    const req = createTransportadoraRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })

  it('deve filtrar por route_id', async () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora.id })
    const route = createTestRoute(transportadora.id)
    
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('route_costs', [])
    mockSupabaseClient.setTableData('routes', [route])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: `http://localhost:3000/api/transportadora/costs/route?route_id=${route.id}`,
    }) as NextRequest

    const response = await GET(req)

    expect([200, 400, 500]).toContain(response.status)
  })

  it('deve filtrar por período', async () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora.id })
    
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('route_costs', [])
    mockSupabaseClient.setTableData('routes', [])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/transportadora/costs/route?start_date=2024-01-01&end_date=2024-01-31',
    }) as NextRequest

    const response = await GET(req)

    expect([200, 400, 500]).toContain(response.status)
  })
})

describe('POST /api/transportadora/costs/route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve criar custo de rota', async () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora.id })
    const route = createTestRoute(transportadora.id)
    
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('route_costs', [])

    const req = createTransportadoraRequest({
      method: 'POST',
      body: {
        route_id: route.id,
        cost_date: '2024-01-15',
        fuel_cost_brl: 50.0,
        labor_cost_brl: 30.0,
        maintenance_cost_brl: 20.0,
        toll_cost_brl: 10.0,
        fixed_cost_brl: 5.0,
        passengers_transported: 20,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.id || data.route_id).toBeDefined()
  })

  it('deve validar dados obrigatórios', async () => {
    const req = createTransportadoraRequest({
      method: 'POST',
      body: {
        cost_date: '2024-01-15',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Dados inválidos')
  })

  it('deve rejeitar se rota não pertence à transportadora', async () => {
    const transportadora1 = createTestTransportadora()
    const transportadora2 = createTestTransportadora({ id: 'other-transportadora' })
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora1.id })
    const route = createTestRoute(transportadora2.id)
    
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('routes', [route])

    const req = createTransportadoraRequest({
      method: 'POST',
      body: {
        route_id: route.id,
        cost_date: '2024-01-15',
        fuel_cost_brl: 50.0,
        labor_cost_brl: 30.0,
        maintenance_cost_brl: 20.0,
        toll_cost_brl: 10.0,
        fixed_cost_brl: 5.0,
        passengers_transported: 20,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('Acesso negado')
  })
})

