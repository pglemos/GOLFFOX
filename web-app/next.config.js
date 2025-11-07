/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  typescript: {
    // ✅ Type-safety habilitado após correção de erros
    ignoreBuildErrors: false,
  },
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
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob: https:",
                "font-src 'self' data:",
                "connect-src 'self' https://*.supabase.co https://*.vercel.com https://*.googleapis.com https://*.vercel.app https://vitals.vercel-insights.com",
                "worker-src 'self' blob:",
                "frame-src 'self' https://*.google.com https://*.gstatic.com",
              ]
              // Evitar forçar HTTPS em ambiente de desenvolvimento (localhost)
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
  eslint: {
    // ✅ Linting habilitado (warnings não bloqueiam build)
    ignoreDuringBuilds: false,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  async redirects() {
    return [
      {
        source: '/operador',
        destination: '/operator',
        permanent: true,
      },
      {
        source: '/operador/:path*',
        destination: '/operator/:path*',
        permanent: true,
      },
    ]
  },
  // Configuração para Google Maps
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    }
    return config
  },
}

module.exports = nextConfig
