import { GET, POST } from '@/app/api/admin/vehicles/route'
import { createAdminRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestVehicle, createTestCompany } from '../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
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

describe('GET /api/admin/vehicles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve listar veículos', async () => {
    const vehicles = [
      createTestVehicle('transportadora-1', { plate: 'ABC1234' }),
      createTestVehicle('transportadora-1', { plate: 'XYZ5678' }),
    ]
    mockSupabaseClient.setTableData('vehicles', vehicles)

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(2)
  })

  it('deve retornar array vazio se não houver veículos', async () => {
    mockSupabaseClient.setTableData('vehicles', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })
})

describe('POST /api/admin/vehicles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NODE_ENV = 'test'
  })

  it('deve criar veículo com dados válidos', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        plate: 'ABC1234',
        model: 'Modelo Teste',
        brand: 'Marca Teste',
        year: 2020,
        capacity: 50,
        company_id: company.id,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.plate).toBe('ABC1234')
    expect(data.model).toBe('Modelo Teste')
  })

  it('deve validar placa obrigatória', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        model: 'Modelo Teste',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Dados inválidos')
  })

  it('deve validar modelo obrigatório', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        plate: 'ABC1234',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Dados inválidos')
  })
})

