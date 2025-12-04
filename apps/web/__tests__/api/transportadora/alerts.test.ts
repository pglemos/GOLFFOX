import { GET } from '@/app/api/transportadora/alerts/route'
import { createTransportadoraRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestUser, createTestTransportadora } from '../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole !== 'transportadora') {
      return { json: () => ({ error: 'Forbidden' }), status: 403 }
    }
    return null
  }),
  validateAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole === 'transportadora') {
      return {
        id: 'transportadora-user-id',
        role: 'transportadora',
      }
    }
    return null
  }),
}))

describe('GET /api/transportadora/alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve listar alertas da transportadora', async () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora.id })
    
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('v_carrier_expiring_documents', [
      {
        transportadora_id: transportadora.id,
        alert_level: 'critical',
        days_to_expiry: 5,
      },
    ])

    const req = createTransportadoraRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.alerts)).toBe(true)
    expect(data.stats).toBeDefined()
  })

  it('deve filtrar por nível de alerta', async () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora.id })
    
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('v_carrier_expiring_documents', [
      {
        transportadora_id: transportadora.id,
        alert_level: 'critical',
        days_to_expiry: 5,
      },
      {
        transportadora_id: transportadora.id,
        alert_level: 'warning',
        days_to_expiry: 15,
      },
    ])

    const req = createTransportadoraRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/transportadora/alerts?alert_level=critical',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.alerts)).toBe(true)
  })

  it('deve rejeitar se usuário não associado a transportadora', async () => {
    const user = createTestUser({ role: 'transportadora', transportadora_id: null })
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('v_carrier_expiring_documents', [])

    const req = createTransportadoraRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Usuário não está associado a uma transportadora')
  })

  it('deve retornar estatísticas', async () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora.id })
    
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('v_carrier_expiring_documents', [
      {
        transportadora_id: transportadora.id,
        alert_level: 'critical',
        days_to_expiry: 5,
      },
      {
        transportadora_id: transportadora.id,
        alert_level: 'warning',
        days_to_expiry: 15,
      },
    ])

    const req = createTransportadoraRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats).toHaveProperty('total')
    expect(data.stats).toHaveProperty('critical')
    expect(data.stats).toHaveProperty('warning')
  })
})

