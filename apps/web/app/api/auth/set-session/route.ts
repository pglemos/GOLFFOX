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
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      return NextResponse.json({ error: 'csrf_failed' }, { status: 403 })
    }

    const body = await req.json()
    const user: UserData | undefined = body?.user

    if (!user || !user.id || !user.email || !user.role) {
      return NextResponse.json({ error: "invalid_user_payload" }, { status: 400 })
    }

    // Serialize and encode cookie value
    const cookieValue = Buffer.from(JSON.stringify(user)).toString("base64")

    const url = new URL(req.url)
    const isSecure = url.protocol === "https:"
    const host = req.headers.get('host') || 'unknown'
    const forwardedHost = req.headers.get('x-forwarded-host') || ''
    const origin = `${url.protocol}//${host}`

    debug('set-session: preparando cookie', {
      user: { id: user.id, email: user.email, role: user.role },
      host,
      forwardedHost,
      origin,
      isSecure,
    }, 'set-session')

    const res = NextResponse.json({ ok: true })

    res.cookies.set({
      name: "golffox-session",
      value: cookieValue,
      path: "/",
      httpOnly: true, // ✅ FIXED: Previne acesso via JavaScript (XSS protection)
      sameSite: "lax",
      secure: isSecure,
      maxAge: 60 * 60, // 1 hora
    })

    debug('set-session: cookie setado com sucesso', undefined, 'set-session')
    return res
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'unexpected_error'
    error("Erro ao setar cookie de sessão", { error: err }, 'set-session')
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
