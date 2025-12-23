import { GET } from '@/app/api/transportadora/relatorios/trips/route'
import { createTransportadoraRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestTransportadora, createTestRoute, createTestTrip } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('GET /api/transportadora/relatorios/trips', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve gerar relatório de viagens', async () => {
    const transportadora = createTestTransportadora()
    const route = createTestRoute(transportadora.id)
    const trip = createTestTrip(route.id, 'veiculo-1', 'motorista-1', { status: 'completed' })
    
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('trips', [trip])
    mockSupabaseClient.setTableData('users', [
      { id: 'motorista-1', name: 'Motorista Teste', email: 'motorista@test.com' },
    ])
    mockSupabaseClient.setTableData('trip_passageiros', [])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: `http://localhost:3000/api/transportadora/relatorios/trips?transportadora_id=${transportadora.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.summary).toBeDefined()
  })

  it('deve filtrar por período', async () => {
    const transportadora = createTestTransportadora()
    const route = createTestRoute(transportadora.id)
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('users', [])
    mockSupabaseClient.setTableData('trip_passageiros', [])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: `http://localhost:3000/api/transportadora/relatorios/trips?transportadora_id=${transportadora.id}&start_date=2024-01-01&end_date=2024-01-31`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve incluir contagem de passageiros', async () => {
    const transportadora = createTestTransportadora()
    const route = createTestRoute(transportadora.id)
    const trip = createTestTrip(route.id)
    
    mockSupabaseClient.setTableData('routes', [route])
    mockSupabaseClient.setTableData('trips', [trip])
    mockSupabaseClient.setTableData('users', [])
    mockSupabaseClient.setTableData('trip_passageiros', [
      { trip_id: trip.id },
      { trip_id: trip.id },
    ])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: `http://localhost:3000/api/transportadora/relatorios/trips?transportadora_id=${transportadora.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    if (data.data.length > 0) {
      expect(data.data[0]).toHaveProperty('passenger_count')
    }
  })

  it('deve rejeitar sem transportadora_id', async () => {
    const req = createTransportadoraRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/transportadora/relatorios/trips',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('transportadora_id é obrigatório')
  })
})

