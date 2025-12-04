import { POST } from '@/app/api/operador/optimize-route/route'
import { createOperatorRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

global.fetch = jest.fn()

describe('POST /api/operador/optimize-route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-google-maps-key'
  })

  it('deve retornar sucesso vazio se route_id não fornecido', async () => {
    const req = createOperatorRequest({
      method: 'POST',
      body: {},
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.optimized_order).toEqual([])
    expect(data.message).toBe('route_id não fornecido')
  })

  it('deve retornar sucesso vazio se points não fornecido', async () => {
    const req = createOperatorRequest({
      method: 'POST',
      body: {
        route_id: 'route-1',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.optimized_order).toEqual([])
    expect(data.message).toBe('Nenhum ponto fornecido para otimizar')
  })

  it('deve retornar ponto único se apenas um ponto fornecido', async () => {
    const req = createOperatorRequest({
      method: 'POST',
      body: {
        route_id: 'route-1',
        points: [
          {
            id: 'point-1',
            latitude: -19.9167,
            longitude: -43.9345,
          },
        ],
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.optimized_order).toHaveLength(1)
    expect(data.optimized_order[0].sequence).toBe(1)
  })

  it('deve rejeitar se Supabase não configurado', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const req = createOperatorRequest({
      method: 'POST',
      body: {
        route_id: 'route-1',
        points: [
          { id: 'point-1', latitude: -19.9167, longitude: -43.9345 },
          { id: 'point-2', latitude: -19.9267, longitude: -43.9445 },
        ],
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Configuração do servidor incompleta')
  })

  it('deve rejeitar se Google Maps API key não configurada', async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    const req = createOperatorRequest({
      method: 'POST',
      body: {
        route_id: 'route-1',
        points: [
          { id: 'point-1', latitude: -19.9167, longitude: -43.9345 },
        ],
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Google Maps API key não configurada')
  })
})

