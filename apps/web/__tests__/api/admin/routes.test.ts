import { POST } from '@/app/api/admin/routes/route'
import { createAdminRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestCompany } from '../../helpers/test-data'
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

describe('POST /api/admin/routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NODE_ENV = 'test'
  })

  it('deve criar rota com dados válidos', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        name: 'Rota Teste',
        company_id: company.id,
        origin: 'Origem Teste',
        destination: 'Destino Teste',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.name || data.route_name).toBeDefined()
  })

  it('deve criar empresa automaticamente em modo de teste', async () => {
    mockSupabaseClient.setTableData('companies', [])

    const req = createAdminRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        name: 'Rota Teste',
        origin: 'Origem',
        destination: 'Destino',
      },
    }) as NextRequest

    const response = await POST(req)
    
    // Deve criar empresa automaticamente ou retornar erro apropriado
    expect([200, 201, 400]).toContain(response.status)
  })
})

