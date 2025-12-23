import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'

/**
 * Rota de diagnóstico para testar cookies e sessão
 * ⚠️ APENAS EM DESENVOLVIMENTO E COM ROLE ADMIN
 * Acesse: /api/test-session
 */
export async function GET(req: NextRequest) {
  // Restringir apenas a desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  // Verificar autenticação e role admin
  const authError = await requireAuth(req, 'admin')
  if (authError) {
    return authError
  }

  const cookieStore = cookies()
  
  // Obter todos os cookies (sem decodificar dados sensíveis)
  const allCookies = req.cookies.getAll()
  const sessionCookie = (await cookieStore).get('golffox-session')
  const csrfCookie = (await cookieStore).get('golffox-csrf')
  
  // ⚠️ NÃO decodificar cookie de sessão em produção (mesmo em dev, apenas metadados)
  // Apenas indicar existência e tamanho, sem expor conteúdo
  const sessionInfo = sessionCookie?.value ? {
    exists: true,
    hasValue: true,
    valueLength: sessionCookie.value.length,
    // Não decodificar para evitar vazamento de token/PII
    decoded: null
  } : {
    exists: false,
    hasValue: false,
    valueLength: 0,
    decoded: null
  }
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
    },
    headers: {
      host: req.headers.get('host'),
      'x-forwarded-proto': req.headers.get('x-forwarded-proto'),
      'user-agent': req.headers.get('user-agent'),
      cookie: req.headers.get('cookie') ? '[PRESENTE]' : '[AUSENTE]',
    },
    cookies: {
      total: allCookies.length,
      list: allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
      session: sessionInfo,
      csrf: {
        exists: !!csrfCookie,
        hasValue: !!csrfCookie?.value,
        valueLength: csrfCookie?.value?.length || 0,
      },
    },
    url: {
      protocol: req.nextUrl.protocol,
      host: req.nextUrl.host,
      pathname: req.nextUrl.pathname,
    },
  }
  
  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

