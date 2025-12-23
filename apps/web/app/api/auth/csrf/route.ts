import { randomBytes } from "crypto"

import { NextRequest, NextResponse } from "next/server"

import { successResponse, errorResponse } from '@/lib/api-response'
import { logError } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'

function generateToken(length = 32) {
  return randomBytes(length).toString('hex')
}

export async function GET(req: NextRequest) {
  // Aplicar rate limiting para prevenir abuso
  const rateLimitResponse = await applyRateLimit(req, 'auth')
  if (rateLimitResponse) return rateLimitResponse
  try {
    const token = generateToken(32)
    const url = new URL(req.url)
    const isSecure = url.protocol === 'https:'

    // Retornar token diretamente no objeto raiz para compatibilidade com código existente
    // E também dentro de 'data' para compatibilidade com successResponse
    const res = NextResponse.json({ 
      token, // Compatibilidade direta
      csrfToken: token, // Formato esperado pelos testes
      success: true,
      data: {
        token,
        csrfToken: token
      }
    })
    // ✅ CORREÇÃO: Usar 'lax' ao invés de 'strict' para funcionar corretamente na Vercel
    // 'lax' permite que o cookie seja enviado em requisições GET de navegação de nível superior
    // mas ainda protege contra CSRF em requisições POST cross-site
    // Em produção Vercel, 'strict' pode causar problemas com redirecionamentos
    res.cookies.set({
      name: 'golffox-csrf',
      value: token,
      path: '/',
      httpOnly: false, // permite estratégia de double-submit sem precisar ler cookie via JS
      sameSite: 'lax', // ✅ Mudado de 'strict' para 'lax' para compatibilidade com Vercel
      secure: isSecure,
      maxAge: 15 * 60, // 15 minutos
    })
    return res
  } catch (error: unknown) {
    logError('Erro ao gerar token CSRF', { error }, 'CSRFAPI')
    return NextResponse.json({ 
      error: 'Erro ao gerar token CSRF',
      success: false 
    }, { status: 500 })
  }
}
