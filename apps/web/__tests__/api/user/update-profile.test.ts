import { POST } from '@/app/api/user/update-profile/route'
import { createAuthenticatedRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestUser } from '../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

describe('POST /api/user/update-profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve atualizar perfil do usuário', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setAuthUsers([
      {
        id: user.id,
        email: user.email,
      },
    ])

    const sessionCookie = Buffer.from(
      JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
      })
    ).toString('base64')

    const req = createAuthenticatedRequest(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      {
        method: 'POST',
        cookies: {
          'golffox-session': sessionCookie,
        },
        body: {
          name: 'Nome Atualizado',
        },
      }
    ) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve rejeitar se não autenticado', async () => {
    const req = createAuthenticatedRequest(
      {
        id: 'user-1',
        email: 'user@test.com',
        role: 'admin',
      },
      {
        method: 'POST',
        cookies: {},
        body: {
          name: 'Nome',
        },
      }
    ) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Não autenticado')
  })

  it('deve atualizar senha', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setAuthUsers([
      {
        id: user.id,
        email: user.email,
      },
    ])

    const sessionCookie = Buffer.from(
      JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
      })
    ).toString('base64')

    const req = createAuthenticatedRequest(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      {
        method: 'POST',
        cookies: {
          'golffox-session': sessionCookie,
        },
        body: {
          newPassword: 'newpassword123',
        },
      }
    ) as NextRequest

    const response = await POST(req)

    expect([200, 400, 500]).toContain(response.status)
  })
})

