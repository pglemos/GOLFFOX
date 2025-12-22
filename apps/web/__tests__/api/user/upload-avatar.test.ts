import { POST } from '@/app/api/user/upload-avatar/route'
import { createAuthenticatedRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('POST /api/user/upload-avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve fazer upload de avatar', async () => {
    const file = new File(['test image'], 'avatar.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', 'user-1')

    mockSupabaseClient.storage = {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'avatares/user-1-1234567890.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/avatares/user-1-1234567890.jpg' },
        }),
      })),
    }
    mockSupabaseClient.setTableData('users', [
      {
        id: 'user-1',
        email: 'user@test.com',
      },
    ])

    const req = createAuthenticatedRequest(
      {
        id: 'user-1',
        email: 'user@test.com',
        role: 'admin',
      },
      {
        method: 'POST',
        body: formData,
      }
    ) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.success).toBe(true)
    expect(data.avatarUrl || data.url).toBeDefined()
  })

  it('deve validar arquivo obrigatório', async () => {
    const formData = new FormData()
    formData.append('userId', 'user-1')

    const req = createAuthenticatedRequest(
      {
        id: 'user-1',
        email: 'user@test.com',
        role: 'admin',
      },
      {
        method: 'POST',
        body: formData,
      }
    ) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('obrigatórios')
  })

  it('deve validar tipo de arquivo', async () => {
    const file = new File(['test'], 'document.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', 'user-1')

    const req = createAuthenticatedRequest(
      {
        id: 'user-1',
        email: 'user@test.com',
        role: 'admin',
      },
      {
        method: 'POST',
        body: formData,
      }
    ) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Apenas imagens')
  })

  it('deve validar tamanho máximo', async () => {
    const largeContent = 'x'.repeat(6 * 1024 * 1024) // 6MB
    const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', 'user-1')

    const req = createAuthenticatedRequest(
      {
        id: 'user-1',
        email: 'user@test.com',
        role: 'admin',
      },
      {
        method: 'POST',
        body: formData,
      }
    ) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('5MB')
  })
})

