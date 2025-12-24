import { NextRequest, NextResponse } from "next/server"

import { successResponse, errorResponse } from '@/lib/api-response'
import { invalidateCachedAuth } from '@/lib/auth-cache'
import { logError } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Rate limit para logout (pode ser chamado mesmo sem auth válida)
  const rateLimitResponse = await applyRateLimit(req, 'auth')
  if (rateLimitResponse) return rateLimitResponse
  try {
    const url = new URL(req.url)
    const isSecure = url.protocol === "https:"

    // Extra: ler cookie atual para registro/auditoria mínima e invalidar cache
    const existing = req.cookies.get("golffox-session")?.value
    let userMeta: any = null
    let accessToken: string | null = null
    if (existing) {
      try {
        const decoded = Buffer.from(existing, "base64").toString("utf-8")
        userMeta = JSON.parse(decoded)
        // Extrair token para invalidar cache
        accessToken = userMeta?.access_token || userMeta?.accessToken || null
      } catch (_e) {
        userMeta = null
      }
    }

    // Invalidar cache de autenticação se houver token
    if (accessToken) {
      invalidateCachedAuth(accessToken)
    }

    const res = NextResponse.json({ ok: true, cleared: true, user: userMeta || null })

    // Remover cookie de sessão da aplicação (lido no middleware)
    // Usar httpOnly: true para corresponder ao cookie definido em set-session
    res.cookies.set({
      name: "golffox-session",
      value: "",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 0,
    })

    // Opcional: remover cookie auxiliar, se existir
    res.cookies.set({
      name: "golffox-auth",
      value: "",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 0,
    })

    return res
  } catch (error: unknown) {
    const err = error as { message?: string }
    logError('Erro ao limpar sessão', { error: err }, 'ClearSessionAPI')
    return errorResponse(err, 500, 'Erro ao limpar sessão')
  }
}

