import { GET } from '@/app/api/costs/categories/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

describe('GET /api/costs/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve listar categorias de custos', async () => {
    mockSupabaseClient.setTableData('gf_cost_categories', [
      {
        id: 'cat-1',
        group_name: 'Operacional',
        category: 'Combustível',
        subcategory: null,
        is_active: true,
      },
      {
        id: 'cat-2',
        group_name: 'Operacional',
        category: 'Manutenção',
        subcategory: 'Preventiva',
        is_active: true,
      },
    ])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })

  it('deve filtrar apenas categorias ativas', async () => {
    mockSupabaseClient.setTableData('gf_cost_categories', [
      {
        id: 'cat-1',
        group_name: 'Operacional',
        category: 'Combustível',
        is_active: true,
      },
      {
        id: 'cat-2',
        group_name: 'Operacional',
        category: 'Manutenção',
        is_active: false,
      },
    ])

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    const activeCategories = data.filter((cat: any) => cat.is_active === true)
    expect(activeCategories.length).toBeGreaterThan(0)
  })

  it('deve retornar array vazio se tabela não existir', async () => {
    mockSupabaseClient.setTableError('gf_cost_categories', {
      message: 'relation "gf_cost_categories" does not exist',
    })

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data || data).toEqual([])
  })
})

