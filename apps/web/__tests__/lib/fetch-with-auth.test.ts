import { getAuthToken, fetchWithAuth } from '@/lib/fetch-with-auth'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}))

global.fetch = jest.fn()

describe('lib/fetch-with-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAuthToken', () => {
    it('deve retornar token de sessão válida', async () => {
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getSession.mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
          },
        },
        error: null,
      })

      const token = await getAuthToken()

      expect(token).toBe('mock-access-token')
    })

    it('deve retornar null se não houver sessão', async () => {
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })

      const token = await getAuthToken()

      expect(token).toBeNull()
    })

    it('deve retornar null em caso de erro', async () => {
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Error' },
      })

      const token = await getAuthToken()

      expect(token).toBeNull()
    })
  })

  describe('fetchWithAuth', () => {
    it('deve incluir token no header Authorization', async () => {
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getSession.mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'mock-token',
          },
        },
        error: null,
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await fetchWithAuth('/api/test')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      )
    })

    it('deve fazer requisição sem token se não houver sessão', async () => {
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await fetchWithAuth('/api/test')

      expect(global.fetch).toHaveBeenCalled()
    })

    it('deve incluir Content-Type para requisições com body', async () => {
      const { supabase } = require('@/lib/supabase')
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await fetchWithAuth('/api/test', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })
  })
})

