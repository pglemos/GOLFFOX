// Jest globals: describe, it, expect

describe('Env Vars', () => {
    it('should have env vars defined', () => {
        console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    })
})
