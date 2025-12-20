import { GET } from '@/app/api/admin/kpis/route'
import { createAdminRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'

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

jest.mock('@/lib/cache/redis-cache.service', () => ({
  redisCacheService: {
    get: jest.fn(async () => null),
    set: jest.fn(async () => {}),
  },
  createCacheKey: jest.fn((...args) => args.join(':')),
}))

jest.mock('@/lib/logger', () => ({
  logError: jest.fn(),
  warn: jest.fn(),
}))

describe('GET /api/admin/kpis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve retornar KPIs do cache se disponível', async () => {
    const { redisCacheService } = require('@/lib/cache/redis-cache.service')
    const cachedKPIs = {
      success: true,
      kpis: [{ metric: 'total_trips', value: 100 }],
    }
    redisCacheService.get.mockResolvedValue(cachedKPIs)

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/kpis',
    })

    const response = await GET(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toEqual(cachedKPIs)
    expect(mockSupabaseClient.from).not.toHaveBeenCalled()
  })

  it('deve buscar KPIs do banco se cache não estiver disponível', async () => {
    const { redisCacheService } = require('@/lib/cache/redis-cache.service')
    redisCacheService.get.mockResolvedValue(null)

    const mockKPIs = [
      { metric: 'total_trips', value: 100 },
      { metric: 'active_vehicles', value: 50 },
    ]

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: mockKPIs,
        error: null,
      }),
    })

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/kpis',
    })

    const response = await GET(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.kpis).toEqual(mockKPIs)
    expect(redisCacheService.set).toHaveBeenCalled()
  })

  it('deve tentar múltiplas views se primeira falhar', async () => {
    const { redisCacheService } = require('@/lib/cache/redis-cache.service')
    redisCacheService.get.mockResolvedValue(null)

    const mockKPIs = [{ metric: 'total_trips', value: 100 }]

    // Primeira view não existe (PGRST205)
    mockSupabaseClient.from
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST205' },
        }),
      })
      // Segunda view retorna dados
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: mockKPIs,
          error: null,
        }),
      })

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/kpis',
    })

    const response = await GET(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.kpis).toEqual(mockKPIs)
  })

  it('deve retornar array vazio se nenhuma view estiver disponível', async () => {
    const { redisCacheService } = require('@/lib/cache/redis-cache.service')
    redisCacheService.get.mockResolvedValue(null)

    // Todas as views falham
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST205' },
      }),
    })

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/kpis',
    })

    const response = await GET(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.kpis).toEqual([])
  })

  it('deve retornar 403 se usuário não for admin', async () => {
    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/kpis',
      headers: { 'x-user-role': 'empresa' },
    })

    const response = await GET(req)

    expect(response.status).toBe(403)
  })

  it('deve retornar 500 se houver erro', async () => {
    const { redisCacheService } = require('@/lib/cache/redis-cache.service')
    redisCacheService.get.mockRejectedValue(new Error('Cache error'))

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/kpis',
    })

    const response = await GET(req)

    expect(response.status).toBe(500)
  })
})
