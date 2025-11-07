import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Redirecionar /operator?company=* para /operator (limpar parâmetro)
  if (pathname === '/operator' && searchParams.has('company')) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('company')
    console.log('🔄 Middleware: Redirecionando /operator?company= para /operator')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Aplicar middleware apenas em rotas específicas
export const config = {
  matcher: [
    '/operator',
    '/operator/:path*',
  ],
}
