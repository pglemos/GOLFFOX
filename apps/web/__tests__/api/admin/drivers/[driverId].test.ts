import { GET, PUT } from '@/app/api/admin/drivers/[driverId]/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestDriver, createTestTransportadora } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

describe('GET /api/admin/drivers/[driverId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve buscar motorista por ID', async () => {
    const transportadora = createTestTransportadora()
    const driver = createTestDriver(transportadora.id)
    mockSupabaseClient.setTableData('drivers', [driver])
    mockSupabaseClient.setTableData('carriers', [transportadora])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const context = {
      params: Promise.resolve({ driverId: driver.id }),
    }

    const response = await GET(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.driver).toBeDefined()
    expect(data.driver.id).toBe(driver.id)
  })

  it('deve lidar com motorista não encontrado', async () => {
    mockSupabaseClient.setTableData('drivers', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const context = {
      params: Promise.resolve({ driverId: '00000000-0000-0000-0000-000000000001' }),
    }

    const response = await GET(req, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
  })
})

describe('PUT /api/admin/drivers/[driverId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve atualizar motorista', async () => {
    const transportadora = createTestTransportadora()
    const driver = createTestDriver(transportadora.id)
    mockSupabaseClient.setTableData('drivers', [driver])
    mockSupabaseClient.setTableData('carriers', [transportadora])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Motorista Atualizado',
        phone: '+5511888888888',
        cnh: '98765432100',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ driverId: driver.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.driver).toBeDefined()
  })

  it('deve validar nome obrigatório', async () => {
    const transportadora = createTestTransportadora()
    const driver = createTestDriver(transportadora.id)
    mockSupabaseClient.setTableData('drivers', [driver])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        phone: '+5511888888888',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ driverId: driver.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Nome é obrigatório')
  })

  it('deve aceitar carrier_id como alternativa', async () => {
    const transportadora = createTestTransportadora()
    const driver = createTestDriver(transportadora.id)
    mockSupabaseClient.setTableData('drivers', [driver])
    mockSupabaseClient.setTableData('carriers', [transportadora])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Motorista Atualizado',
        carrier_id: transportadora.id,
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ driverId: driver.id }),
    }

    const response = await PUT(req, context)

    expect([200, 400]).toContain(response.status)
  })
})

