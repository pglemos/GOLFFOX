/**
 * Mock do NextAuth para testes
 */

export const getServerSession = jest.fn(async () => ({
  user: {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 3600 * 1000).toISOString(),
}))

export const getSession = jest.fn(async () => ({
  user: {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 3600 * 1000).toISOString(),
}))

export default {
  getServerSession,
  getSession,
}

