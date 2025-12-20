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
    const allowBypass = isDev || req.headers.get('x-test-mode') === 'true'

    if (!allowBypass && (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie)) {
      return NextResponse.json({ error: 'csrf_failed' }, { status: 403 })
    }

    const body = await req.json()
    const user: UserData | undefined = body?.user
    const accessToken: string | undefined = body?.access_token || body?.token

    if (!user || !user.id || !user.email || !user.role) {
      return NextResponse.json({ error: "invalid_user_payload" }, { status: 400 })
    }

    // Payload no cookie (NÃO inclui access_token por segurança)
    // Cookie é HttpOnly, então não é acessível via JavaScript (proteção XSS)
    // O access_token deve ser obtido do cookie do Supabase ou header Authorization
    const sessionPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId ?? null
      // ✅ REMOVIDO: access_token não deve estar no cookie customizado
      // O token será obtido do cookie do Supabase (sb-{project}-auth-token) ou header Authorization
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
      // Nota: accessToken não é mais armazenado no cookie por segurança
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
