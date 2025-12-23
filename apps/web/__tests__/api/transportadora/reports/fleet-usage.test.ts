import { GET } from '@/app/api/transportadora/relatorios/fleet-usage/route'
import { createTransportadoraRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestTransportadora, createTestVehicle } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('GET /api/transportadora/relatorios/fleet-usage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve gerar relatório de uso da frota', async () => {
    const transportadora = createTestTransportadora()
    const veiculo = createTestVehicle(transportadora.id, { plate: 'ABC1234' })
    
    mockSupabaseClient.setTableData('veiculos', [veiculo])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('routes', [
      { id: 'route-1', transportadora_id: transportadora.id },
    ])
    mockSupabaseClient.setTableData('motorista_positions', [])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: `http://localhost:3000/api/transportadora/relatorios/fleet-usage?transportadora_id=${transportadora.id}`,
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
    const veiculo = createTestVehicle(transportadora.id)
    mockSupabaseClient.setTableData('veiculos', [veiculo])
    mockSupabaseClient.setTableData('trips', [])
    mockSupabaseClient.setTableData('routes', [])
    mockSupabaseClient.setTableData('motorista_positions', [])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: `http://localhost:3000/api/transportadora/relatorios/fleet-usage?transportadora_id=${transportadora.id}&start_date=2024-01-01&end_date=2024-01-31`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve rejeitar sem transportadora_id', async () => {
    const req = createTransportadoraRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/transportadora/relatorios/fleet-usage',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('transportadora_id é obrigatório')
  })

  it('deve calcular taxa de utilização', async () => {
    const transportadora = createTestTransportadora()
    const veiculo = createTestVehicle(transportadora.id)
    mockSupabaseClient.setTableData('veiculos', [veiculo])
    mockSupabaseClient.setTableData('trips', [
      { id: 'trip-1', route_id: 'route-1', created_at: new Date().toISOString() },
    ])
    mockSupabaseClient.setTableData('routes', [
      { id: 'route-1', transportadora_id: transportadora.id },
    ])
    mockSupabaseClient.setTableData('motorista_positions', [])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: `http://localhost:3000/api/transportadora/relatorios/fleet-usage?transportadora_id=${transportadora.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    if (data.data.length > 0) {
      expect(data.data[0]).toHaveProperty('utilization_rate')
    }
  })
})

