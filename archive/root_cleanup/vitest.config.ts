import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        alias: {
            '@': path.resolve(__dirname, './apps/web'),
        },
        env: {
            NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
            SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
            UPSTASH_REDIS_REST_URL: 'https://mock-redis.upstash.io',
            UPSTASH_REDIS_REST_TOKEN: 'mock-redis-token',
        },
    },
})
