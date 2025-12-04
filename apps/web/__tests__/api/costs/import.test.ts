import { POST } from '@/app/api/costs/import/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestCompany } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

jest.mock('@/lib/api-auth', () => ({
  requireCompanyAccess: jest.fn(async (req: any, companyId: string) => ({
    user: { id: 'user-1', role: 'admin', companyId },
    error: null,
  })),
}))

jest.mock('@/lib/costs/import-parser', () => ({
  parseCSV: jest.fn(async (text: string) => [
    {
      date: '2024-01-15',
      category: 'Combustível',
      amount: 1000,
    },
  ]),
}))

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
}))

describe('POST /api/costs/import', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve importar custos de arquivo CSV', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_cost_categories', [
      { id: 'cat-1', group_name: 'Operacional', category: 'Combustível', subcategory: null },
    ])
    mockSupabaseClient.setTableData('routes', [])
    mockSupabaseClient.setTableData('vehicles', [])
    mockSupabaseClient.setTableData('users', [])

    const formData = new FormData()
    const file = new File(['data,categoria,valor\n2024-01-15,Combustível,1000'], 'test.csv', {
      type: 'text/csv',
    })
    formData.append('file', file)
    formData.append('company_id', company.id)

    const req = createAdminRequest({
      method: 'POST',
      body: formData,
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.success).toBeDefined()
  })

  it('deve rejeitar sem arquivo', async () => {
    const formData = new FormData()
    formData.append('company_id', 'company-1')

    const req = createAdminRequest({
      method: 'POST',
      body: formData,
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Arquivo não fornecido')
  })

  it('deve rejeitar sem company_id', async () => {
    const formData = new FormData()
    const file = new File(['test'], 'test.csv')
    formData.append('file', file)

    const req = createAdminRequest({
      method: 'POST',
      body: formData,
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('company_id é obrigatório')
  })

  it('deve rejeitar formato não suportado', async () => {
    const formData = new FormData()
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    formData.append('file', file)
    formData.append('company_id', 'company-1')

    const req = createAdminRequest({
      method: 'POST',
      body: formData,
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Formato não suportado')
  })
})

