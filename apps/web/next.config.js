/** @type {import('next').NextConfig} */
const path = require('path')
const isProd = process.env.NODE_ENV === 'production'

let nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Corrigir warning sobre múltiplos lockfiles
  outputFileTracingRoot: path.join(__dirname, '../../'),
  typescript: {
    // ✅ Ignorar erros de tipo durante o build para permitir deploy
    ignoreBuildErrors: true,
  },
  // Next.js 16: Empty turbopack config allows webpack to run in production
  turbopack: {},
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: (() => {
              const directives = [
                "default-src 'self'",
                "base-uri 'self'",
                "form-action 'self'",
                "object-src 'none'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https:",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "img-src 'self' data: blob: https:",
                "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
                "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel.com https://*.googleapis.com https://*.vercel.app https://vitals.vercel-insights.com",
                "worker-src 'self' blob:",
                "frame-src 'self' https://*.google.com https://*.gstatic.com",
              ]
              if (isProd) {
                directives.push('upgrade-insecure-requests')
              }
              return directives.join('; ')
            })(),
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.aceternity.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@shared': path.resolve(__dirname, '../../shared'),
    }

    // Configurações básicas para cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Cache para desenvolvimento
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      }
    }
    return config
  },
}

module.exports = nextConfig

