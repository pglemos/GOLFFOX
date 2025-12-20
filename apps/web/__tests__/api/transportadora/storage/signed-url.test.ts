import { POST } from '@/app/api/transportadora/storage/signed-url/route'
import { createTransportadoraRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestUser, createTestTransportadora, createTestVehicle } from '../../../helpers/test-data'
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

describe('POST /api/transportadora/storage/signed-url', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve gerar URL assinada para documento de motorista', async () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora.id })
    const motorista = createTestUser({ role: 'motorista', transportadora_id: transportadora.id })
    
    mockSupabaseClient.setTableData('users', [user, motorista])
    mockSupabaseClient.storage = {
      from: jest.fn(() => ({
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: 'https://signed-url.com/file.pdf' },
          error: null,
        }),
      })),
    }

    const req = createTransportadoraRequest({
      method: 'POST',
      body: {
        file_path: `motorista-documents/${motorista.id}/document.pdf`,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.signed_url).toBeDefined()
  })

  it('deve gerar URL assinada para documento de veículo', async () => {
    const transportadora = createTestTransportadora()
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora.id })
    const veiculo = createTestVehicle(transportadora.id)
    
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableData('vehicles', [veiculo])
    mockSupabaseClient.storage = {
      from: jest.fn(() => ({
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: 'https://signed-url.com/file.pdf' },
          error: null,
        }),
      })),
    }

    const req = createTransportadoraRequest({
      method: 'POST',
      body: {
        file_path: `veiculo-documents/${veiculo.id}/document.pdf`,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.signed_url).toBeDefined()
  })

  it('deve validar file_path obrigatório', async () => {
    const req = createTransportadoraRequest({
      method: 'POST',
      body: {},
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Caminho do arquivo não fornecido')
  })

  it('deve rejeitar acesso a documento de outra transportadora', async () => {
    const transportadora1 = createTestTransportadora()
    const transportadora2 = createTestTransportadora({ id: 'other-transportadora' })
    const user = createTestUser({ role: 'transportadora', transportadora_id: transportadora1.id })
    const motorista = createTestUser({ role: 'motorista', transportadora_id: transportadora2.id })
    
    mockSupabaseClient.setTableData('users', [user, motorista])

    const req = createTransportadoraRequest({
      method: 'POST',
      body: {
        file_path: `motorista-documents/${motorista.id}/document.pdf`,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Acesso negado')
  })
})

