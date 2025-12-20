import { GET } from '@/app/api/transportadora/reports/motorista-performance/route'
import { createTransportadoraRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestTransportadora, createTestUser } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('GET /api/transportadora/reports/motorista-performance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve gerar relatório de performance de motoristas', async () => {
    const transportadora = createTestTransportadora()
    const motorista = createTestUser({ role: 'motorista', transportadora_id: transportadora.id })
    
    mockSupabaseClient.setTableData('users', [motorista])
    mockSupabaseClient.setTableData('gf_gamification_scores', [
      {
        driver_id: motorista.id,
        trips_completed: 10,
        total_points: 500,
        average_rating: 4.5,
        on_time_percentage: 95,
        safety_score: 90,
      },
    ])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('routes', [
      { id: 'route-1', transportadora_id: transportadora.id },
    ])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: `http://localhost:3000/api/transportadora/reports/motorista-performance?transportadora_id=${transportadora.id}`,
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
    mockSupabaseClient.setTableData('users', [])
    mockSupabaseClient.setTableData('gf_gamification_scores', [])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('routes', [])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: `http://localhost:3000/api/transportadora/reports/motorista-performance?transportadora_id=${transportadora.id}&start_date=2024-01-01&end_date=2024-01-31`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve rejeitar sem transportadora_id', async () => {
    const req = createTransportadoraRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/transportadora/reports/motorista-performance',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('transportadora_id é obrigatório')
  })

  it('deve aceitar carrier_id como alternativa', async () => {
    const transportadora = createTestTransportadora()
    mockSupabaseClient.setTableData('users', [])
    mockSupabaseClient.setTableData('gf_gamification_scores', [])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('routes', [])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: `http://localhost:3000/api/transportadora/reports/motorista-performance?carrier_id=${transportadora.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

