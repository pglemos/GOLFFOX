import { DELETE, POST } from '@/app/api/admin/companies/delete/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestCompany } from '../../../helpers/test-data'
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

describe('DELETE /api/admin/companies/delete', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NODE_ENV = 'test'
  })

  it('deve excluir empresa por query param', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('users', [])
    mockSupabaseClient.setTableData('routes', [])
    mockSupabaseClient.setTableData('gf_employee_company', [])
    mockSupabaseClient.setTableData('gf_user_company_map', [])
    mockSupabaseClient.setTableData('gf_route_optimization_cache', [])
    mockSupabaseClient.setTableData('gf_report_schedules', [])
    mockSupabaseClient.setTableData('gf_costs', [])
    mockSupabaseClient.setTableData('gf_budgets', [])
    mockSupabaseClient.setTableData('gf_company_branding', [])
    mockSupabaseClient.setTableData('gf_service_requests', [])

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/companies/delete?id=${company.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Empresa excluída com sucesso')
  })

  it('deve excluir empresa por body', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('users', [])
    mockSupabaseClient.setTableData('routes', [])

    const req = createAdminRequest({
      method: 'POST',
      body: { id: company.id },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve atualizar users antes de excluir', async () => {
    const company = createTestCompany()
    const user = createTestUser({ company_id: company.id })
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('routes', [])

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/companies/delete?id=${company.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve rejeitar sem ID da empresa', async () => {
    const req = createAdminRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/companies/delete',
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('ID da empresa é obrigatório')
  })

  it('deve lidar com erro ao excluir', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableError('companies', {
      message: 'Database error',
    })

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/companies/delete?id=${company.id}`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erro ao excluir empresa')
  })
})

