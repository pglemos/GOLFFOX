import { POST } from '@/app/api/operador/associate-company/route'
import { createOperatorRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestCompany } from '../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('POST /api/operador/associate-company', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve associar operador a empresa', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_user_company_map', [])
    mockSupabaseClient.setAuthUsers([
      {
        id: 'operator-user-id',
        email: 'operator@test.com',
      },
    ])

    const req = createOperatorRequest({
      method: 'POST',
      body: {
        email: 'operator@test.com',
        companyId: company.id,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve validar email obrigatório', async () => {
    const req = createOperatorRequest({
      method: 'POST',
      body: {
        companyId: 'company-1',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email é obrigatório')
  })

  it('deve usar primeira empresa disponível se companyId não fornecido', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_user_company_map', [])
    mockSupabaseClient.setAuthUsers([
      {
        id: 'operator-user-id',
        email: 'operator@test.com',
      },
    ])

    const req = createOperatorRequest({
      method: 'POST',
      body: {
        email: 'operator@test.com',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve retornar sucesso se já associado', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_user_company_map', [
      {
        user_id: 'operator-user-id',
        company_id: company.id,
      },
    ])
    mockSupabaseClient.setAuthUsers([
      {
        id: 'operator-user-id',
        email: 'operator@test.com',
      },
    ])

    const req = createOperatorRequest({
      method: 'POST',
      body: {
        email: 'operator@test.com',
        companyId: company.id,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('já está associado')
  })

  it('deve rejeitar se usuário não encontrado', async () => {
    mockSupabaseClient.setAuthUsers([])

    const req = createOperatorRequest({
      method: 'POST',
      body: {
        email: 'nonexistent@test.com',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Usuário não encontrado')
  })

  it('deve rejeitar se empresa não encontrada', async () => {
    mockSupabaseClient.setTableData('companies', [])
    mockSupabaseClient.setAuthUsers([
      {
        id: 'operator-user-id',
        email: 'operator@test.com',
      },
    ])

    const req = createOperatorRequest({
      method: 'POST',
      body: {
        email: 'operator@test.com',
        companyId: 'non-existent',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Empresa não encontrada ou inativa')
  })
})

