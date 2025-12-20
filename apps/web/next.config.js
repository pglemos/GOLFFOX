/** @type {import('next').NextConfig} */
const path = require('path')
const isProd = process.env.NODE_ENV === 'production'

let nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  allowedDevOrigins: ['*.replit.dev', '*.replit.app', '*.picard.replit.dev'],
  // Corrigir warning sobre múltiplos lockfiles
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Logs detalhados de requisições de dados (fetch)
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  typescript: {
    // ⚠️ ATENÇÃO: ignoreBuildErrors está habilitado temporariamente
    // Estado atual: ~154 erros TypeScript restantes (principalmente tipos Supabase e Next.js 16)
    // Plano de remoção:
    // 1. Corrigir erros críticos primeiro (tipos de API, autenticação)
    // 2. Corrigir erros de tipos Supabase (regenerar tipos se necessário)
    // 3. Corrigir erros de componentes React
    // 4. Remover ignoreBuildErrors quando < 20 erros restantes
    // Ver: apps/web/CORRECOES_TYPESCRIPT.md para progresso
    ignoreBuildErrors: true,
  },
  // Transpile pacotes ESM problemáticos para CommonJS
  transpilePackages: ['@supabase/supabase-js'],

  // ✅ Code splitting avançado
  experimental: {
    // useWasmBinary: apenas em Windows local, Vercel usa Linux
    // Otimizar imports de pacotes grandes
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@tanstack/react-table',
      '@tanstack/react-query',
      'recharts',
      '@googlemaps/js-api-loader',
      '@react-google-maps/api',
    ],
    // instrumentationHook não é mais necessário no Next.js 16.1.0+
    // O arquivo instrumentation.ts é detectado automaticamente
  },

  // Configuração webpack para resolver problema ESM do Supabase
  webpack: (config) => {
    // Workaround (Windows + SWC WASM + webpack):
    // Alguns módulos CJS do próprio Next (dist/client/components) são analisados
    // pelo webpack como ESM e acabam sendo empacotados sem `exports`, quebrando
    // imports internos como `createCacheMap` e `isRedirectError`.
    // Forçamos esses arquivos a serem tratados como CommonJS dinâmico.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@supabase/supabase-js': require.resolve('@supabase/supabase-js'),
    }
    return config
  },

  // Configuração SWC: Next.js automaticamente usa WASM como fallback se binário nativo falhar
  // O binário nativo (@next/swc-win32-x64-msvc) é preferido para melhor performance
  // WASM é mais lento mas funciona como fallback se o binário nativo não carregar
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
                "connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:* https://*.supabase.co wss://*.supabase.co https://*.vercel.com https://*.googleapis.com https://*.vercel.app https://vitals.vercel-insights.com",

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
    // SWC: Next.js automaticamente usa WASM como fallback se o binário nativo falhar
    // Para forçar WASM (mais lento mas mais compatível), defina NEXT_SWC_WASM=true
    // O binário nativo (@next/swc-win32-x64-msvc) é preferido para melhor performance
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
}

module.exports = nextConfig
