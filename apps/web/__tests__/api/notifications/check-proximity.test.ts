import { POST } from '@/app/api/notifications/check-proximity/route'
import { createAdminRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestRoute } from '../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock('@/lib/notifications/proximity-service', () => ({
  checkProximity: jest.fn(async () => ({
    nearby: true,
    distance: 100,
  })),
  findNearestStop: jest.fn(async () => ({
    id: 'stop-1',
    distance: 100,
  })),
  shouldNotify: jest.fn(() => true),
}))

jest.mock('@/lib/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}))

describe('POST /api/notifications/check-proximity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-google-maps-key'
  })

  it('deve verificar proximidade de ônibus', async () => {
    const route = createTestRoute()
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('route_stops', [
      {
        id: 'stop-1',
        route_id: route.id,
        latitude: -19.9167,
        longitude: -43.9345,
        seq: 1,
        name: 'Parada 1',
      },
    ])
    mockSupabaseClient.setTableData('trip_events', [])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        tripId: 'trip-1',
        routeId: route.id,
        vehicleId: 'veiculo-1',
        busLat: -19.9167,
        busLng: -43.9345,
        thresholdMeters: 500,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('nearby')
  })

  it('deve validar dados obrigatórios', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        tripId: 'trip-1',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Dados inválidos')
  })

  it('deve rejeitar se Google Maps API key não configurada', async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    const req = createAdminRequest({
      method: 'POST',
      body: {
        tripId: 'trip-1',
        routeId: 'route-1',
        vehicleId: 'veiculo-1',
        busLat: -19.9167,
        busLng: -43.9345,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Google Maps API key não configurada')
  })

  it('deve retornar false se não houver paradas', async () => {
    const route = createTestRoute()
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('route_stops', [])
    mockSupabaseClient.setTableData('trip_events', [])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        tripId: 'trip-1',
        routeId: route.id,
        vehicleId: 'veiculo-1',
        busLat: -19.9167,
        busLng: -43.9345,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.nearby).toBe(false)
  })
})

