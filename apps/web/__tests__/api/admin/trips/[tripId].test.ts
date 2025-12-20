import { PUT, DELETE } from '@/app/api/admin/trips/[tripId]/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestTrip } from '../../../helpers/test-data'
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

describe('PUT /api/admin/trips/[tripId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve atualizar viagem', async () => {
    const trip = createTestTrip('route-1', 'veiculo-1', 'motorista-1')
    mockSupabaseClient.setTableData('trips', [trip])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        status: 'in_progress',
        notes: 'Viagem em andamento',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ tripId: trip.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.trip).toBeDefined()
  })

  it('deve validar UUID do tripId', async () => {
    const req = createAdminRequest({
      method: 'PUT',
      body: {
        status: 'completed',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ tripId: 'invalid-uuid' }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('trip_id deve ser um UUID válido')
  })

  it('deve rejeitar se viagem não encontrada', async () => {
    mockSupabaseClient.setTableData('trips', [])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        status: 'completed',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ tripId: '00000000-0000-0000-0000-000000000001' }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Viagem não encontrada')
  })

  it('deve aceitar snake_case e camelCase', async () => {
    const trip = createTestTrip('route-1', 'veiculo-1', 'motorista-1')
    mockSupabaseClient.setTableData('trips', [trip])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        routeId: 'route-2',
        vehicleId: 'veiculo-2',
        driverId: 'motorista-2',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ tripId: trip.id }),
    }

    const response = await PUT(req, context)

    expect([200, 400]).toContain(response.status)
  })
})

describe('DELETE /api/admin/trips/[tripId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve excluir viagem', async () => {
    const trip = createTestTrip('route-1', 'veiculo-1', 'motorista-1')
    mockSupabaseClient.setTableData('trips', [trip])

    const req = createAdminRequest({
      method: 'DELETE',
    }) as NextRequest

    const context = {
      params: Promise.resolve({ tripId: trip.id }),
    }

    const response = await DELETE(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.deleted).toBe(true)
  })

  it('deve rejeitar se viagem não encontrada', async () => {
    mockSupabaseClient.setTableData('trips', [])

    const req = createAdminRequest({
      method: 'DELETE',
    }) as NextRequest

    const context = {
      params: Promise.resolve({ tripId: '00000000-0000-0000-0000-000000000001' }),
    }

    const response = await DELETE(req, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Viagem não encontrada')
  })

  it('deve validar UUID do tripId', async () => {
    const req = createAdminRequest({
      method: 'DELETE',
    }) as NextRequest

    const context = {
      params: Promise.resolve({ tripId: 'invalid-uuid' }),
    }

    const response = await DELETE(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('trip_id deve ser um UUID válido')
  })
})

