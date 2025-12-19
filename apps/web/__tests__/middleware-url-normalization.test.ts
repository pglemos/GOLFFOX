jest.mock('next/server', () => {
  return {
    NextResponse: {
      redirect: (url: URL | string) => {
        const u = typeof url === 'string' ? new URL(url) : url
        const loc = u.toString()
        const headersStore: Record<string, string> = { location: loc, Location: loc }
        return {
          status: 307,
          headers: {
            get: (name: string) => headersStore[name] || null,
          },
        } as any
      },
      next: () => ({ status: 200, headers: { get: (_: string) => null } }) as any,
    },
  }
})

import proxy from '../proxy'

function makeReq(url: string) {
  const u = new URL(url)
  const headersStore: Record<string, string> = {
    host: u.host,
    'user-agent': 'jest-test',
    'x-forwarded-for': '127.0.0.1',
  }
  return {
    url,
    nextUrl: u,
    headers: {
      get: (name: string) => headersStore[name.toLowerCase()] || null,
    },
    cookies: {
      get: (_name: string) => undefined,
    },
  } as any
}

describe('proxy operator URL normalization', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    delete process.env.NEXT_PUBLIC_BASE_URL
  })

  test('redirects /operator?company=abc to /operator', async () => {
    const req = makeReq('http://localhost/operator?company=abc')
    const res = await proxy(req)
    expect(res.status).toBeGreaterThanOrEqual(300)
    const location = res.headers.get('location') || res.headers.get('Location')
    expect(location).toBe('http://localhost/operator')
  })

  test('preserves other params while removing company', async () => {
    const req = makeReq('http://localhost/operator/funcionarios?company=abc&foo=1')
    const res = await proxy(req)
    const location = res.headers.get('location') || res.headers.get('Location')
    expect(location).toBe('http://localhost/operator/funcionarios?foo=1')
  })

  test('without company param, no normalization redirect; auth may redirect', async () => {
    const req = makeReq('http://localhost/operator/funcionarios?search=joao')
    const res = await proxy(req)
    const location = res.headers.get('location') || ''
    expect(location.includes('/login?next=')).toBe(true)
  })
})
