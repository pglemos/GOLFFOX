import { PUT } from '@/app/api/admin/transportadoras/update/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestTransportadora } from '../../../helpers/test-data'
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

describe('PUT /api/admin/transportadoras/update', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve atualizar transportadora com dados válidos', async () => {
    const transportadora = createTestTransportadora()
    mockSupabaseClient.setTableData('carriers', [transportadora])

    const req = createAdminRequest({
      method: 'PUT',
      url: `http://localhost:3000/api/admin/transportadoras/update?id=${transportadora.id}`,
      body: {
        name: 'Transportadora Atualizada',
        email: 'novo@email.com',
      },
    }) as NextRequest

    const response = await PUT(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.transportadora.name).toBe('Transportadora Atualizada')
  })

  it('deve rejeitar sem ID', async () => {
    const req = createAdminRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/admin/transportadoras/update',
      body: { name: 'Teste' },
    }) as NextRequest

    const response = await PUT(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('ID da transportadora não fornecido')
  })

  it('deve validar schema Zod', async () => {
    const transportadora = createTestTransportadora()
    mockSupabaseClient.setTableData('carriers', [transportadora])

    const req = createAdminRequest({
      method: 'PUT',
      url: `http://localhost:3000/api/admin/transportadoras/update?id=${transportadora.id}`,
      body: {
        name: '', // Nome vazio
      },
    }) as NextRequest

    const response = await PUT(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Dados inválidos')
  })

  it('deve lidar com erro do banco', async () => {
    const transportadora = createTestTransportadora()
    mockSupabaseClient.setTableData('carriers', [])
    // Simular erro configurando dados vazios e deixando o mock retornar erro

    const req = createAdminRequest({
      method: 'PUT',
      url: `http://localhost:3000/api/admin/transportadoras/update?id=${transportadora.id}`,
      body: { name: 'Teste' },
    }) as NextRequest

    // Como o mock não encontra o registro, deve retornar erro
    const response = await PUT(req)
    const data = await response.json()

    // Pode retornar 500 ou 404 dependendo da implementação
    expect([400, 404, 500]).toContain(response.status)
  })
})

