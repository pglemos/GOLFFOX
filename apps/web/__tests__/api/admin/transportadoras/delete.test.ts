import { DELETE } from '@/app/api/admin/transportadoras/delete/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestTransportadora, createTestUser, createTestVehicle } from '../../../helpers/test-data'

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

describe('DELETE /api/admin/transportadoras/delete', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve deletar transportadora e limpar referências', async () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ transportadora_id: transportadora.id })
    const veiculo = createTestVehicle(transportadora.id)

    mockSupabaseClient.setTableData('carriers', [transportadora])
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('veiculos', [veiculo])
    mockSupabaseClient.setTableData('routes', [])

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/transportadoras/delete?id=${transportadora.id}`,
    })

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve rejeitar sem ID', async () => {
    const req = createAdminRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/transportadoras/delete',
    })

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('ID da transportadora não fornecido')
  })

  it('deve retornar 404 se transportadora não encontrada', async () => {
    const req = createAdminRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/transportadoras/delete?id=00000000-0000-0000-0000-000000000000',
    })

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Transportadora não encontrada')
  })
})

