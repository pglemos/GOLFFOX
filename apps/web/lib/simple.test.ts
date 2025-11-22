import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock NextRequest
vi.mock('next/server', () => {
    return {
        NextRequest: class {
            cookies: any
            headers: any
            nextUrl: any
            constructor(url: string, init?: any) {
                this.cookies = {
                    get: vi.fn(),
                    getAll: vi.fn().mockReturnValue([]),
                }
                this.headers = {
                    get: vi.fn((key) => init?.headers?.[key]),
                }
                this.nextUrl = new URL(url)
            }
        },
        NextResponse: {
            json: vi.fn((body, init) => ({ body, status: init?.status || 200 })),
        },
    }
})

describe('Simple Test', () => {
    it('should pass', () => {
        expect(true).toBe(true)
    })
})
