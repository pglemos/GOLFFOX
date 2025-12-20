import { POST } from '@/app/api/admin/drivers/route'
import { createAdminRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestDriver, createTestTransportadora } from '../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

describe('POST /api/admin/drivers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve criar motorista com dados válidos', async () => {
    const transportadora = createTestTransportadora()
    mockSupabaseClient.setTableData('carriers', [transportadora])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        name: 'Motorista Teste',
        email: 'motorista@test.com',
        phone: '+5511999999999',
        transportadora_id: transportadora.id,
        cpf: '12345678900',
        cnh: '12345678901',
        cnh_category: 'D',
        is_active: true,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.motorista.name).toBe('Motorista Teste')
  })

  it('deve validar nome obrigatório', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        transportadora_id: 'transportadora-1',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Nome é obrigatório')
  })

  it('deve validar transportadora obrigatória', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        name: 'Motorista Teste',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Transportadora é obrigatória')
  })

  it('deve aceitar transportadora_id como alternativa a transportadora_id', async () => {
    const transportadora = createTestTransportadora()
    mockSupabaseClient.setTableData('carriers', [transportadora])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        name: 'Motorista Teste',
        transportadora_id: transportadora.id, // Usando transportadora_id em vez de transportadora_id
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

