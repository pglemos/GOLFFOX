import { GET } from '@/app/api/health/route'
import { createMockRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
}))

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve retornar ok quando Supabase configurado e funcionando', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    mockSupabaseClient.setTableData('companies', [{ id: 'company-1' }])

    const req = createMockRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.ok).toBe(true)
    expect(data.supabase).toBe('ok')
    expect(data.timestamp).toBeDefined()
  })

  it('deve retornar unconfigured quando Supabase não configurado', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const req = createMockRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.supabase).toBe('unconfigured')
  })

  it('deve retornar error quando Supabase falha', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    // Mock para simular erro
    const originalFrom = mockSupabaseClient.from
    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection error' },
        }),
      })),
    })) as any

    const req = createMockRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.status).toBe('error')
    expect(data.ok).toBe(false)
    expect(data.supabase).toBe('error')

    // Restore
    mockSupabaseClient.from = originalFrom
  })

  it('deve lidar com exceções inesperadas', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    // Mock para causar exceção
    jest.spyOn(require('@supabase/supabase-js'), 'createClient').mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    const req = createMockRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.status).toBe('error')
    expect(data.error).toBeDefined()
  })
})

