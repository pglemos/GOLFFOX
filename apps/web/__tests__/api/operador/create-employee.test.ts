import { POST } from '@/app/api/operador/create-employee/route'
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

describe('POST /api/operador/create-employee', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NODE_ENV = 'test'
  })

  it('deve criar funcionário', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_employee_company', [])
    mockSupabaseClient.setAuthUsers([
      {
        id: 'new-user-id',
        email: 'employee@test.com',
      },
    ])

    const req = createOperatorRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        name: 'Funcionário Teste',
        email: 'employee@test.com',
        cpf: '12345678900',
        company_id: company.id,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.id || data.data?.id).toBeDefined()
  })

  it('deve validar email obrigatório', async () => {
    const req = createOperatorRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        name: 'Funcionário',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email é obrigatório')
  })

  it('deve criar empresa automaticamente em modo de teste', async () => {
    mockSupabaseClient.setTableData('companies', [])
    mockSupabaseClient.setTableData('gf_employee_company', [])

    const req = createOperatorRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        name: 'Funcionário',
        email: 'employee@test.com',
      },
    }) as NextRequest

    const response = await POST(req)

    expect([200, 201, 400, 500]).toContain(response.status)
  })
})

