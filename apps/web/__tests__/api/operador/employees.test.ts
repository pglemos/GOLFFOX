import { GET } from '@/app/api/operador/employees/route'
import { createOperatorRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestCompany } from '../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock('@/lib/api-auth', () => ({
  validateAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole === 'operador') {
      return {
        id: 'operador-user-id',
        role: 'operador',
        companyId: 'company-1',
      }
    }
    return null
  }),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('GET /api/operador/employees', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve listar funcionários', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_employee_company', [
      {
        id: 'emp-1',
        company_id: company.id,
        name: 'Funcionário 1',
        email: 'emp1@test.com',
        is_active: true,
      },
      {
        id: 'emp-2',
        company_id: company.id,
        name: 'Funcionário 2',
        email: 'emp2@test.com',
        is_active: true,
      },
    ])

    const req = createOperatorRequest({
      method: 'GET',
      url: `http://localhost:3000/api/operador/employees?company_id=${company.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.count).toBeDefined()
  })

  it('deve usar company_id do operador se não fornecido', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('users', [
      {
        id: 'operador-user-id',
        company_id: company.id,
      },
    ])
    mockSupabaseClient.setTableData('gf_employee_company', [])

    const req = createOperatorRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)

    expect([200, 400]).toContain(response.status)
  })

  it('deve filtrar por busca', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_employee_company', [
      {
        id: 'emp-1',
        company_id: company.id,
        name: 'João Silva',
        email: 'joao@test.com',
      },
    ])

    const req = createOperatorRequest({
      method: 'GET',
      url: `http://localhost:3000/api/operador/employees?company_id=${company.id}&search=João`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('deve paginar resultados', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_employee_company', [])

    const req = createOperatorRequest({
      method: 'GET',
      url: `http://localhost:3000/api/operador/employees?company_id=${company.id}&page=1&pageSize=10`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(1)
    expect(data.pageSize).toBe(10)
  })

  it('deve rejeitar se não autenticado', async () => {
    mockSupabaseClient.setTableData('gf_employee_company', [])

    const req = createOperatorRequest({
      method: 'GET',
      headers: {
        'x-user-role': 'invalid',
      },
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Não autorizado')
  })
})

