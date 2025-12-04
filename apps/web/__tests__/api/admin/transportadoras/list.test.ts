import { GET } from '@/app/api/admin/transportadoras-list/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestTransportadora } from '../../../helpers/test-data'

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

describe('GET /api/admin/transportadoras-list', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve listar transportadoras', async () => {
    const transportadoras = [
      createTestTransportadora({ name: 'Transportadora 1' }),
      createTestTransportadora({ name: 'Transportadora 2' }),
    ]
    mockSupabaseClient.setTableData('carriers', transportadoras)

    const req = createAdminRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.carriers).toHaveLength(2)
  })

  it('deve retornar array vazio se não houver transportadoras', async () => {
    mockSupabaseClient.setTableData('carriers', [])

    const req = createAdminRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.carriers).toEqual([])
  })

  it('deve lidar com erro do banco', async () => {
    const originalFrom = mockSupabaseClient.from
    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })),
    })) as any

    const req = createAdminRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)

    mockSupabaseClient.from = originalFrom
  })
})

