import { GET } from '@/app/api/admin/users-list/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestUser } from '../../../helpers/test-data'
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

describe('GET /api/admin/users-list', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve listar todos os usuários', async () => {
    const users = [
      createTestUser({ email: 'user1@test.com' }),
      createTestUser({ email: 'user2@test.com' }),
    ]
    mockSupabaseClient.setTableData('users', users)

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.users)).toBe(true)
    expect(data.users.length).toBeGreaterThanOrEqual(2)
  })

  it('deve filtrar por role', async () => {
    const adminUser = createTestUser({ role: 'admin' })
    const operatorUser = createTestUser({ role: 'operador' })
    mockSupabaseClient.setTableData('users', [adminUser, operatorUser])

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/users-list?role=admin',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve filtrar por status', async () => {
    const activeUser = createTestUser({ is_active: true })
    const inactiveUser = createTestUser({ is_active: false })
    mockSupabaseClient.setTableData('users', [activeUser, inactiveUser])

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/users-list?status=active',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve filtrar por company_id', async () => {
    const companyId = 'company-1'
    const user = createTestUser({ company_id: companyId })
    mockSupabaseClient.setTableData('users', [user])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/admin/users-list?company_id=${companyId}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve retornar array vazio se não houver usuários', async () => {
    mockSupabaseClient.setTableData('users', [])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.users).toEqual([])
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
    expect(data.error).toBe('Erro ao buscar usuários')
  })
})

