import { vi } from 'vitest'

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        data: { id: 'mock-id' },
        error: null,
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: {},
          error: null,
        })),
      })),
    })),
    auth: {
      getSession: vi.fn(() => ({
        data: {
          session: {
            user: { id: 'mock-user-id', email: 'test@example.com' },
          },
        },
        error: null,
      })),
    },
  },
}))

