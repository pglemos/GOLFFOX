import { POST } from '@/app/api/transportadora/upload/route'
import { createTransportadoraRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
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
}))

describe('POST /api/transportadora/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  })

  it('deve fazer upload de arquivo', async () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'driver-documents')
    formData.append('driverId', 'driver-1')

    mockSupabaseClient.storage = {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'driver-documents/driver-1/test.pdf' },
          error: null,
        }),
      })),
    }

    const req = createTransportadoraRequest({
      method: 'POST',
      body: formData,
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.url || data.publicUrl).toBeDefined()
  })

  it('deve validar arquivo obrigatório', async () => {
    const formData = new FormData()
    formData.append('folder', 'driver-documents')

    const req = createTransportadoraRequest({
      method: 'POST',
      body: formData,
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Nenhum arquivo fornecido')
  })

  it('deve validar pasta obrigatória', async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)

    const req = createTransportadoraRequest({
      method: 'POST',
      body: formData,
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Pasta não especificada')
  })

  it('deve validar tipo de arquivo', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'driver-documents')
    formData.append('driverId', 'driver-1')

    const req = createTransportadoraRequest({
      method: 'POST',
      body: formData,
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Tipo de arquivo não permitido')
  })

  it('deve validar tamanho máximo', async () => {
    const largeContent = 'x'.repeat(11 * 1024 * 1024) // 11MB
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'driver-documents')
    formData.append('driverId', 'driver-1')

    const req = createTransportadoraRequest({
      method: 'POST',
      body: formData,
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Arquivo muito grande')
  })

  it('deve validar driverId para driver-documents', async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'driver-documents')

    const req = createTransportadoraRequest({
      method: 'POST',
      body: formData,
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('ID do motorista ou veículo não fornecido')
  })
})

