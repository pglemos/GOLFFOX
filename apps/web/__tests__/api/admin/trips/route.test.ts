import { GET, POST } from '@/app/api/admin/trips/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestTrip, createTestRoute, createTestCompany } from '../../../helpers/test-data'
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

describe('GET /api/admin/trips', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve listar viagens', async () => {
    const trips = [
      createTestTrip('route-1', 'veiculo-1', 'motorista-1'),
      createTestTrip('route-2', 'veiculo-2', 'motorista-2'),
    ]
    mockSupabaseClient.setTableData('trips', trips)

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('deve filtrar por veiculo_id', async () => {
    const trip = createTestTrip('route-1', 'veiculo-1', 'motorista-1')
    mockSupabaseClient.setTableData('trips', [trip])

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/trips?veiculo_id=veiculo-1',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
  })

  it('deve filtrar por route_id', async () => {
    const trip = createTestTrip('route-1', 'veiculo-1', 'motorista-1')
    mockSupabaseClient.setTableData('trips', [trip])

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/trips?route_id=route-1',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
  })

  it('deve filtrar por status', async () => {
    const trip = createTestTrip('route-1', 'veiculo-1', 'motorista-1', { status: 'completed' })
    mockSupabaseClient.setTableData('trips', [trip])

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/trips?status=completed',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
  })

  it('deve filtrar por data', async () => {
    const trip = createTestTrip('route-1', 'veiculo-1', 'motorista-1')
    mockSupabaseClient.setTableData('trips', [trip])

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/trips?start_date=2024-01-01&end_date=2024-01-31',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
  })
})

describe('POST /api/admin/trips', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NODE_ENV = 'test'
  })

  it('deve criar viagem', async () => {
    const route = createTestRoute()
    const company = createTestCompany()
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('companies', [company])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        route_id: route.id,
        veiculo_id: 'veiculo-1',
        motorista_id: 'motorista-1',
        scheduled_date: '2024-01-15',
        status: 'scheduled',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.id || data.data?.id).toBeDefined()
  })

  it('deve validar route_id obrigatório', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        veiculo_id: 'veiculo-1',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })
})

