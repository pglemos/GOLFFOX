import { GET } from '@/app/api/admin/emergency/available-vehicles/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestVehicle } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('GET /api/admin/emergency/available-vehicles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve listar veículos disponíveis', async () => {
    const vehicles = [
      createTestVehicle('transportadora-1', { plate: 'ABC1234', is_active: true }),
      createTestVehicle('transportadora-1', { plate: 'XYZ5678', is_active: true }),
    ]
    mockSupabaseClient.setTableData('vehicles', vehicles)
    mockSupabaseClient.setTableData('trips', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.vehicles)).toBe(true)
    expect(data.vehicles.length).toBeGreaterThanOrEqual(2)
  })

  it('deve filtrar veículos ocupados', async () => {
    const availableVehicle = createTestVehicle('transportadora-1', { plate: 'ABC1234', is_active: true })
    const occupiedVehicle = createTestVehicle('transportadora-1', { plate: 'XYZ5678', is_active: true })
    
    mockSupabaseClient.setTableData('vehicles', [availableVehicle, occupiedVehicle])
    mockSupabaseClient.setTableData('trips', [
      { id: 'trip-1', veiculo_id: occupiedVehicle.id, status: 'inProgress' },
    ])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Veículo ocupado não deve aparecer na lista
    const occupiedInList = data.vehicles.find((v: any) => v.id === occupiedVehicle.id)
    expect(occupiedInList).toBeUndefined()
  })

  it('deve retornar array vazio se não houver veículos', async () => {
    mockSupabaseClient.setTableData('vehicles', [])
    mockSupabaseClient.setTableData('trips', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.vehicles).toEqual([])
  })

  it('deve lidar com erro na busca', async () => {
    mockSupabaseClient.setTableError('vehicles', {
      message: 'Database error',
    })

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Erro ao buscar veículos disponíveis')
  })
})

