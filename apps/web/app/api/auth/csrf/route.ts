import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { logError } from '@/lib/logger'

function generateToken(length = 32) {
  return randomBytes(length).toString('hex')
}

export async function GET(req: NextRequest) {
  try {
    const token = generateToken(32)
    const url = new URL(req.url)
    const isSecure = url.protocol === 'https:'

    // Retornar tanto 'token' (compatibilidade) quanto 'csrfToken' (formato esperado pelos testes)
    const res = NextResponse.json({ 
      token, // Mantém compatibilidade com código existente
      csrfToken: token // Formato esperado pelos testes
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
  } catch (error: any) {
    logError('Erro ao gerar token CSRF', { error }, 'CSRFAPI')
    return NextResponse.json(
      { error: 'Erro ao gerar token CSRF', message: error.message },
      { status: 500 }
    )
  }
}
