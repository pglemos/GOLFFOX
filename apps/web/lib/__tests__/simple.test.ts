import { NextRequest } from 'next/server'

// Mock NextRequest
jest.mock('next/server', () => {
    return {
        NextRequest: class {
            cookies: any
            headers: any
            nextUrl: any
            constructor(url: string, init?: any) {
                this.cookies = {
                    get: jest.fn(),
                    getAll: jest.fn().mockReturnValue([]),
                }
                this.headers = {
                    get: jest.fn((key) => init?.headers?.[key]),
                }
                this.nextUrl = new URL(url)
            }
        },
        NextResponse: {
            json: jest.fn((body, init) => ({ body, status: init?.status || 200 })),
        },
    }
})

describe('Simple Test', () => {
    it('should pass', () => {
        expect(true).toBe(true)
    })
})
