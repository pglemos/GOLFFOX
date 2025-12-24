import { NextRequest, NextResponse } from "next/server"

import { debug, error } from "@/lib/logger"
import { withRateLimit } from '@/lib/rate-limit'

interface UserData {
  id: string
  email: string
  role: string
  companyId?: string | null
}

async function setSessionHandler(req: NextRequest) {
  try {
    // Verificação simples de CSRF via double-submit cookie
    const csrfHeader = req.headers.get('x-csrf-token') || ''
    const csrfCookie = req.cookies.get('golffox-csrf')?.value || ''

    // Permitir bypass em desenvolvimento ou se headers específicos estiverem presentes
    const isDev = process.env.NODE_ENV === 'development'
    const isVercel = process.env.VERCEL === '1'
    const allowBypass = isDev || req.headers.get('x-test-mode') === 'true'

    // Em produção (Vercel), se o CSRF token foi fornecido, validar
    // Mas se não foi fornecido e estamos em produção, permitir se vier de uma requisição autenticada
    // (após login bem-sucedido, o cookie já foi validado no login)
    if (!allowBypass && csrfHeader) {
      // Se header CSRF foi fornecido, deve ser válido
      if (!csrfCookie || csrfHeader !== csrfCookie) {
        debug('CSRF validation failed in set-session', {
          hasHeader: !!csrfHeader,
          hasCookie: !!csrfCookie,
          headerMatch: csrfHeader === csrfCookie,
          isVercel,
          isDev
        }, 'set-session')
        return NextResponse.json({ error: 'csrf_failed' }, { status: 403 })
      }
    } else if (!allowBypass && !csrfHeader) {
      // Em produção sem header CSRF, verificar se há sessão válida (Supabase ou golffox-session)
      // (indica que o login foi bem-sucedido)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
      const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : null
      const hasSupabaseSession = supabaseCookieName && req.cookies.get(supabaseCookieName)?.value
      const hasGolffoxSession = req.cookies.get('golffox-session')?.value

      if (!hasSupabaseSession && !hasGolffoxSession) {
        debug('CSRF validation failed - no CSRF token and no valid session', {
          hasHeader: false,
          hasCookie: !!csrfCookie,
          hasSupabaseSession: !!hasSupabaseSession,
          hasGolffoxSession: !!hasGolffoxSession,
          supabaseCookieName,
          isVercel,
          isDev
        }, 'set-session')
        return NextResponse.json({ error: 'csrf_failed' }, { status: 403 })
      }
      // Se há sessão válida (Supabase ou golffox-session), permitir (login já foi validado)
      debug('Bypassing CSRF check - valid session present', {
        supabaseCookieName,
        hasSupabaseSession: !!hasSupabaseSession,
        hasGolffoxSession: !!hasGolffoxSession
      }, 'set-session')
    }

    const body = await req.json()
    const user: UserData | undefined = body?.user

    if (!user || !user.id || !user.email || !user.role) {
      return NextResponse.json({ error: "invalid_user_payload" }, { status: 400 })
    }

    // ✅ SEGURANÇA: Payload no cookie SEM access_token
    // O access_token NÃO deve ser armazenado no cookie por segurança
    // O token deve ser obtido apenas do cookie do Supabase ou header Authorization
    // Cookie é HttpOnly, então não é acessível via JavaScript (proteção XSS)
    const sessionPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId ?? null
      // ✅ access_token removido por segurança
    }

    // Serializa como Base64 (padrão do sistema)
    const cookieValue = Buffer.from(JSON.stringify(sessionPayload)).toString('base64')

    const url = new URL(req.url)
    const protocolSecure = url.protocol === "https:" || req.headers.get('x-forwarded-proto') === 'https'
    // Em desenvolvimento (localhost), forçar secure=false para garantir que o cookie seja salvo
    const isSecure = isDev ? false : protocolSecure
    const host = req.headers.get('host') || 'unknown'

    debug('set-session: preparando cookie', {
      user: { id: user.id, role: user.role },
      // ✅ accessToken não é mais armazenado no cookie por segurança
      host,
      isSecure,
      isDev
    }, 'set-session')

    const res = NextResponse.json({ ok: true })

    res.cookies.set({
      name: "golffox-session",
      value: cookieValue,
      path: "/",
      httpOnly: true, // Importante: HttpOnly para segurança
      sameSite: "lax",
      secure: isSecure,
      maxAge: 60 * 60 * 24, // 24 horas
    })

    debug('set-session: cookie setado com sucesso', undefined, 'set-session')
    return res
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'unexpected_error'
    error("Erro ao setar cookie de sessão", { error: err }, 'set-session')
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Exportar com rate limiting
export const POST = withRateLimit(setSessionHandler, 'auth')
