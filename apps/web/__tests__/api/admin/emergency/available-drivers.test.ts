import { GET } from '@/app/api/admin/emergency/available-drivers/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestUser } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('GET /api/admin/emergency/available-drivers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve listar motoristas disponíveis', async () => {
    const drivers = [
      createTestUser({ role: 'motorista', is_active: true, name: 'Motorista 1' }),
      createTestUser({ role: 'motorista', is_active: true, name: 'Motorista 2' }),
    ]
    mockSupabaseClient.setTableData('users', drivers)
    mockSupabaseClient.setTableData('trips', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.drivers)).toBe(true)
    expect(data.drivers.length).toBeGreaterThanOrEqual(2)
  })

  it('deve filtrar motoristas ocupados', async () => {
    const availableDriver = createTestUser({ role: 'motorista', is_active: true, name: 'Disponível' })
    const occupiedDriver = createTestUser({ role: 'motorista', is_active: true, name: 'Ocupado' })
    
    mockSupabaseClient.setTableData('users', [availableDriver, occupiedDriver])
    mockSupabaseClient.setTableData('trips', [
      { id: 'trip-1', motorista_id: occupiedDriver.id, status: 'inProgress' },
    ])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Motorista ocupado não deve aparecer na lista
    const occupiedInList = data.drivers.find((d: any) => d.id === occupiedDriver.id)
    expect(occupiedInList).toBeUndefined()
  })

  it('deve retornar apenas motoristas ativos', async () => {
    const activeDriver = createTestUser({ role: 'motorista', is_active: true })
    const inactiveDriver = createTestUser({ role: 'motorista', is_active: false })
    
    mockSupabaseClient.setTableData('users', [activeDriver, inactiveDriver])
    mockSupabaseClient.setTableData('trips', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Motorista inativo não deve aparecer
    const inactiveInList = data.drivers.find((d: any) => d.id === inactiveDriver.id)
    expect(inactiveInList).toBeUndefined()
  })

  it('deve lidar com erro na busca', async () => {
    mockSupabaseClient.setTableError('users', {
      message: 'Database error',
    })

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Erro ao buscar motoristas disponíveis')
  })
})

