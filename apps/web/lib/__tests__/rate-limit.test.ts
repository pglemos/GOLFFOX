import { applyRateLimit } from './rate-limit'
import { NextRequest } from 'next/server'

// Mock Redis and Ratelimit
const mockLimit = jest.fn()

jest.mock('@upstash/redis', () => ({
    Redis: class {
        constructor() { }
    }
}))

jest.mock('@upstash/ratelimit', () => ({
    Ratelimit: class {
        static slidingWindow() { return {} }
        constructor() {
            // @ts-expect-error Legacy: valid em ambiente sem tipagem
            this.limit = mockLimit
        }
        limit = mockLimit
    }
}))

// Mock NextRequest/Response
jest.mock('next/server', () => {
    return {
        NextRequest: class {
            cookies: any
            headers: any
            constructor(url: string) {
                this.cookies = { get: () => undefined }
                this.headers = { get: () => undefined }
            }
        },
        NextResponse: {
            json: jest.fn((body, init) => ({ body, status: init?.status || 200 })),
        },
    }
})

describe('rate-limit', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should allow request if limit not exceeded', async () => {
        mockLimit.mockResolvedValue({ success: true, limit: 10, reset: 0, remaining: 9 })

        const req = new NextRequest('http://localhost')
        const res = await applyRateLimit(req, 'api')

        expect(res).toBeNull()
    })

    it('should block request if limit exceeded', async () => {
        mockLimit.mockResolvedValue({ success: false, limit: 10, reset: Date.now() + 60000, remaining: 0 })

        const req = new NextRequest('http://localhost')
        const res = await applyRateLimit(req, 'api')

        expect(res).not.toBeNull()
        expect(res?.status).toBe(429)
    })
})

