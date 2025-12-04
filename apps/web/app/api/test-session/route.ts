import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Rota de diagnóstico para testar cookies e sessão
 * Acesse: /api/test-session
 */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()

  // Obter todos os cookies
  const allCookies = req.cookies.getAll()
  const sessionCookie = cookieStore.get('golffox-session')
  const csrfCookie = cookieStore.get('golffox-csrf')

  // Tentar decodificar o cookie de sessão
  let sessionData = null
  if (sessionCookie?.value) {
    try {
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      sessionData = JSON.parse(decoded)
    } catch (e: any) {
      sessionData = { error: 'Falha ao decodificar', message: e.message }
    }
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
      session: {
        exists: !!sessionCookie,
        hasValue: !!sessionCookie?.value,
        valueLength: sessionCookie?.value?.length || 0,
        decoded: sessionData,
      },
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

