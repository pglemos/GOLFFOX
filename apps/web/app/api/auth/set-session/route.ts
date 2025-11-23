import { NextRequest, NextResponse } from "next/server"
import { debug, error } from "@/lib/logger"

interface UserData {
  id: string
  email: string
  role: string
  companyId?: string | null
}

export async function POST(req: NextRequest) {
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

    // Payload completo no cookie para api-auth.ts funcionar
    const sessionPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId ?? null,
      access_token: accessToken // Necessário para validação no backend
    }

    // Serializa como Base64 (padrão do sistema)
    const cookieValue = Buffer.from(JSON.stringify(sessionPayload)).toString('base64')

    const url = new URL(req.url)
    const isSecure = url.protocol === "https:" || req.headers.get('x-forwarded-proto') === 'https'
    const host = req.headers.get('host') || 'unknown'

    debug('set-session: preparando cookie', {
      user: { id: user.id, role: user.role },
      hasToken: !!accessToken,
      host,
      isSecure,
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
