/** @type {import('next').NextConfig} */
const path = require('path')
const isProd = process.env.NODE_ENV === 'production'

let nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Corrigir warning sobre múltiplos lockfiles
  outputFileTracingRoot: path.join(__dirname, '../../'),
  typescript: {
    // ✅ Tipos do Supabase regenerados e erros corrigidos
    // Erros restantes são apenas de componentes Recharts (não críticos)
    // ignoreBuildErrors removido - build agora valida tipos TypeScript
    ignoreBuildErrors: false,
  },
  // Next.js 16: Turbopack é o bundler padrão - otimizado para produção
  // Turbopack oferece performance superior com cache incremental
  // Configuração explícita do Turbopack para silenciar warning
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
                // Base: permitir apenas recursos do mesmo origin
                "default-src 'self'",
                "base-uri 'self'",
                "form-action 'self'",
                "object-src 'none'",
                
                // Scripts: 
                // - 'unsafe-inline' necessário para Next.js (injection de scripts HMR, _next/static)
                // - 'unsafe-eval' removido em produção (segurança XSS)
                // - 'wasm-unsafe-eval' necessário apenas se usar WebAssembly
                // - blob: necessário para workers e alguns recursos
                // - https: necessário para CDNs e APIs externas
                isProd
                  ? "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https:"
                  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https:",
                
                // Styles: 'unsafe-inline' necessário para estilos inline do Next.js e componentes
                // Google Fonts permitido para fontes externas
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
                
                // Images: permitir data URIs (avatars, icons) e blob (previews)
                "img-src 'self' data: blob: https:",
                
                // Fonts: Google Fonts e data URIs para ícones
                "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
                
                // Connect: APIs externas necessárias
                "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel.com https://*.googleapis.com https://*.vercel.app https://vitals.vercel-insights.com",
                
                // Workers: necessário para service workers e web workers
                "worker-src 'self' blob:",
                
                // Frames: Google Maps e outros iframes necessários
                "frame-src 'self' https://*.google.com https://*.gstatic.com",
              ]
              
              // Em produção, forçar HTTPS
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
      // Resolver conflito @swc/helpers entre pdfkit/fontkit e projeto
      '@swc/helpers': path.resolve(__dirname, 'node_modules/@swc/helpers'),
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

